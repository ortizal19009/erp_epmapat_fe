import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as ExcelJS from 'exceljs';

export interface NotaReporte {
  nota:number; cuenta:string; cliente:string; identificacion:string; planilla:string;
  valor:number; devengado:number; endosado:number; saldo:number; estado:string;
}
export function totalesNotas(filas:NotaReporte[]):number[] {
  return (['valor','devengado','endosado','saldo'] as const).map(campo=>
    filas.reduce((s,f)=>s+Math.round(f[campo]*100),0)/100);
}
const cabeceras=['Nota','Cuenta','Cliente','Identificaci\u00f3n','Planilla','Valor','Devengado','Endosado','Saldo disponible','Estado'];
const azul:[number,number,number]=[17,122,139];
export function pdfNotas(filas:NotaReporte[],alcance:string,fecha:string):Blob {
  const doc=new jsPDF({orientation:'landscape',unit:'mm',format:'a4'});
  doc.setFontSize(15);doc.text('EPMAPA-T | Notas de cr\u00e9dito',10,14);
  doc.setFontSize(9);
  const detalle=doc.splitTextToSize(alcance,275) as string[];
  doc.text(detalle,10,21);
  const y=23+detalle.length*4;
  doc.text('Generado: '+fecha+' | Notas: '+filas.length+' | Valores en USD',10,y);
  const totales=totalesNotas(filas).map(n=>n.toFixed(2));
  autoTable(doc,{
    startY:y+5,margin:{left:10,right:10,top:12,bottom:14},
    head:[cabeceras],
    body:filas.map(f=>[f.nota,f.cuenta,f.cliente,f.identificacion,f.planilla,f.valor.toFixed(2),f.devengado.toFixed(2),f.endosado.toFixed(2),f.saldo.toFixed(2),f.estado]),
    foot:[['','', 'TOTALES','','',...totales,'']],showFoot:'lastPage',
    styles:{fontSize:7,cellPadding:1.7,overflow:'linebreak'},headStyles:{fillColor:azul},footStyles:{fillColor:azul},
    columnStyles:{0:{cellWidth:13},1:{cellWidth:16},2:{cellWidth:61},3:{cellWidth:28},4:{cellWidth:29},5:{cellWidth:21,halign:'right'},6:{cellWidth:21,halign:'right'},7:{cellWidth:21,halign:'right'},8:{cellWidth:24,halign:'right'},9:{cellWidth:43}},
  });
  const paginas=doc.getNumberOfPages();
  for(let p=1;p<=paginas;p++){doc.setPage(p);doc.setFontSize(8);doc.setTextColor(90);doc.text('P\u00e1gina '+p+' de '+paginas,287,203,{align:'right'});}
  return doc.output('blob');
}
export async function excelNotas(filas:NotaReporte[],alcance:string,fecha:string):Promise<Blob> {
  const libro=new ExcelJS.Workbook();libro.creator='EPMAPA-T';
  const hoja=libro.addWorksheet('Notas de credito',{views:[{state:'frozen',ySplit:5}]});
  hoja.mergeCells('A1:J1');hoja.getCell('A1').value='EPMAPA-T | Notas de cr\u00e9dito';hoja.getCell('A1').font={bold:true,size:16};
  hoja.mergeCells('A2:J2');hoja.getCell('A2').value=alcance;hoja.getCell('A2').alignment={wrapText:true,vertical:'top'};hoja.getRow(2).height=45;
  hoja.mergeCells('A3:J3');hoja.getCell('A3').value='Generado: '+fecha+' | Notas: '+filas.length+' | Valores en USD';
  hoja.getRow(5).values=cabeceras;
  filas.forEach(f=>hoja.addRow([f.nota,f.cuenta,f.cliente,f.identificacion,f.planilla,f.valor,f.devengado,f.endosado,f.saldo,f.estado]));
  const total=hoja.addRow(['','','TOTALES','','',...totalesNotas(filas),'']);
  [hoja.getRow(5),total].forEach(r=>{r.font={bold:true,color:{argb:'FFFFFFFF'}};r.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF117A8B'}};});
  [12,15,45,22,26,18,18,18,22,25].forEach((ancho,i)=>hoja.getColumn(i+1).width=ancho);
  for(let n=6;n<=total.number;n++){
    for(let col=6;col<=9;col++){hoja.getCell(n,col).numFmt='#,##0.00';}
    hoja.getCell(n,3).alignment={wrapText:true,vertical:'top'};
  }
  hoja.autoFilter={from:{row:5,column:1},to:{row:5+filas.length,column:10}};
  hoja.pageSetup={orientation:'landscape',paperSize:9,fitToPage:true,fitToWidth:1,fitToHeight:0,printTitlesRow:'5:5'};
  return new Blob([await libro.xlsx.writeBuffer()],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
}
