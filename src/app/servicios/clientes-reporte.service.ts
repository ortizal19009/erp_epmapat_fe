import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Workbook } from 'exceljs';
import { saveAs } from 'file-saver';
export type ReporteCliente = 'listado' | 'cuentas' | 'pendientes';
@Injectable({providedIn: 'root'})
export class ClientesReporteService {
  configuracion(tipo: ReporteCliente): {titulo: string; columnas: [string, string][]; nota: string} {
    const comunes: [string,string][] = [['idcliente','ID'],['nombre','Nombre'],['cedula','Identificaci\u00f3n']];
    const contacto: [string,string][] = [['telefono','Tel\u00e9fono'],['email','Correo']];
    if (tipo === 'listado') return {titulo: 'Listado general de clientes', columnas: [...comunes,
      ['nacionalidad','Nacionalidad'],['fechanacimiento','Nacimiento'],...contacto,['direccion','Direcci\u00f3n'],['cuentas','N. cuentas']],
      nota: 'Incluye todos los clientes. Cuentas distintas como titular o responsable de pago.'};
    if (tipo === 'cuentas') return {titulo: 'Clientes y cuentas a su cargo', columnas: [...comunes,
      ['cuenta','Cuenta'],['relacion','Relaci\u00f3n'],['nromedidor','Medidor'],['estado','Estado'],['direccion','Ubicaci\u00f3n'],
      ['titular','Titular'],['responsable','Responsable de pago']],
      nota: 'Una fila por cliente y cuenta. Una cuenta puede figurar bajo su titular y su responsable.'};
    return {titulo: 'Valores pendientes por cliente', columnas: [...comunes,...contacto,['direccion','Direcci\u00f3n'],
      ['facturas','N. facturas'],['cuentas','N. cuentas'],['capital','Capital pendiente (USD)']],
      nota: 'Situaci\u00f3n actual por cliente facturado. Capital sin intereses. Excluye anuladas, eliminadas, pagadas y originales sustituidos por convenios.'};
  }
  filas(tipo: ReporteCliente, datos: any[]): any[][] {
    return datos.map(r => this.configuracion(tipo).columnas.map(([campo]) => campo === 'estado'
      ? (({0: 'Inactivo',1: 'Activo',2: 'Suspendido',3: 'Suspendido y retirado'} as any)[r.estado == null ? -1 : Number(r.estado)] || 'Sin definir')
      : campo === 'fechanacimiento' ? String(r[campo] || '').substring(0,10) : r[campo] ?? ''));
  }
  crearExcel(tipo: ReporteCliente, datos: any[], contexto: string): Workbook {
    const config = this.configuracion(tipo), libro = new Workbook(), hoja = libro.addWorksheet('Clientes');
    libro.creator = 'EPMAPA-T';
    [config.titulo, config.nota, contexto].forEach(texto => { const fila = hoja.addRow([texto]); hoja.mergeCells(fila.number,1,fila.number,config.columnas.length); });
    hoja.addRow(config.columnas.map(c => c[1]));
    this.filas(tipo,datos).forEach(f => hoja.addRow(f));
    if (tipo === 'pendientes') {
      const fila: any[] = Array(config.columnas.length).fill(''); fila[1] = 'TOTAL';
      fila[fila.length-1] = datos.reduce((t,r) => t + Number(r.capital || 0),0); hoja.addRow(fila).font = {bold: true};
      hoja.getColumn(config.columnas.length).numFmt = '#,##0.00';
    }
    config.columnas.forEach(([clave],i) => hoja.getColumn(i+1).width = ['nombre','direccion','titular','responsable','email'].includes(clave) ? 35 : 20);
    hoja.eachRow((fila,n) => { fila.alignment = {wrapText: true, vertical: 'top'};
      if(n===1 || n===4) { fila.font = {bold: true,color:{argb:'FFFFFFFF'}};
        fila.eachCell(c => c.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF173D59'}}); }
    });
    hoja.views = [{state:'frozen',ySplit:4}]; hoja.autoFilter={from:{row:4,column:1},to:{row:4+datos.length,column:config.columnas.length}};
    return libro;
  }
  async descargar(tipo: ReporteCliente, datos: any[], formato: 'pdf' | 'xlsx', contexto: string) {
    const config = this.configuracion(tipo), fecha = new Date().toLocaleString('es-EC');
    contexto = `${contexto} | Filas: ${datos.length} | Generado: ${fecha}`;
    const nombre = `clientes-${tipo}-${new Date().toISOString().substring(0,10)}`;
    if(formato === 'xlsx') {
      const buffer = await this.crearExcel(tipo,datos,contexto).xlsx.writeBuffer();
      saveAs(new Blob([buffer],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}),nombre+'.xlsx'); return;
    }
    const doc = await this.crearPdf(tipo, datos, contexto);
    doc.save(nombre+'.pdf');
  }
  async crearPdf(tipo: ReporteCliente, datos: any[], contexto: string): Promise<jsPDF> {
    const config = this.configuracion(tipo);
    const doc = new jsPDF('landscape','mm','a3');
    const logo = await new Promise<HTMLImageElement | null>(resolve => { const img=new Image(); img.onload=()=>resolve(img); img.onerror=()=>resolve(null); img.src='assets/img/logo_epmapat.png'; });
    if(logo) {const h=Math.min(18,24*logo.naturalHeight/logo.naturalWidth); doc.addImage(logo,'PNG',12,9,h*logo.naturalWidth/logo.naturalHeight,h);}
    doc.setFontSize(16); doc.text('EPMAPA-T | '+config.titulo,42,17);
    doc.setFontSize(9); doc.text(doc.splitTextToSize(config.nota,360),42,24);
    doc.text(doc.splitTextToSize(contexto,395).slice(0,2),12,36);
    const filas = this.filas(tipo,datos);
    const foot: any[][] = [];
    if(tipo==='pendientes') {const total=Array(config.columnas.length).fill('');total[1]='TOTAL';total[total.length-1]=datos.reduce((t,r)=>t+Number(r.capital||0),0).toFixed(2);foot.push(total);}
    autoTable(doc,{startY:46,head:[config.columnas.map(c=>c[1])],body:filas.map(f=>f.map((v,i)=>config.columnas[i][0]==='capital'?Number(v).toFixed(2):v)),
      foot,showFoot:'lastPage',styles:{fontSize:8,cellPadding:2,overflow:'linebreak'},headStyles:{fillColor:[23,61,89]},margin:{top:14,bottom:16}});
    for(let n=1;n<=doc.getNumberOfPages();n++){doc.setPage(n);doc.setFontSize(8);doc.text(`EPMAPA-T | Pagina ${n} de ${doc.getNumberOfPages()}`,12,288);}
    return doc;
  }
}
