import { CommonModule } from '@angular/common';
import { InfoHelpComponent } from '../../../shared/help/info-help';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DocumentosApi } from '../../../core/api/documentos-api';
import { LookupsApi } from '../../../core/api/lookups-api';
import { DependencyApi } from '../../../core/api/dependency-api';

const ENTITY_CODE = 'EPMAPA-T';

@Component({
  selector: 'app-inbox',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, InfoHelpComponent],
  templateUrl: './inbox.html',
  styleUrls: ['./inbox.css'],
})
export class InboxComponent {
  currentRole = this.getRole();
  toUserId = this.getUserId();
  toDependencyId = '';
  onlyMyDependency = true;
  rows: any[] = [];
  receptionRows: any[] = [];
  users: any[] = [];
  dependencies: any[] = [];
  loading = false;
  page = 1;
  pageSize = 20;
  total = 0;
  pages = 1;
  sortField: string = 'creado_en';
  sortDir: 'asc' | 'desc' = 'desc';
  error: string | null = null;


  private getRole(): string {
    try {
      return (globalThis.localStorage?.getItem('gd.role') || 'ADMIN').toUpperCase();
    } catch { return 'ADMIN'; }
  }

  private getUserId(): string {
    try { return globalThis.localStorage?.getItem('gd.user_id') || ''; }
    catch { return ''; }
  }

  private getSessionDependencyId(): string {
    try {
      return globalThis.localStorage?.getItem('gd.dependency_id')
        || globalThis.localStorage?.getItem('gd.dep_id')
        || globalThis.localStorage?.getItem('gd.dependencia_id')
        || '';
    } catch { return ''; }
  }

  hasRole(...roles: string[]): boolean {
    return roles.includes(this.currentRole);
  }


  constructor(private api: DocumentosApi, private router: Router, private lookupsApi: LookupsApi, private depsApi: DependencyApi) {
    this.toDependencyId = this.getSessionDependencyId();
    this.loadLookups();
    this.loadReceptions();
  }

  loadLookups(): void {
    this.lookupsApi.users(ENTITY_CODE, '', 1, 200).subscribe({ next: (r) => this.users = r?.items || [] });
    this.depsApi.list(ENTITY_CODE).subscribe({ next: (r) => this.dependencies = r || [] });
  }

  load(): void {
    this.loading = true;
    this.error = null;
    if (!this.toUserId) this.toUserId = this.getUserId();
    this.api.pendingDerivations({
      to_user_id: this.toUserId || undefined,
      to_dependency_id: this.toDependencyId || undefined,
      page: this.page,
      page_size: this.pageSize,
    }).subscribe({
      next: (data) => {
        this.rows = this.sortRows(data?.items || []);
        this.total = data?.total || 0;
        this.pages = data?.pages || 1;
      },
      error: (e) => this.error = e?.error?.detail || e?.message || 'Error cargando bandeja',
      complete: () => this.loading = false,
    });
  }

  loadReceptions(): void {
    if (!this.toUserId) this.toUserId = this.getUserId();
    const depFilter = this.onlyMyDependency ? (this.toDependencyId || this.getSessionDependencyId()) : this.toDependencyId;
    this.api.pendingReceptions({
      entity_code: ENTITY_CODE,
      receiver_id: this.toUserId || undefined,
      dependency_id: depFilter || undefined,
    }).subscribe({
      next: (rows) => this.receptionRows = this.sortReceptionRows(rows || []),
      error: () => this.receptionRows = []
    });
  }

  prevPage(): void { if (this.page > 1) { this.page--; this.load(); } }

  nextPage(): void { if (this.page < this.pages) { this.page++; this.load(); } }

  goRespond(row: any): void {
    this.router.navigate(['/gd/documentos', row.documento_id, 'editar'], { queryParams: { derivationId: row.id } });
  }

  markRead(row: any): void {
    this.api.markDerivationRead(row.id, this.toUserId || undefined).subscribe({
      next: () => this.load(),
      error: (e) => alert(e?.error?.detail || 'Error marcando leído')
    });
  }

