import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Workbook } from 'exceljs';
import { saveAs } from 'file-saver';

@Injectable({ providedIn: 'root' })
export class SuspensionesReporteService {
  readonly columnas = ['N\u00famero', 'Fecha', 'Tipo', 'Cantidad', 'Cuentas afectadas', 'Documento', 'N. documento', 'Origen', 'Observaciones'];
  filas(registros: any[]): any[][] {
    return registros.map(r => [r.numero, String(r.fecha || '').substring(0, 10),
      ({1: 'Habilitaci\u00f3n', 2: 'Suspensi\u00f3n', 3: 'Suspensi\u00f3n y retiro'} as any)[Number(r.tipo)] || '',
      r.cuentasAfectadas?.length ?? r.total ?? 0,
      Array.isArray(r.cuentasAfectadas) ? r.cuentasAfectadas.join(', ') : 'No disponible',
      r.iddocumento_documentos?.nomdoc || '', r.numdoc || '', r.idsuspension_origen?.numero || '', r.observa || '']);
  }
  crearExcel(titulo: string, registros: any[], contexto: string): Workbook {
    const libro = new Workbook();
    libro.creator = 'EPMAPA-T';
    const hoja = libro.addWorksheet(titulo);
    hoja.addRow(['EPMAPA-T - ' + titulo]); hoja.mergeCells(1, 1, 1, 9);
    hoja.addRow([contexto]); hoja.mergeCells(2, 1, 2, 9);
    hoja.addRow(['Generado: ' + new Date().toLocaleString('es-EC') + ' | Registros: ' + registros.length]); hoja.mergeCells(3, 1, 3, 9);
    hoja.addRow(this.columnas);
    this.filas(registros).forEach(fila => hoja.addRow(fila));
    [12, 16, 24, 12, 45, 25, 22, 12, 60].forEach((ancho, i) => hoja.getColumn(i + 1).width = ancho);
    hoja.eachRow((fila, n) => {
      fila.alignment = { vertical: 'top', wrapText: true };
      if (n === 1 || n === 4) {
        fila.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        fila.eachCell(c => c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF173D59' } });
      }
    });
    hoja.views = [{ state: 'frozen', ySplit: 4 }];
    hoja.autoFilter = { from: { row: 4, column: 1 }, to: { row: 4, column: 9 } };
    return libro;
  }
  async descargar(titulo: string, registros: any[], contexto: string, formato: 'pdf' | 'xlsx') {
    const nombre = titulo.toLowerCase() + '-' + new Date().toISOString().substring(0, 10);
    if (formato === 'xlsx') {
      const datos = await this.crearExcel(titulo, registros, contexto).xlsx.writeBuffer();
      saveAs(new Blob([datos], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), nombre + '.xlsx');
      return;
    }
    const doc = new jsPDF('landscape', 'mm', 'a4');
    const logo = await new Promise<HTMLImageElement | null>(resolve => {
      const img = new Image(); img.onload = () => resolve(img); img.onerror = () => resolve(null);
      img.src = 'assets/img/logo_epmapat.png';
    });
    if (logo) { const alto = Math.min(18, 24 * logo.naturalHeight / logo.naturalWidth); doc.addImage(logo, 'PNG', 14, 9, alto * logo.naturalWidth / logo.naturalHeight, alto); }
    doc.setFontSize(16); doc.text('EPMAPA-T | ' + titulo, 43, 17);
    doc.setFontSize(9); doc.text(doc.splitTextToSize(contexto, 235).slice(0, 2), 43, 23);
    doc.text('Generado: ' + new Date().toLocaleString('es-EC') + ' | Registros: ' + registros.length, 14, 35);
    autoTable(doc, { startY: 40, head: [this.columnas], body: this.filas(registros),
      styles: { fontSize: 8, overflow: 'linebreak', cellPadding: 2 },
      headStyles: { fillColor: [23, 61, 89] }, margin: { top: 15, bottom: 16 },
      columnStyles: { 4: { cellWidth: 47 }, 8: { cellWidth: 53 } } });
    const paginas = doc.getNumberOfPages();
    for (let n = 1; n <= paginas; n++) { doc.setPage(n); doc.setFontSize(8); doc.text(`EPMAPA-T | Pagina ${n} de ${paginas}`, 14, 202); }
    doc.save(nombre + '.pdf');
  }
}
