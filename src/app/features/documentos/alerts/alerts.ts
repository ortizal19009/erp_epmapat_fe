import { CommonModule } from '@angular/common';
import { InfoHelpComponent } from '../../../shared/help/info-help';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DocumentosApi } from '../../../core/api/documentos-api';

const ENTITY_CODE = 'EPMAPA-T';

@Component({
  selector: 'app-alerts',
  standalone: true,
  imports: [CommonModule, FormsModule, InfoHelpComponent],
  templateUrl: './alerts.html',
  styleUrls: ['./alerts.css'],
})
export class AlertsComponent {
  currentRole = this.getRole();
  rows: any[] = [];
  loading = false;
  error: string | null = null;
  state = 'PENDIENTE';
  dispatchChannel = 'TELEGRAM';
  page = 1;
  pageSize = 20;
  total = 0;
  pages = 1;
  sortField: string = 'scheduled_at';
  sortDir: 'asc' | 'desc' = 'desc';


  private getRole(): string {
    try {
      return (globalThis.localStorage?.getItem('gd.role') || 'ADMIN').toUpperCase();
    } catch { return 'ADMIN'; }
  }

  hasRole(...roles: string[]): boolean {
    return roles.includes(this.currentRole);
  }


  constructor(private api: DocumentosApi) {
    this.load();
  }

  dispatchPending(): void {
    this.api.dispatchAlerts(ENTITY_CODE, this.dispatchChannel, 100).subscribe({
      next: (r) => {
        alert(`Dispatch ${r.channel}: enviados=${r.sent}, errores=${r.errors}, omitidos=${r.skipped}`);
        this.load();
      },
      error: (e) => this.error = e?.error?.detail || e?.message || 'Error despachando alertas'
    });
  }

  generate(): void {
    this.api.generateAlerts(ENTITY_CODE).subscribe({
      next: () => this.load(),
      error: (e) => this.error = e?.error?.detail || e?.message || 'Error generando alertas'
    });
  }

  exportCsv(): void {
    const headers = ['tipo','documento_id','asunto','fecha_plazo','estado','scheduled_at'];
    const lines = this.rows.map(r => [r.tipo, r.documento_id, r.asunto, r.fecha_plazo || '', r.estado, r.scheduled_at || '']);
    const csv = [headers, ...lines].map(row => row.map(v => `"${String(v ?? '').replace(/"/g,'""')}"`).join(',')).join('\\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `alertas_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  prevPage(): void { if (this.page > 1) { this.page--; this.load(); } }

  nextPage(): void { if (this.page < this.pages) { this.page++; this.load(); } }

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

  load(): void {
    this.loading = true;
    this.error = null;
    this.api.listAlerts(ENTITY_CODE, this.state, this.page, this.pageSize).subscribe({
      next: (res) => {
        this.rows = this.sortRows(res?.items || []);
        this.total = res?.total || 0;
        this.pages = res?.pages || 1;
      },
      error: (e) => this.error = e?.error?.detail || e?.message || 'Error cargando alertas',
      complete: () => this.loading = false,
    });
  }
}



