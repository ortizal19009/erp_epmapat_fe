import { CommonModule } from '@angular/common';
import { InfoHelpComponent } from '../../../shared/help/info-help';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DocumentosApi } from '../../../core/api/documentos-api';

const ENTITY_CODE = 'EPMAPA-T';

@Component({
  selector: 'app-dashboard-ejecutivo',
  standalone: true,
  imports: [CommonModule, FormsModule, InfoHelpComponent],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css'],
})
export class DashboardEjecutivoComponent implements OnInit {
  loading = false;
  error: string | null = null;
  dateFrom = '';
  dateTo = '';
  data: any = null;

  constructor(private api: DocumentosApi) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.error = null;
    this.api.dashboard(ENTITY_CODE, { date_from: this.dateFrom || undefined, date_to: this.dateTo || undefined }).subscribe({
      next: (r) => this.data = r,
      error: (e) => this.error = e?.error?.detail || e?.message || 'Error cargando dashboard',
      complete: () => this.loading = false,
    });
  }

  exportCsv(): void {
    if (!this.data) return;
    const rows: string[] = [];
    rows.push('seccion,clave,total');
    (this.data.by_status || []).forEach((x: any) => rows.push(`estado,${x.estado},${x.total}`));
    (this.data.by_flow || []).forEach((x: any) => rows.push(`flujo,${x.flujo},${x.total}`));
    (this.data.by_dependency || []).forEach((x: any) => rows.push(`dependencia,${x.dependencia},${x.total}`));
    (this.data.by_type || []).forEach((x: any) => rows.push(`tipo,${x.tipo},${x.total}`));
    (this.data.trend_daily || []).forEach((x: any) => rows.push(`tendencia,${x.fecha},${x.total}`));
    const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `dashboard_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  barWidth(total: number): number {
    const max = Math.max(...((this.data?.by_status || []).map((x: any) => Number(x.total || 0))), 1);
    return Math.round((total / max) * 100);
  }
}


