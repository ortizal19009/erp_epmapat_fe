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
  toUserId = '';
  toDependencyId = '';
  rows: any[] = [];
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

  hasRole(...roles: string[]): boolean {
    return roles.includes(this.currentRole);
  }


  constructor(private api: DocumentosApi, private router: Router, private lookupsApi: LookupsApi, private depsApi: DependencyApi) {
    this.loadLookups();
  }

  loadLookups(): void {
    this.lookupsApi.users(ENTITY_CODE, '', 1, 200).subscribe({ next: (r) => this.users = r?.items || [] });
    this.depsApi.list(ENTITY_CODE).subscribe({ next: (r) => this.dependencies = r || [] });
  }

  load(): void {
    this.loading = true;
    this.error = null;
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

  prevPage(): void { if (this.page > 1) { this.page--; this.load(); } }

  nextPage(): void { if (this.page < this.pages) { this.page++; this.load(); } }

  goRespond(row: any): void {
    this.router.navigate(['/documents', row.documento_id, 'edit'], { queryParams: { derivationId: row.id } });
  }

  markRead(row: any): void {
    this.api.markDerivationRead(row.id, this.toUserId || undefined).subscribe({
      next: () => this.load(),
      error: (e) => alert(e?.error?.detail || 'Error marcando leído')
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
}




