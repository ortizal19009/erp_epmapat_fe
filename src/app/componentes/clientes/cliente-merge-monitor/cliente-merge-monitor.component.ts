import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  ClienteMergeMonitorDetalle,
  ClienteMergeMonitorRow,
  ClienteMergeMonitorService,
} from 'src/app/servicios/cliente-merge-monitor.service';
import { PdfService } from 'src/app/servicios/pdf.service';

@Component({
  selector: 'app-cliente-merge-monitor',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './cliente-merge-monitor.component.html',
  styleUrls: ['./cliente-merge-monitor.component.css'],
})
export class ClienteMergeMonitorComponent implements OnInit {
  form!: FormGroup;
  rows: ClienteMergeMonitorRow[] = [];
  detalle: ClienteMergeMonitorDetalle | null = null;
  selectedId: number | null = null;
  loading = false;
  loadingDetalle = false;

  page = 0;
  size = 10;
  totalPages = 0;
  totalElements = 0;
  pages: number[] = [];
  Math = Math;

  constructor(
    private fb: FormBuilder,
    private monitorService: ClienteMergeMonitorService,
    private router: Router,
    private pdfService: PdfService
  ) {}

  ngOnInit(): void {
    const rangoMes = this.getRangoMesActual();
    this.form = this.fb.group({
      q: [''],
      masterId: [''],
      usuario: [''],
      desde: [rangoMes.desde],
      hasta: [rangoMes.hasta],
    });
    this.cargar();
  }

  cargar(): void {
    this.loading = true;
    this.monitorService.listar({
      ...this.form.value,
      page: this.page,
      size: this.size,
    }).subscribe({
      next: (res) => {
        this.rows = res.content || [];
        this.totalPages = res.totalPages || 0;
        this.totalElements = res.totalElements || 0;
        this.buildPages();
        this.loading = false;

        if (this.selectedId && !this.rows.some((r) => r.idMerge === this.selectedId)) {
          this.selectedId = null;
          this.detalle = null;
        }
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
      },
    });
  }

  buscar(): void {
    this.page = 0;
    this.cargar();
  }

  limpiar(): void {
    const rangoMes = this.getRangoMesActual();
    this.form.reset({ q: '', masterId: '', usuario: '', desde: rangoMes.desde, hasta: rangoMes.hasta });
    this.page = 0;
    this.cargar();
  }

  seleccionar(row: ClienteMergeMonitorRow): void {
    this.selectedId = row.idMerge;
    this.detalle = null;
    this.loadingDetalle = true;
    this.monitorService.detalle(row.idMerge).subscribe({
      next: (res) => {
        this.detalle = res;
        this.loadingDetalle = false;
      },
      error: (err) => {
        console.error(err);
        this.loadingDetalle = false;
      },
    });
  }

  nuevoMerge(): void {
    this.router.navigate(['/clientesDuplicados']);
  }

  imprimirGeneral(): void {
    if (!this.rows.length) return;

    const doc = new jsPDF('l', 'pt', 'a4');
    this.pdfService.header('MONITOR DE COMBINACION DE CLIENTES', doc);

    const filtros = this.form.value;
    doc.setFontSize(9);
    doc.text(`Desde: ${filtros.desde || '-'}   Hasta: ${filtros.hasta || '-'}   Busqueda: ${filtros.q || '-'}`, 40, 112);

    autoTable(doc, {
      startY: 125,
      theme: 'grid',
      head: [['Merge', 'Fecha', 'Master', 'CI/RUC', 'Usuario', 'Clientes', 'Abonados', 'Facturas', 'Lecturas', 'Total']],
      body: this.rows.map((row) => [
        row.idMerge,
        this.formatDateTime(row.fechaMerge),
        `${row.masterId || ''} ${row.masterNombre || ''}`.trim(),
        row.masterCedula || '',
        row.usuarioMerge || '',
        row.clientesCount || 0,
        row.abonadosCount || 0,
        row.facturasCount || 0,
        row.lecturasCount || 0,
        this.totalAfectados(row),
      ]),
      headStyles: { fillColor: [73, 80, 87], halign: 'center' },
      styles: { fontSize: 8, cellPadding: 3 },
      columnStyles: {
        2: { halign: 'left', cellWidth: 190 },
        3: { halign: 'left' },
      },
    });

    this.pdfService.setfooter(doc);
    doc.output('dataurlnewwindow');
  }