  receivePending(row: any, openAfter: boolean = false): void {
    const role = this.currentRole;
    const userId = this.toUserId || this.getUserId();
    this.api.receive(row.documento_id, {
      receptor_id: row.receptor_id || undefined,
      dependencia_id: row.dependencia_id || this.toDependencyId || undefined,
      comentario: 'Recepción desde bandeja',
      usuario_id: userId || null,
      user_role: role,
    }).subscribe({
      next: () => {
        this.loadReceptions();
        this.load();
        if (openAfter) this.router.navigate(['/gd/documentos', row.documento_id]);
      },
      error: (e) => alert(e?.error?.detail || 'Error registrando recepción')
    });
  }

  exportCsv(): void {
    const headers = ['derivation_id','documento_id','asunto','fecha_plazo','estado'];
    const lines = this.rows.map(r => [r.id, r.documento_id, r.asunto, r.fecha_plazo || '', r.estado]);
    const csv = [headers, ...lines].map(row => row.map(v => `"${String(v ?? '').replace(/"/g,'""')}"`).join(',')).join('\\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `bandeja_derivaciones_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  setSort(field: string): void {
    if (this.sortField === field) this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    else { this.sortField = field; this.sortDir = 'asc'; }
    this.rows = this.sortRows(this.rows);
  }

  sortIcon(field: string): string {
    if (this.sortField !== field) return "↕";
    return this.sortDir === 'asc' ? "▲" : "▼";
  }

  private sortRows(rows: any[]): any[] {
    const f = this.sortField; const d = this.sortDir === 'asc' ? 1 : -1;
    return [...rows].sort((a,b)=>{
      const av=(a?.[f]??"").toString(); const bv=(b?.[f]??"").toString();
      if (!isNaN(Date.parse(av)) && !isNaN(Date.parse(bv))) return (new Date(av).getTime()-new Date(bv).getTime())*d;
      return av.localeCompare(bv,'es',{sensitivity:'base'})*d;
    });
  }

  statusBadge(status: string): string {
    switch (status) {
      case 'PENDIENTE': return 'bg-secondary';
      case 'LEIDO': return 'bg-info text-dark';
      case 'EN_GESTION': return 'bg-primary';
      case 'VENCIDO': return 'bg-danger';
      case 'RESPONDIDO': return 'bg-success';
      default: return 'bg-light text-dark';
    }
  }

  dependencyLabel(depId?: string): string {
    if (!depId) return '—';
    const d = this.dependencies.find((x: any) => String(x?.id) === String(depId));
    return d ? `${d.codigo} - ${d.nombre}` : depId;
  }

  pendingAgeLabel(row: any): string {
    const base = row?.created_at || row?.creado_en || row?.fecha_emision || row?.fecha_elaboracion;
    if (!base) return '—';
    const t = new Date(base).getTime();
    if (Number.isNaN(t)) return '—';
    const diffH = Math.floor((Date.now() - t) / 3600000);
    if (diffH < 24) return `${Math.max(0, diffH)}h`;
    const days = Math.floor(diffH / 24);
    return `${days}d ${diffH % 24}h`;
  }

  pendingAgeClass(row: any): string {
    const base = row?.created_at || row?.creado_en || row?.fecha_emision || row?.fecha_elaboracion;
    if (!base) return 'text-muted';
    const t = new Date(base).getTime();
    if (Number.isNaN(t)) return 'text-muted';
    const diffH = Math.floor((Date.now() - t) / 3600000);
    if (diffH >= 72) return 'text-danger font-weight-bold';
    if (diffH >= 24) return 'text-warning font-weight-bold';
    return 'text-success font-weight-bold';
  }

  private receptionBaseTime(row: any): number {
    const base = row?.created_at || row?.creado_en || row?.fecha_emision || row?.fecha_elaboracion;
    const t = base ? new Date(base).getTime() : Number.NaN;
    return Number.isNaN(t) ? Number.MAX_SAFE_INTEGER : t;
  }

  private sortReceptionRows(rows: any[]): any[] {
    return [...rows].sort((a, b) => this.receptionBaseTime(a) - this.receptionBaseTime(b));
  }
}





