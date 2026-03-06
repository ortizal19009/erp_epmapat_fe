import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InfoHelpComponent } from '../../../shared/help/info-help';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { DocumentoListItem } from '../../../core/models/documento-list-item';
import { DocumentosApi } from '../../../core/api/documentos-api';
import { DependencyApi } from '../../../core/api/dependency-api';
import { DocumentTypeApi } from '../../../core/api/document-type-api';
import { LookupsApi } from '../../../core/api/lookups-api';
import { CcdApi } from '../../../core/api/ccd-api';

type Flow = 'INGRESO' | 'SALIDA' | '';
type Status =
  | 'BORRADOR'
  | 'EN_REVISION'
  | 'EMITIDO'
  | 'DERIVADO'
  | 'RECIBIDO'
  | 'ARCHIVADO'
  | 'ANULADO'
  | '';

const ENTITY_CODE = 'EPMAPA-T';

@Component({
  selector: 'app-documentos-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, InfoHelpComponent],
  templateUrl: './documentos-list.html',
  styleUrls: ['./documentos-list.css']
})
export class DocumentosListComponent implements OnInit {
  currentRole = this.getRole();
  items: DocumentoListItem[] = [];
  overdueItems: any[] = [];
  dueSoonItems: any[] = [];
  loading = false;
  error: string | null = null;

  q = '';
  flow: Flow = '';
  status: Status = '';
  dependencyId = '';
  typeId = '';
  userId = '';
  dateFrom = '';
  dateTo = '';
  seriesId = '';
  subseriesId = '';
  series: any[] = [];
  subseries: any[] = [];
  dependencies: any[] = [];
  docTypes: any[] = [];
  users: any[] = [];
  page = 1;
  pageSize = 20;
  total = 0;
  pages = 1;
  sortField: string = 'creado_en';
  sortDir: 'asc' | 'desc' = 'desc';

  constructor(private api: DocumentosApi, private router: Router, private depsApi: DependencyApi, private typesApi: DocumentTypeApi, private lookupsApi: LookupsApi, private ccdApi: CcdApi) {}


  private getRole(): string {
    try {
      return (globalThis.localStorage?.getItem('gd.role') || 'ADMIN').toUpperCase();
    } catch { return 'ADMIN'; }
  }

  private getUserId(): string {
    try { return globalThis.localStorage?.getItem('gd.user_id') || ''; }
    catch { return ''; }
  }

  hasRole(...roles: string[]): boolean {
    return roles.includes(this.currentRole);
  }


  ngOnInit(): void {
    this.page = 1;
    this.userId = this.getUserId();
    this.depsApi.list(ENTITY_CODE).subscribe({ next: (r) => this.dependencies = r || [] });
    this.typesApi.list(ENTITY_CODE).subscribe({ next: (r) => this.docTypes = r || [] });
    this.lookupsApi.users(ENTITY_CODE, '', 1, 200).subscribe({ next: (r) => this.users = r?.items || [] });
    this.ccdApi.listSeries(ENTITY_CODE).subscribe({ next: (r) => this.series = r || [] });
    this.load();
    this.loadOverdue();
    this.loadDueSoon();
  }

  load(): void {
    this.loading = true;
    this.error = null;
    if (!this.userId) this.userId = this.getUserId();

    this.api.list(ENTITY_CODE, {
      q: this.q?.trim() || undefined,
      flujo: this.flow || undefined,
      estado: this.status || undefined,
      dependency_id: this.dependencyId || undefined,
      type_id: this.typeId || undefined,
      user_id: this.userId || undefined,
      date_from: this.dateFrom || undefined,
      date_to: this.dateTo || undefined,
      series_id: this.seriesId || undefined,
      subseries_id: this.subseriesId || undefined,
      page: this.page,
      page_size: this.pageSize
    }).subscribe({
      next: (res) => {
        this.items = this.sortRows(res?.items || []);
        this.total = res?.total || 0;
        this.pages = res?.pages || 1;
      },
      error: (e) => {
        console.error(e);
        this.error = e?.error?.detail || e?.message || 'Error cargando documentos';
      },
      complete: () => this.loading = false
    });
  }

