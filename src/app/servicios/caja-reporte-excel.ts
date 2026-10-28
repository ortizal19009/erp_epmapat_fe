import { Workbook, Worksheet } from 'exceljs';
import { saveAs } from 'file-saver';

export function numeroCaja(valor: any): number {
  if (valor == null || valor === '') return 0;
  const numero = Number(valor);
  if (!Number.isFinite(numero)) throw new Error('El reporte contiene un importe no valido.');
  return numero;
}
export function monedaCaja(valor: any): number {
  const n = numeroCaja(valor);
  const centavos = Math.abs(n) * 100;
  return Math.sign(n) * Math.round(centavos + Number.EPSILON * Math.max(1, centavos)) / 100;
}
export function sumarCaja(valores: any[]): number {
  return valores.reduce((centavos, v) => centavos + Math.round(monedaCaja(v) * 100), 0) / 100;
}
export function totalPlanillaCaja(item: any): number {
  return monedaCaja(numeroCaja(item.total) + numeroCaja(item.iva));
}
export function totalTransferenciaCaja(item: any): number {
  return monedaCaja(numeroCaja(item.valor) + numeroCaja(item.swiva));
}
export function resumenCaja(actual: any[], anterior: any[], fecha: string) {
  const filas: any[][] = [];
  const bloque = (titulo: string, rubros: any[]) => {
    filas.push(['', titulo, '']);
    const visibles = (rubros || []).filter(r => monedaCaja(r[2]) !== 0);
    visibles.forEach(r => filas.push([r[0], r[1], monedaCaja(r[2])]));
    const subtotal = sumarCaja(visibles.map(r => r[2]));
    const baseIva = sumarCaja(visibles.filter(r => r[3] === true).map(r => r[2]));
    const tasa = fecha >= '2024-04-01' ? 15 : 12;
    const iva = monedaCaja(Math.round(baseIva * 100) * tasa / 10000);
    if (iva !== 0) filas.push(['', 'IVA', iva]);
    const total = sumarCaja([subtotal,iva]);
    filas.push(['', 'SUBTOTAL', total]);
    return {iva,total};
  };
  const uno=bloque('PER\u00cdODO ACTUAL',actual), dos=bloque('PER\u00cdODOS ANTERIORES',anterior);
  const totalGeneral=sumarCaja([uno.total,dos.total]);
  filas.push(['','TOTAL',totalGeneral]);
  return {filas,totalGeneral,ivaActual:uno.iva,ivaAnterior:dos.iva};
}
function tabla(libro: Workbook, nombre: string, titulo: string, cabecera: string[], filas: any[][], columnaValor?: number): Worksheet {
  const hoja=libro.addWorksheet(nombre);
  hoja.addRow([titulo]);hoja.mergeCells(1,1,1,cabecera.length);
  hoja.addRow([]);hoja.addRow(cabecera);
  filas.forEach(f=>hoja.addRow(f));
  hoja.views=[{state:'frozen',ySplit:3}];
  hoja.getRow(1).font={bold:true,size:14,color:{argb:'FF002060'}};
  hoja.getRow(3).eachCell(c=>{c.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF002060'}};c.font={bold:true,color:{argb:'FFFFFFFF'}};});
  hoja.columns.forEach((c,i)=>{c.width=i===1?50:22;c.alignment={vertical:'top',wrapText:true};});
  if(columnaValor) {hoja.getColumn(columnaValor).numFmt='#,##0.00';hoja.getColumn(columnaValor).alignment={horizontal:'right'};}
  return hoja;
}
function totalizar(hoja: Worksheet, columna: number, valores: number[]) {
  const ultima=hoja.rowCount, fila=hoja.addRow(['','TOTAL']);fila.font={bold:true};
  fila.getCell(columna).value=valores.length ? {formula:`SUM(${hoja.getColumn(columna).letter}4:${hoja.getColumn(columna).letter}${ultima})`,result:sumarCaja(valores)} : 0;
}
export function excelResumenCaja(actual: any[], anterior: any[], formas: any[], fecha: string, titulo: string): Workbook {
  const libro=new Workbook();libro.calcProperties.fullCalcOnLoad=true;
  const resumen=resumenCaja(actual,anterior,fecha);
  const hoja=tabla(libro,'Resumen',titulo,['Nro','Rubro','Total recaudado'],resumen.filas,3);
  hoja.eachRow(f=>{if(['IVA','SUBTOTAL','TOTAL','PER\u00cdODO ACTUAL','PER\u00cdODOS ANTERIORES'].includes(String(f.getCell(2).value)))f.font={bold:true};});
  const filas=(formas||[]).map(f=>[f[0],monedaCaja(f[1])]);
  const iva=sumarCaja([resumen.ivaActual,resumen.ivaAnterior]);
  if(iva!==0) {filas.push(['SUBTOTAL',sumarCaja((formas||[]).map(f=>f[1]))]);filas.push(['IVA',iva]);}
  filas.push(['TOTAL',sumarCaja([sumarCaja((formas||[]).map(f=>f[1])),iva])]);
  tabla(libro,'Formas de cobro',titulo,['Forma de cobro','Total recaudado'],filas,2);
  return libro;
}
export function excelPlanillasCaja(datos: any[], titulo: string): Workbook {
  const libro=new Workbook();libro.calcProperties.fullCalcOnLoad=true;
  const filas=datos.map(item=>{
    const f=item[0];
    if(!f)throw new Error('Faltan datos de una planilla. Vuelva a consultar.');
    return [f.idfactura,f.feccrea,f.nrofactura,f.idcliente?.nombre||'',f.idmodulo?.descripcion||'',f.formapago,totalPlanillaCaja(item)];
  });
  const hoja=tabla(libro,'Planillas',titulo,['Nro','Fecha','Nro. factura','Cliente','Seccion','Forma de cobro','Valor'],filas,7);
  totalizar(hoja,7,filas.map(f=>f[6]));return libro;
}
export function excelTransferenciasCaja(datos: any[], titulo: string): Workbook {
  const libro=new Workbook();libro.calcProperties.fullCalcOnLoad=true;
  const filas=datos.map(f=>[f.idfactura,f.nombre,f.cedula,f.fechatransferencia,f.nrofactura,f.formapago,totalTransferenciaCaja(f)]);
  const hoja=tabla(libro,'Transferencias',titulo,['Nro','Cliente','Identificacion','Fecha transferencia','Nro. factura','Forma de cobro','Valor'],filas,7);
  totalizar(hoja,7,filas.map(f=>f[6]));return libro;
}
export function excelTransferenciasGlobalCaja(todas: any[], cobradas: any[], pendientes: any[], titulo: string): Workbook {
  const libro=new Workbook();libro.calcProperties.fullCalcOnLoad=true;
  [['Emitidas',todas],['Cobradas',cobradas],['Por cobrar',pendientes]].forEach(([nombre,datos])=>{
    const filas=((datos||[]) as any[]).map(f=>[f.idfactura,f.nrofactura||'',f.nombre,f.fechatransferencia,f.idmodulo,monedaCaja(f.total)]);
    const hoja=tabla(libro,String(nombre),titulo+' - '+nombre,['Planilla','Nro. factura','Cliente','Fecha transferencia','Modulo','Valor'],filas,6);
    totalizar(hoja,6,filas.map(f=>f[5]));
  });return libro;
}
export function excelListaCajas(datos: any[]): Workbook {
  const libro=new Workbook();tabla(libro,'Cajas','Lista de cajas',['Establecimiento','Punto de emision','Nombre'],(datos||[]).map(c=>[c.idptoemision_ptoemision?.establecimiento||'',c.codigo,c.descripcion]));return libro;
}
export async function descargarExcelCaja(libro: Workbook, nombre: string): Promise<void> {
  const buffer=await libro.xlsx.writeBuffer();
  const seguro=(nombre||'reporte-caja').replace(/[<>:"/\\|?*]/g,'-').trim();
  saveAs(new Blob([buffer],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}),seguro+'.xlsx');
}