  imprimirResumen(row: ClienteMergeMonitorRow, event?: Event): void {
    event?.stopPropagation();
    this.monitorService.detalle(row.idMerge).subscribe({
      next: (detalle) => this.generarPdfResumen(row, detalle),
      error: (err) => console.error(err),
    });
  }

  goTo(p: number): void {
    if (p < 0 || p >= this.totalPages || p === this.page) return;
    this.page = p;
    this.cargar();
  }

  onChangeSize(newSize: any): void {
    this.size = Number(newSize);
    this.page = 0;
    this.cargar();
  }

  get desde(): number {
    if (!this.totalElements) return 0;
    return this.page * this.size + 1;
  }

  get hasta(): number {
    return Math.min((this.page + 1) * this.size, this.totalElements);
  }

  totalAfectados(row: ClienteMergeMonitorRow): number {
    return Number(row.clientesCount || 0)
      + Number(row.abonadosCount || 0)
      + Number(row.facturasCount || 0)
      + Number(row.lecturasCount || 0);
  }

  private generarPdfResumen(row: ClienteMergeMonitorRow, detalle: ClienteMergeMonitorDetalle): void {
    const doc = new jsPDF('p', 'pt', 'a4');
    this.pdfService.header(`RESUMEN DE COMBINACION #${row.idMerge}`, doc);

    autoTable(doc, {
      startY: 115,
      theme: 'grid',
      head: [['Campo', 'Detalle']],
      body: [
        ['Merge', row.idMerge],
        ['Fecha', this.formatDateTime(row.fechaMerge)],
        ['Cliente master', `${row.masterId || ''} ${row.masterNombre || ''}`.trim()],
        ['CI/RUC master', row.masterCedula || ''],
        ['Usuario', row.usuarioMerge || ''],
        ['Observacion', row.observacion || ''],
        ['Total afectado', this.totalAfectados(row)],
      ],
      headStyles: { fillColor: [73, 80, 87] },
      styles: { fontSize: 9, cellPadding: 4 },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 120 }, 1: { halign: 'left' } },
    });

    let y = (doc as any).lastAutoTable.finalY + 14;
    y = this.addDetalleTable(doc, y, 'Clientes absorbidos', ['Cliente duplicado'], detalle.clientes.map((c) => [c.clienteDupId]));
    y = this.addDetalleTable(doc, y, 'Abonados reasignados', ['Abonado', 'Cliente origen'], detalle.abonados.map((a) => [a.abonadoId, a.clienteOrigen]));
    y = this.addDetalleTable(doc, y, 'Facturas reasignadas', ['Factura', 'Cliente origen'], detalle.facturas.map((f) => [f.facturaId, f.clienteOrigen]));
    this.addDetalleTable(doc, y, 'Lecturas reasignadas', ['Lectura', 'Cliente origen'], detalle.lecturas.map((l) => [l.idLectura, l.idClienteOrigen]));

    this.pdfService.setfooter(doc);
    doc.output('dataurlnewwindow');
  }

  private addDetalleTable(doc: jsPDF, startY: number, titulo: string, head: string[], body: any[][]): number {
    autoTable(doc, {
      startY,
      theme: 'grid',
      head: [[{ content: titulo, colSpan: head.length, styles: { halign: 'center', fillColor: [108, 117, 125] } }], head],
      body: body.length ? body : [[{ content: 'Sin registros', colSpan: head.length, styles: { halign: 'center' } }]],
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [73, 80, 87] },
    });
    return (doc as any).lastAutoTable.finalY + 12;
  }

  private formatDateTime(value: string): string {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return `${this.toInputDate(date)} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  }

  private buildPages(): void {
    const maxButtons = 5;
    const half = Math.floor(maxButtons / 2);
    let start = Math.max(0, this.page - half);
    let end = Math.min(this.totalPages - 1, start + maxButtons - 1);
    start = Math.max(0, end - (maxButtons - 1));
    this.pages = [];
    for (let i = start; i <= end; i++) this.pages.push(i);
  }

  private getRangoMesActual(): { desde: string; hasta: string } {
    const hoy = new Date();
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const finMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
    return {
      desde: this.toInputDate(inicioMes),
      hasta: this.toInputDate(finMes),
    };
  }

  private toInputDate(fecha: Date): string {
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day = String(fecha.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
