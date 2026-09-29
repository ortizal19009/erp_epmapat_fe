import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import Swal from 'sweetalert2';
import { analisisLecturas } from './analisis-lecturas';

export interface ReporteAnalisisLecturas {
  emision: string;
  ruta?: string;
  codigoRuta?: string;
  totalLecturas: number;
  grupos: { titulo: string; lecturas: any[] }[];
}

export function crearExcelAnalisisLecturas(reporte: ReporteAnalisisLecturas): ExcelJS.Workbook {
  const workbook = new ExcelJS.Workbook();
  const resumen = workbook.addWorksheet('Resumen');
  resumen.columns = [{ width: 55 }, { width: 42 }];
  resumen.addRow(['Análisis de lecturas', 'Valor']);
  resumen.addRow(['Emisión', reporte.emision]);
  if (reporte.ruta) resumen.addRow(['Ruta', reporte.ruta]);
  if (reporte.codigoRuta) resumen.addRow(['Código de ruta', reporte.codigoRuta]);
  resumen.addRow(['Lecturas analizadas', reporte.totalLecturas]);
  for (const grupo of reporte.grupos) resumen.addRow([grupo.titulo, grupo.lecturas.length]);
  resumen.addRow(['Nota', 'Una lectura puede aparecer en más de un tipo de alerta.']);

  const detalle = workbook.addWorksheet('Alertas');
  detalle.columns = [
    { header: 'Alerta', width: 48 }, { header: 'Código de ruta', width: 18 },
    { header: 'Ruta', width: 32 }, { header: 'Cuenta', width: 18 },
    { header: 'Abonado', width: 45 }, { header: 'Categoría', width: 28 },
    { header: 'Lectura anterior', width: 20 }, { header: 'Lectura actual', width: 20 },
    { header: 'Consumo m³', width: 18 }, { header: 'Promedio m³', width: 18 },
  ];
  for (const grupo of reporte.grupos) {
    for (const lectura of grupo.lecturas) {
      const abonado = lectura?.idabonado_abonados;
      const ruta = lectura?.idrutaxemision_rutasxemision?.idruta_rutas;
      detalle.addRow([
        grupo.titulo, String(ruta?.codigo ?? reporte.codigoRuta ?? ''),
        String(ruta?.descripcion ?? reporte.ruta ?? 'Sin ruta'),
        String(abonado?.idabonado ?? ''), String(abonado?.idcliente_clientes?.nombre ?? ''),
        String(abonado?.idcategoria_categorias?.descripcion ?? ''),
        Number(lectura?.lecturaanterior || 0), Number(lectura?.lecturaactual || 0),
        analisisLecturas.getConsumo(lectura), Number(abonado?.promedio || 0),
      ]);
    }
  }
  detalle.autoFilter = { from: { row: 1, column: 1 }, to: { row: Math.max(1, detalle.rowCount), column: 10 } };
  for (let column = 7; column <= 10; column++) detalle.getColumn(column).numFmt = '#,##0.##';
  for (const sheet of [resumen, detalle]) {
    sheet.views = [{ state: 'frozen', ySplit: 1 }];
    sheet.getRow(1).height = 28;
    sheet.getRow(1).eachCell(cell => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF174B63' } };
    });
    sheet.eachRow(row => { row.alignment = { vertical: 'top', wrapText: true }; });
  }
  return workbook;
}

// Se usa desde preConfirm para mantener el modal abierto si falla la descarga.
export async function exportarExcelAnalisisLecturas(reporte: ReporteAnalisisLecturas): Promise<boolean> {
  try {
    const buffer = await crearExcelAnalisisLecturas(reporte).xlsx.writeBuffer();
    const nombre = `analisis-${reporte.ruta ? 'ruta' : 'emision'}-${reporte.emision}${reporte.ruta ? '-' + reporte.ruta : ''}`
      .replace(/[<>:"/\\|?*\x00-\x1F]/g, '-');
    saveAs(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `${nombre}.xlsx`);
    return true;
  } catch (error) {
    console.error('No se pudo exportar el análisis a Excel', error);
    Swal.showValidationMessage('No se pudo exportar el reporte a Excel. Intente nuevamente.');
    return false;
  }
}
