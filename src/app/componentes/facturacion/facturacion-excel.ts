import * as ExcelJS from 'exceljs';

export function fechaExcel(value: any): Date | null {
  if (!value) return null;
  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
  const date = match ? new Date(Date.UTC(+match[1], +match[2] - 1, +match[3])) : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function libroFacturacion(title: string, headers: string[], rows: any[][],
  money: number[] = [], totals: number[] = [], context = ''): ExcelJS.Workbook {
  const book = new ExcelJS.Workbook();
  book.creator = 'EPMAPA-T';
  const sheet = book.addWorksheet('Reporte');
  sheet.addRow([title]); sheet.mergeCells(1, 1, 1, headers.length);
  sheet.getCell('A1').font = {bold:true, size:14, color:{argb:'FF2C3E50'}};
  sheet.addRow([context]); sheet.mergeCells(2, 1, 2, headers.length);
  const header = sheet.addRow(headers);
  header.eachCell(cell => {
    cell.fill = {type:'pattern', pattern:'solid', fgColor:{argb:'FF2C3E50'}};
    cell.font = {bold:true, color:{argb:'FFFFFFFF'}};
  });
  rows.forEach(values => sheet.addRow(values));
  const total = sheet.addRow(['TOTAL']); total.font = {bold:true};
  totals.forEach(column => {
    const sum = rows.reduce((acc, row) => acc + Number(row[column - 1] || 0), 0);
    total.getCell(column).value = rows.length
      ? {formula:`SUM(${sheet.getColumn(column).letter}4:${sheet.getColumn(column).letter}${rows.length + 3})`, result:sum}
      : 0;
  });
  headers.forEach((label, index) => {
    const column = sheet.getColumn(index + 1);
    column.width = Math.min(55, Math.max(14, label.length + 3,
      ...rows.slice(0, 200).map(row => row[index] instanceof Date ? 14 : String(row[index] ?? '').length + 2)));
    column.eachCell((cell, rowNumber) => {
      if (rowNumber < 4) return;
      if (cell.value instanceof Date) cell.numFmt = 'dd/mm/yyyy';
      if (money.includes(index + 1)) cell.numFmt = '#,##0.00';
      cell.alignment = {vertical:'middle', wrapText:true};
    });
  });
  sheet.views = [{state:'frozen', ySplit:3}];
  sheet.autoFilter = {from:{row:3,column:1},to:{row:Math.max(3, rows.length + 3),column:headers.length}};
  return book;
}

export async function descargarExcel(book: ExcelJS.Workbook, filename: string): Promise<void> {
  const buffer = await book.xlsx.writeBuffer();
  const url = URL.createObjectURL(new Blob([buffer], {type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}));
  const anchor = document.createElement('a'); anchor.href = url;
  anchor.download = `${(filename || 'Facturacion').replace(/\.xlsx$/i, '').replace(/[<>:"/\\|?*\x00-\x1f]/g, '_')}.xlsx`;
  document.body.appendChild(anchor); anchor.click(); anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