  loadOverdue(): void {
    this.api.overdue(ENTITY_CODE).subscribe({
      next: (rows) => this.overdueItems = rows || [],
      error: () => this.overdueItems = []
    });
  }

  loadDueSoon(): void {
    this.api.dueSoon(ENTITY_CODE, 48).subscribe({
      next: (rows) => this.dueSoonItems = rows || [],
      error: () => this.dueSoonItems = []
    });
  }

  prevPage(): void { if (this.page > 1) { this.page--; this.load(); } }

  nextPage(): void { if (this.page < this.pages) { this.page++; this.load(); } }

  onSeriesChange(): void {
    this.subseriesId = '';
    const sid = this.seriesId;
    if (!sid) { this.subseries = []; return; }
    this.ccdApi.listSubseries(sid).subscribe({ next: (r) => this.subseries = r || [] });
  }

  clearFilters(): void {
    this.q = '';
    this.flow = '';
    this.status = '';
    this.dependencyId = '';
    this.typeId = '';
    this.userId = this.getUserId();
    this.dateFrom = '';
    this.dateTo = '';
    this.seriesId = '';
    this.subseriesId = '';
    this.subseries = [];
    this.load();
  }

  refreshOverdueNow(): void {
    this.api.refreshOverdue(ENTITY_CODE).subscribe({
      next: (rows) => {
        const total = Array.isArray(rows) ? rows.length : 0;
        alert(`Vencidos recalculados: ${total} documento(s)`);
        this.load();
        this.loadOverdue();
        this.loadDueSoon();
      },
      error: (e) => alert(e?.error?.detail || "Error refrescando vencidos")
    });
  }

  generateAlertsNow(): void {
    this.api.generateAlerts(ENTITY_CODE).subscribe({
      next: (res) => {
        alert(`Alertas generadas: 24h=${res.t24_created || 0}, vencido=${res.overdue_created || 0}`);
      },
      error: (e) => alert(e?.error?.detail || "Error generando alertas")
    });
  }

  goNew(): void {
    this.router.navigate(['/gd/documentos/nuevo']);
  }

  view(doc: DocumentoListItem): void {
    this.router.navigate(['/gd/documentos', doc.id]);
  }

  edit(doc: DocumentoListItem): void {
    this.router.navigate(['/gd/documentos', doc.id, 'editar']);
  }

  canEdit(doc: DocumentoListItem): boolean {
    if (!this.hasRole('RECEPCION','RESPONSABLE','SUPERVISOR','ADMIN')) return false;
    return doc.estado === 'BORRADOR' || doc.estado === 'EN_REVISION';
  }

  canEmit(doc: DocumentoListItem): boolean {
    if (!this.hasRole('SUPERVISOR','ADMIN')) return false;
    return doc.estado === 'BORRADOR' || doc.estado === 'EN_REVISION';
  }

  canReceive(doc: DocumentoListItem): boolean {
    if (!this.hasRole('RECEPCION','SUPERVISOR','ADMIN')) return false;
    return doc.estado === 'EMITIDO' || doc.estado === 'DERIVADO';
  }

  emit(doc: DocumentoListItem): void {
    if (!this.canEmit(doc)) return;

    const ok = confirm(`¿Emitir el documento "${doc.asunto}"?`);
    if (!ok) return;

    this.api.emit(doc.id, null).subscribe({
      next: (res) => {
        alert(`Emitido con número: ${res.numero_oficial}`);
        this.load();
        this.loadOverdue();
        this.loadDueSoon();
      },
      error: (e) => {
        console.error(e);
        alert(e?.error?.detail || 'Error al emitir documento');
      }
    });
  }

