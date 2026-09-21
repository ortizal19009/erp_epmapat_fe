import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { TrazabilidadService } from '../../services/trazabilidad.service';
import { UsuarioService } from 'src/app/servicios/administracion/usuario.service';
import * as L from 'leaflet';

@Component({
  selector: 'app-tracking-monitor',
  templateUrl: './tracking-monitor.component.html',
  styleUrls: ['./tracking-monitor.component.css']
})
export class TrackingMonitorComponent implements OnInit, AfterViewInit, OnDestroy {
  private map: any;
  private routePath: any;
  private readerMarker: any;

  sessions: any[] = [];
  readers: any[] = [];
  selectedSession: any = null;
  points: any[] = [];

  // Filtros
  filterReaderId: number | null = null;
  filterDate: string | null = null;

  playbackIndex = 0;
  isPlaying = false;
  playbackSpeed = 100;
  playbackInterval: any;

  constructor(
    private trackingService: TrazabilidadService,
    private usuarioService: UsuarioService
  ) {}

  ngOnInit(): void {
    this.loadReaders();
    this.loadSessions();
  }

  ngAfterViewInit(): void {
    this.initMap();
  }

  ngOnDestroy(): void {
    if (this.playbackInterval) clearInterval(this.playbackInterval);
  }

  private initMap(): void {
    this.map = L.map('tracking-map').setView([0.8354, -77.7171], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);
  }

  loadReaders(): void {
    this.usuarioService.getUsuarios().subscribe(data => {
      this.readers = data.filter(u => {
        const isEnabled = u.estado === true;
        const access = (u.plataform_access || '').toUpperCase();
        const hasMobileAccess = ['MOBILE', 'BOTH', 'T', 'TRUE', '1'].includes(access);
        return isEnabled && hasMobileAccess;
      });
    });
  }

  loadSessions(): void {
    this.trackingService.getSessions(this.filterReaderId || undefined, this.filterDate || undefined).subscribe(data => {
      this.sessions = data;
    });
  }

  applyFilters(): void {
    this.selectedSession = null;
    if (this.routePath) this.map.removeLayer(this.routePath);
    if (this.readerMarker) this.map.removeLayer(this.readerMarker);
    this.loadSessions();
  }

  clearFilters(): void {
    this.filterReaderId = null;
    this.filterDate = null;
    this.applyFilters();
  }

  onSelectSession(session: any): void {
    this.selectedSession = session;
    this.trackingService.getSessionFullTrace(session.id).subscribe(data => {
      this.points = data.points;
      this.drawRoute();
    });
  }

  drawRoute(): void {
    if (this.routePath) this.map.removeLayer(this.routePath);
    if (this.readerMarker) this.map.removeLayer(this.readerMarker);

    const latlngs = this.points.map(p => [p.latitude, p.longitude]);
    this.routePath = L.polyline(latlngs as any, { color: 'cyan', weight: 5 }).addTo(this.map);

    this.map.fitBounds(this.routePath.getBounds());

    this.playbackIndex = 0;
    const start = this.points[0];
    this.readerMarker = L.marker([start.latitude, start.longitude]).addTo(this.map);
  }

  togglePlayback(): void {
    this.isPlaying = !this.isPlaying;
    if (this.isPlaying) {
      this.playbackInterval = setInterval(() => {
        this.nextStep();
      }, 500 / this.playbackSpeed);
    } else {
      clearInterval(this.playbackInterval);
    }
  }

  private nextStep(): void {
    if (this.playbackIndex < this.points.length - 1) {
      this.playbackIndex++;
      const p = this.points[this.playbackIndex];
      this.readerMarker.setLatLng([p.latitude, p.longitude]);
      this.map.panTo([p.latitude, p.longitude]);
    } else {
      this.isPlaying = false;
      clearInterval(this.playbackInterval);
    }
  }
}
