import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Injectable({
  providedIn: 'root',
})
export class PdfService {
  date = new Date();
  margin_l = 40;
  line = 0;
  url = 'assets/';

  constructor(http: HttpClient) {}

  header(titulo: string, doc: any) {
    this.margin_l = 40;
    this.line = 0;
    let logo = new Image();
    logo.src = './assets/img/lep.jpg';
    doc.addImage(logo, 'jpg', 100, 10, 350, 100); /*LOGO */
    doc.setFontSize(15);
    autoTable(doc, {
      styles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        fontSize: 12,
        halign: 'center',
      },
      columnStyles: { 0: { halign: 'center' } },
      startY: 120,
      head: [[titulo]],
    });
    doc.setFontSize(12);
    // doc.text(this.date.toLocaleDateString().toString(), 450, 40); /*FECHA*/
  }
  genPdf(row_datos: any, columns_datos: any, titulo: string) {
    let doc = new jsPDF('p', 'pt', 'a4');
    doc.setFont('courier');
    doc.setFontSize(11);
    this.header(titulo, doc);
    autoTable(doc, {
      startY: 120,
      columns: columns_datos,
      body: row_datos,
    });
    doc.output('pdfobjectnewwindow', { filename: `${titulo}.pdf` });
  }
  bodyOneTable(title: string, head: any, body: any, doc: any) {
    let m_izquierda: 10;
    //let doc = new jsPDF('p', 'pt', 'a4');
    this.header(title, doc);

    autoTable(doc, {
      head: head,
      body: body,
    });

/*     const addPageNumbers = function () {
      const pageCount = doc.internal.pages.length;
      for (let i = 1; i <= pageCount - 1; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        doc.text(
          'Página ' + i + ' de ' + (pageCount - 1),
          m_izquierda,
          doc.internal.pageSize.height - 10
        );
      }
    };

    const pdfDataUri = doc.output('datauri');
    const pdfViewer: any = document.getElementById(
      'pdfViewer'
    ) as HTMLIFrameElement;

    pdfViewer.src = pdfDataUri; */
  }
  bodyTwoTables(
    titulo: string,
    ht1: any,
    bt1: any,
    ht2: any,
    bt2: any,
    doc: any
  ) {
    this.header(titulo, doc);
    // Primera tabla
    doc.autoTable({
      head: ht1,
      body: bt1,
      styles: { overflow: 'hidden' },
      //startY: 20, // Ajusta la posición vertical inicial de la tabla
      margin: { right: 50 }, // Margen izquierdo de la primera tabla
    });

    // Segunda tabla
    doc.autoTable({
      head: ht2,
      body: bt2,
      styles: { overflow: 'hidden' },
     // startY: 20, // La misma posición vertical que la primera tabla
      // Posición horizontal ajustada para que quede a la derecha de la primera tabla
      margin: { left: 50 }, // Margen izquierdo de la segunda tabla
    });
    
    
  }

  /*   nacionalidades(titulo: string, nacionalidades: any) {
    let doc = new jsPDF('p', 'pt', 'a4');
    let i = 0;
    doc.setFont("courier");
    doc.setFontSize(11);
    let datos: any = [];
    this.header(titulo, doc);
    nacionalidades.forEach(() => {
      datos.push([nacionalidades[i].descripcion]);
      i++;
    });
    autoTable(doc, {
      startY: 120,
      head: [['Nombre nacionalidad']],
      body: datos,
    });
    window.open(doc.output('bloburl'), '_blank');
  } */
  /*   puntosEmision(titulo: string, puntosemision: any) {
    let doc = new jsPDF('p', 'pt', 'a4');
    let i = 0;
    doc.setFont("courier");
    doc.setFontSize(11);
    let datos: any = [];
    this.header(titulo, doc);
    puntosemision.forEach(() => {
      datos.push([puntosemision[i].establecimiento, puntosemision[i].direccion]);
      i++;
    });
    autoTable(doc, {
      startY: 120,
      head: [['Establecimiento', 'Dirección']],
      body: datos,
    });
    window.open(doc.output('bloburl'), '_blank');
  } */
  /*   cajas(titulo: string, caja: any) {
    let doc = new jsPDF('p', 'pt', 'a4');
    let i = 0;
    doc.setFont("courier");
    doc.setFontSize(11);
    let datos: any = [];
    this.header(titulo, doc);
    caja.forEach(() => {
      datos.push([caja[i].descripcion, caja[i].codigo, caja[i].idptoemision_ptoemision.establecimiento]);
      i++;
    });
    autoTable(doc, {
      startY: 120,
      head: [['Descripción', 'Código', 'Punto de emisión']],
      body: datos,
    });
    window.open(doc.output('bloburl'), '_blank');
  } */
  /*   categorias(titulo: string, categoria: any) {
    let doc = new jsPDF('p', 'pt', 'a4');
    let i = 0;
    doc.setFont("courier");
    doc.setFontSize(11);
    let datos: any = [];
    this.header(titulo, doc);
    categoria.forEach(() => {
      datos.push([categoria[i].descripcion, `${categoria[i].porcdescuento}%`]);
      i++;
    });
    autoTable(doc, {
      startY: 120,
      head: [['Descripción', 'Porcentaje de descuento']],
      body: datos,
    });
    window.open(doc.output('bloburl'), '_blank');
  } */
  tpcertificacion(titulo: string, tpcertifica: any) {
    let doc = new jsPDF('p', 'pt', 'a4');
    let i = 0;
    doc.setFont('courier');
    doc.setFontSize(11);
    let datos: any = [];
    this.header(titulo, doc);
    tpcertifica.forEach(() => {
      datos.push([
        tpcertifica[i].descripcion,
        tpcertifica[i].idrubro_rubros.descripcion,
        `${tpcertifica[i].valor} $`,
      ]);
      i++;
    });
    autoTable(doc, {
      startY: 120,
      head: [['Descripción', 'Rubro', 'Valor']],
      body: datos,
    });
    window.open(doc.output('bloburl'), '_blank');
  }
  clientes(titulo: string, clientes: any) {
    let doc = new jsPDF('p', 'pt', 'a4');
    let i = 0;
    doc.setFont('courier');
    doc.setFontSize(11);
    let datos: any = [];
    this.header(titulo, doc);
    clientes.forEach(() => {
      datos.push([
        clientes[i].nombre,
        clientes[i].cedula,
        clientes[i].direccion,
        clientes[i].telefono,
      ]);
      i++;
    });

    autoTable(doc, {
      startY: 120,
      head: [['Nombre', 'Identificación', 'Dirección', 'Teléfono']],
      body: datos,
    });
    /* ================== */
    /*     var pageCount = doc.internal.getNumberOfPages(); //Total Page Number
    for(i = 0; i < pageCount; i++) { 
      doc.setPage(i); 
      let pageCurrent = doc.internal.getCurrentPageInfo().pageNumber; //Current Page
      doc.setFontSize(12);
      doc.text('page: ' + pageCurrent + '/' + pageCount, 10, doc.internal.pageSize.height - 10);
    } */
    /* ================== */
    //this.header(titulo, doc);
    window.open(doc.output('bloburl'), '_blank');
  }
  abonados(titulo: string, abonados: any) {
    let doc = new jsPDF('p', 'pt', 'a4');
    let i = 0;
    doc.setFont('courier');
    doc.setFontSize(11);
    let datos: any = [];
    this.header(titulo, doc);
    abonados.forEach(() => {
      datos.push([
        abonados[i].idcliente_clientes.nombre,
        abonados[i].idabonado,
        abonados[i].nromedidor,
        abonados[i].direccionubicacion,
      ]);
      i++;
    });
    autoTable(doc, {
      startY: 120,
      head: [['Nombre cliente', 'Cuenta', 'Medidor', 'Dirección']],
      body: datos,
    });
    window.open(doc.output('bloburl'), '_blank');
  }
  intereses(titulo: string, intereses: any) {
    let doc = new jsPDF('p', 'pt', 'a4');
    let i = 0;
    doc.setFont('courier');
    doc.setFontSize(11);
    let datos: any = [];
    this.header(titulo, doc);
    intereses.forEach(() => {
      datos.push([
        intereses[i].anio,
        intereses[i].mes,
        `${intereses[i].porcentaje}%`,
      ]);
      i++;
    });
    autoTable(doc, {
      startY: 120,
      head: [['Año', 'Mes', 'Porcentaje']],
      body: datos,
    });
    window.open(doc.output('bloburl'), '_blank');
  }
  reclamos(titulo: string, reclamos: any) {
    let doc = new jsPDF('p', 'pt', 'a4');
    let i = 0;
    let n = 0;
    doc.setFont('courier');
    doc.setFontSize(11);
    let datos: any = [];
    this.header(titulo, doc);
    reclamos.forEach(() => {
      datos.push([
        n,
        reclamos[i].observacion,
        reclamos[i].referencia,
        reclamos[i].departamento,
        reclamos[i].contestacion,
        reclamos[i].responsablereclamo,
      ]);
      n++;
      i++;
    });
    autoTable(doc, {
      startY: 120,
      head: [
        [
          'Nro.',
          'Observación',
          'Referencia',
          'Departamento',
          'Contestación',
          'Responsable reclamo',
        ],
      ],
      body: datos,
    });
    window.open(doc.output('bloburl'), '_blank');
  }
  rutas(titulo: string, rutas: any) {
    let doc = new jsPDF('p', 'pt', 'a4');
    let i = 0;
    let n = 1;
    doc.setFont('courier');
    doc.setFontSize(11);
    let datos: any = [];
    this.header(titulo, doc);
    rutas.forEach(() => {
      datos.push([n, rutas[i].descripcion, rutas[i].orden, rutas[i].codigo]);
      n++;
      i++;
    });
    autoTable(doc, {
      startY: 120,
      head: [['Nro.', 'Descripción', 'Orden', 'Código']],
      body: datos,
    });
    window.open(doc.output('bloburl'), '_blank');
  }
  pliegotarifario(titulo: string, pliegotarifario: any) {
    let doc = new jsPDF('p', 'pt', 'a4');
    let i = 0;
    let n = 1;
    doc.setFont('courier');
    doc.setFontSize(11);
    let datos: any = [];
    this.header(titulo, doc);
    pliegotarifario.forEach(() => {
      datos.push([
        n,
        pliegotarifario[i].idcategoria_categorias.descripcion,
        pliegotarifario[i].m3,
        pliegotarifario[i].preciobase,
        pliegotarifario[i].precioadicional,
      ]);
      n++;
      i++;
    });
    autoTable(doc, {
      startY: 120,
      head: [
        [
          'Nro.',
          'Categoria',
          'Metros cubicos',
          'Precio base',
          'Precio adicional',
        ],
      ],
      body: datos,
    });
    window.open(doc.output('bloburl'), '_blank');
  }
  servicios(titulo: string, servicios: any) {
    let doc = new jsPDF('p', 'pt', 'a4');
    let i = 0;
    let n = 1;
    doc.setFont('courier');
    doc.setFontSize(11);
    let datos: any = [];
    this.header(titulo, doc);
    servicios.forEach(() => {
      datos.push([n, servicios[i].nombre, servicios[i].descripcion]);
      n++;
      i++;
    });
    autoTable(doc, {
      startY: 120,
      head: [['Nro.', 'Nombre', 'Descripción']],
      body: datos,
    });
    window.open(doc.output('bloburl'), '_blank');
  }
  suspensiones(titulo: string, suspensiones: any) {
    let doc = new jsPDF('p', 'pt', 'a4');
    let i = 0;
    let n = 1;
    doc.setFont('courier');
    doc.setFontSize(11);
    let datos: any = [];
    this.header(titulo, doc);
    suspensiones.forEach(() => {
      datos.push([
        n,
        suspensiones[i].iddocumento_documentos.nomdoc,
        suspensiones[i].tipo,
        suspensiones[i].numero,
        suspensiones[i].observa,
      ]);
      n++;
      i++;
    });
    autoTable(doc, {
      startY: 120,
      head: [['Nro.', 'Nombre documento', 'Tipo', 'Número', 'Observación']],
      body: datos,
    });
    window.open(doc.output('bloburl'), '_blank');
  }
  detallesSuspensiones(titulo: string, dsuspensiones: any) {
    let doc = new jsPDF('p', 'pt', 'a4');
    let i = 0;
    let n = 1;
    doc.setFont('courier');
    doc.setFontSize(11);
    let datos: any = [];
    this.header(titulo, doc);
    dsuspensiones.forEach(() => {
      datos.push([
        n,
        dsuspensiones[i].idabonado_abonados.idabonado,
        dsuspensiones[i].idabonado_abonados.idcliente_clientes.nombre,
        dsuspensiones[i].idabonado_abonados.nromedidor,
        dsuspensiones[i].idabonado_abonados.estado,
        dsuspensiones[i].idsuspension_suspensiones.observa,
      ]);
      n++;
      i++;
    });
    autoTable(doc, {
      startY: 120,
      head: [
        [
          'Nro.',
          'Cuenta',
          'Cliente',
          'Nro medidor',
          'Estado medidor',
          'Observación',
        ],
      ],
      body: datos,
    });
    window.open(doc.output('bloburl'), '_blank');
  }
}