  receive(doc: DocumentoListItem): void {
    if (!this.canReceive(doc)) return;

    const mode = prompt('Recepción: escribe "P" para persona o "D" para dependencia:', 'D');
    if (!mode) return;

    if (mode.toUpperCase() === 'P') {
      const receptorId = prompt('Ingrese receiver_id (UUID persona):', '');
      if (!receptorId) return;

      this.api.receive(doc.id, {
        receptor_id: receptorId,
        comentario: 'Recibido (persona)',
        usuario_id: null
      }).subscribe({
        next: () => {
          alert('Recepción registrada');
          this.load();
          this.loadOverdue();
          this.loadDueSoon();
        },
        error: (e) => {
          console.error(e);
          alert(e?.error?.detail || 'Error al recibir documento');
        }
      });
    } else {
      const depId = prompt('Ingrese dependency_id (UUID dependencia):', '');
      if (!depId) return;

      this.api.receive(doc.id, {
        dependencia_id: depId,
        comentario: 'Recibido (dependencia)',
        usuario_id: null
      }).subscribe({
        next: () => {
          alert('Recepción registrada');
          this.load();
          this.loadOverdue();
          this.loadDueSoon();
        },
        error: (e) => {
          console.error(e);
          alert(e?.error?.detail || 'Error al recibir documento');
        }
      });
    }
  }

  deadlineClass(d: any): string {
    if (!d?.requiere_respuesta || !d?.fecha_plazo) return 'text-muted';
    const due = new Date(d.fecha_plazo).getTime();
    const now = Date.now();
    const diffH = (due - now) / 3600000;
    if (diffH < 0) return 'text-danger font-weight-bold';
    if (diffH <= 24) return 'text-warning font-weight-bold';
    return 'text-success font-weight-bold';
  }

  deadlineLabel(d: any): string {
    if (!d?.requiere_respuesta || !d?.fecha_plazo) return 'No aplica';
    const due = new Date(d.fecha_plazo).getTime();
    const now = Date.now();
    const diffH = Math.round((due - now) / 3600000);
    if (diffH < 0) return `Vencido ${Math.abs(diffH)}h`;
    if (diffH <= 24) return `Por vencer (${diffH}h)`;
    return `En plazo (${diffH}h)`;
  }

  get kpiPendientes(): number {
    return this.items.filter((x: any) => x.estado === 'BORRADOR' || x.estado === 'EN_REVISION' || x.estado === 'DERIVADO').length;
  }

  get kpiRespondidos(): number {
    return this.items.filter((x: any) => x.estado_respuesta === 'RESPONDIDO').length;
  }

  get kpiVencidos(): number { return this.overdueItems.length; }
  get kpiPorVencer(): number { return this.dueSoonItems.length; }

  setSort(field: string): void {
    if (this.sortField === field) this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    else { this.sortField = field; this.sortDir = 'asc'; }
    this.items = this.sortRows(this.items);
  }

  sortIcon(field: string): string {
    if (this.sortField !== field) return "↕";
    return this.sortDir === 'asc' ? "▲" : "▼";
  }

  private sortRows(rows: any[]): any[] {
    const f = this.sortField;
    const d = this.sortDir === 'asc' ? 1 : -1;
    return [...rows].sort((a,b) => {
      const av = (a?.[f] ?? "").toString();
      const bv = (b?.[f] ?? "").toString();
      if (!isNaN(Date.parse(av)) && !isNaN(Date.parse(bv))) return (new Date(av).getTime()-new Date(bv).getTime())*d;
      if (!isNaN(Number(av)) && !isNaN(Number(bv))) return (Number(av)-Number(bv))*d;
      return av.localeCompare(bv,'es',{sensitivity:'base'})*d;
    });
  }

  badgeClass(status: string): string {
    switch (status) {
      case 'BORRADOR': return 'bg-secondary';
      case 'EN_REVISION': return 'bg-warning text-dark';
      case 'EMITIDO': return 'bg-primary';
      case 'DERIVADO': return 'bg-info text-dark';
      case 'RECIBIDO': return 'bg-success';
      case 'ARCHIVADO': return 'bg-dark';
      case 'ANULADO': return 'bg-danger';
      default: return 'bg-light text-dark';
    }
  }
}



