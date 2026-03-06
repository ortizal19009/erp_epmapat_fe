import { AfterViewInit, Component, OnInit } from '@angular/core';
import { AbonadosService } from 'src/app/servicios/abonados.service';
import { EmisionService } from 'src/app/servicios/emision.service';
import * as L from 'leaflet';
import { RutasService } from 'src/app/servicios/rutas.service';
import { ColoresService } from 'src/app/compartida/colores.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit, AfterViewInit {

  // ══════════════════════════════════════
  //   PROPIEDADES
  // ══════════════════════════════════════

  _resumenEmisiones: any;
  _ByEstados: any;
  _ByCategorias: any;
  _rutas: any;
  _abonados: any[] = [];
  abonados: any;
  filtro: string = '';
  txtModal: string = 'DETALLES';
  hoy = new Date();

  edificioMatriz: any = [0.8038125013453109, -77.72763063596486];

  _ubicaciones = [
    { nombre: 'EPMAPA-T (Matriz)',       direccion: 'Juan Ramón Arellano y Bolívar', color: 'teal',  coords: [0.8038125013453109, -77.72763063596486] as L.LatLngExpression },
    { nombre: 'Edf. Comercialización',   direccion: 'Tulcán, Carchi',               color: 'green', coords: null },
    { nombre: 'Planta de Tratamiento',   direccion: 'Tulcán, Carchi',               color: 'blue',  coords: null },
    { nombre: 'Tanques de Agua',         direccion: 'Tulcán, Carchi',               color: 'amber', coords: null },
  ];

  private map!: L.Map | undefined;
  private citiesLayer: L.LayerGroup | null = null;

  // ══════════════════════════════════════
  //   GETTERS (KPIs calculados)
  // ══════════════════════════════════════

  get totalAbonados(): number {
    if (!this._ByEstados?.length) return 0;
    return this._ByEstados.reduce((sum: number, e: any) => sum + (e.ncuentas || 0), 0);
  }

  get totalCobrado(): number {
    if (!this._resumenEmisiones?.length) return 0;
    return this._resumenEmisiones[0]?.total_pagado ?? 0;
  }

  get totalPendiente(): number {
    if (!this._resumenEmisiones?.length) return 0;
    return this._resumenEmisiones[0]?.total_pendiente ?? 0;
  }

  get totalM3(): number {
    if (!this._resumenEmisiones?.length) return 0;
    return this._resumenEmisiones[0]?.m3 ?? 0;
  }

  // ══════════════════════════════════════
  //   CONSTRUCTOR
  // ══════════════════════════════════════

  constructor(
    private s_emisiones: EmisionService,
    private s_abonados: AbonadosService,
    private s_rutas: RutasService,
    private coloresService: ColoresService,
  ) {}

  // ══════════════════════════════════════
  //   CICLO DE VIDA
  // ══════════════════════════════════════

  ngOnInit(): void {
    sessionStorage.setItem('ventana', '/estados-convenios');
    const coloresJSON = sessionStorage.getItem('/estados-convenios');
    if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));
    else this.buscaColor();

    this.getResumenEmisiones(12);
    this.getDatosAbonados();
    this.getRutas();
  }

  ngAfterViewInit(): void {
    this.drawAllCuentas();
  }

  // ══════════════════════════════════════
  //   COLORES
  // ══════════════════════════════════════

  colocaColor(colores: any) {
    document.documentElement.style.setProperty('--bgcolor1', colores[0]);
    const cabecera = document.querySelector('.cabecera');
    if (cabecera) cabecera.classList.add('nuevoBG1');
    document.documentElement.style.setProperty('--bgcolor2', colores[1]);
    const detalle = document.querySelector('.detalle');
    if (detalle) detalle.classList.add('nuevoBG2');
  }

  async buscaColor() {
    try {
      const datos = await this.coloresService.setcolor(1, 'cv-facturas');
      sessionStorage.setItem('/cv-facturas', JSON.stringify(datos));
      this.colocaColor(datos);
    } catch (error) {
      console.error(error);
    }
  }

  // ══════════════════════════════════════
  //   MAPA
  // ══════════════════════════════════════

  drawAllCuentas(): void {
    const cuenta: L.Marker[] = [];

    if (this._abonados.length > 0) {
      this._abonados.forEach((item: any) => {
        try {
          if (item.geolocalizacion != null) {
            const coordsArray: L.LatLngExpression = JSON.parse(item.geolocalizacion);
            const marker = L.marker(coordsArray).bindPopup(`Abonado ID: ${item.idabonado}`);
            cuenta.push(marker);
          }
        } catch (e) {
          console.error('Error al parsear coordenadas:', item.geolocalizacion);
        }
      });
    } else {
      const marker = L.marker(this.edificioMatriz).bindPopup('Edificio Epmapa-T');
      cuenta.push(marker);
    }

    const nuevaCitiesLayer = L.layerGroup(cuenta);

    const osm = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; EPMAPA-T',
    });

    const osmHOT = L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; EPMAPA-T',
    });

    const baseMaps   = { OpenStreetMap: osm, 'OpenStreetMap HOT': osmHOT };
    const overlayMaps = { Cuentas: nuevaCitiesLayer };

    if (this.map) {
      if (this.citiesLayer) this.map.removeLayer(this.citiesLayer);
      this.citiesLayer = nuevaCitiesLayer;
      this.citiesLayer.addTo(this.map);
      const mainView: L.LatLngExpression = JSON.parse(this._abonados[0].geolocalizacion);
      this.map.setView(mainView, 17);
    } else {
      this.map = L.map('map', {
        center: this.edificioMatriz,
        zoom: 19,
        layers: [osm, nuevaCitiesLayer],
      });
      this.citiesLayer = nuevaCitiesLayer;
      L.control.layers(baseMaps, overlayMaps).addTo(this.map);
    }
  }

  verUbicacion(ub: any) {
    if (!ub.coords || !this.map) return;
    this.map.setView(ub.coords, 17);
  }

  // ══════════════════════════════════════
  //   DATOS
  // ══════════════════════════════════════

  async getResumenEmisiones(limit: number) {
    this._resumenEmisiones = await this.s_emisiones.getResumenEmision(limit);
  }

  async getDatosAbonados() {
    this._ByCategorias = await this.s_abonados.getCuentasByCategoria();
    this._ByEstados    = await this.s_abonados.getCuentasByEstado();
  }

  getRutas() {
    this.s_rutas.getNcuentasByRutas().subscribe({
      next: (datos: any) => (this._rutas = datos),
      error: (e: any) => console.error(e.error),
    });
  }

  async getAbonadosByRutas(idruta: number) {
    this._abonados = [];
    this._abonados = await this.s_abonados.getByIdrutaAsync(idruta);
    this.drawAllCuentas();
  }

  findCuentasByEstado(estado: any) {
    this.s_abonados.getByEstado(estado.estado).subscribe({
      next: (datos: any) => (this.abonados = datos),
      error: (e: any) => console.error(e),
    });
  }

  // ══════════════════════════════════════
  //   UTILIDADES UI
  // ══════════════════════════════════════

  getCategoriaPct(ncuentas: number): number {
    if (!this._ByCategorias?.length) return 0;
    const max = Math.max(...this._ByCategorias.map((c: any) => c.ncuentas));
    return max > 0 ? (ncuentas / max) * 100 : 0;
  }
}