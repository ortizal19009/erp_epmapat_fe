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
    this.margin_l = 0;
    this.line = 0;
    let logo = new Image();
    logo.src = './assets/img/lep.jpg';
    doc.addImage(logo, 'jpg', 20, 5, 150, 50); /*LOGO */
    doc.setFontSize(15);
    autoTable(doc, {
      styles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        fontSize: 12,
        halign: 'center',
      },
      columnStyles: { 0: { halign: 'center' } },
      startY: 60,
      head: [[titulo]],
    });
    doc.setFontSize(12);
    // doc.text(this.date.toLocaleDateString().toString(), 450, 40); /*FECHA*/
  }
  genPdf(row_datos: any, columns_datos: any, titulo: string) {
    let doc = new jsPDF();
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
    this.header(title, doc);

    autoTable(doc, {
      head: head,
      body: body,
    });

    const pdfDataUri = doc.output('datauristring');
    const pdfViewer: any = document.getElementById(
      'pdfViewer'
    ) as HTMLIFrameElement;
    return (pdfViewer.src = pdfDataUri);
  }
  async _bodyOneTable(title: string, head: any, body: any, doc: any) {
    this.header(title, doc);
    console.log(this.createColumnStyles(head[0]));
    autoTable(doc, {
      columnStyles: await this.createColumnStyles(head[0]),
      head: head,
      body: body,
    });
    doc.save(title);
  }
  createColumnStyles(columns: any) {
    var styles: any = {};
    console.log(columns.length);
    for (var i = 0; i < columns.length; i++) {
      styles[i] = {
        //cellWidth: 'wrap',
        minCellWidth: 25,
        maxCellWidth: 100, // Ancho máximo de la columna
        halign: 'left',
      };
    }
    return styles;
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
    const pageNumber = doc.internal.getNumberOfPages();
    let startY = 70;
    // Primera tabla
    doc.autoTable({
      head: ht1,
      body: bt1,
      showHead: 'firstPage',
      startY: startY,
      styles: { overflow: 'hidden' },
      margin: { right: 107 }, // Margen izquierdo de la primera tabla
    });
    doc.setPage(pageNumber);

    // Segunda tabla
    doc.autoTable({
      head: ht2,
      body: bt2,
      showHead: 'firstPage',
      startY: startY,
      styles: { overflow: 'hidden' },
      margin: { left: 107 },
    });
    const pdfDataUri = doc.output('datauri');
    const pdfViewer: any = document.getElementById(
      'pdfViewer'
    ) as HTMLIFrameElement;

    return (pdfViewer.src = pdfDataUri);
  }

  _bodyTwoTables(
    titulo: string,
    ht1: any,
    bt1: any,
    ht2: any,
    bt2: any,
    doc: any
  ) {
    console.log(ht1);

    const pageNumber = doc.internal.getNumberOfPages();

    this.header(titulo, doc);
    doc.autoTable({
      theme: 'grid',
      head: [[{ content: ht1[0], styles: { halign: 'center' } }]],
    });
    // Primera tabla
    doc.autoTable({
      head: [ht1[1]],
      body: bt1,
    });
    doc.autoTable({
      theme: 'grid',
      head: [[{ content: ht1[0], styles: { halign: 'center' } }]],
    });
    // Segunda tabla
    doc.autoTable({
      head: [ht2[1]],
      body: bt2,
    });
    doc.setPage(pageNumber);
    doc.save(titulo);
  }
  bodyThreeTables(
    titulo: string,
    ht1: any,
    bt1: any,
    ht2: any,
    bt2: any,
    ht3: any,
    bt3: any,
    doc: any
  ) {
    this.header(titulo, doc);
    const pageNumber = doc.internal.getNumberOfPages();
    // Primera tabla
    doc.autoTable({
      head: [[{ content: ht1[0], styles: { halign: 'center' } }]],
    });
    doc.autoTable({
      head: [ht1[1]],
      columnStyles: { 0: { halign: 'center' }, 2: { halign: 'right' } },
      body: bt1,
    });
    // Segunda tabla
    doc.autoTable({
      head: [[{ content: ht2[0], styles: { halign: 'center' } }]],
    });
    doc.autoTable({
      head: [ht2[1]],
      columnStyles: { 0: { halign: 'center' }, 2: { halign: 'right' } },
      body: bt2,
    });
    // Tercer tabla
    doc.autoTable({
      head: [[{ content: ht3[0], styles: { halign: 'center' } }]],
    });
    doc.autoTable({
      head: [ht3[1]],
      columnStyles: { 0: { halign: 'center' }, 2: { halign: 'right' } },
      body: bt3,
    });
    doc.setPage(pageNumber);
    const pdfDataUri = doc.output('datauri');
    const pdfViewer: any = document.getElementById(
      'pdfViewer'
    ) as HTMLIFrameElement;

    return (pdfViewer.src = pdfDataUri);
  }
  _bodyThreeTables(
    titulo: string,
    ht1: any,
    bt1: any,
    ht2: any,
    bt2: any,
    ht3: any,
    bt3: any,
    doc: any
  ) {
    this.header(titulo, doc);
    const pageNumber = doc.internal.getNumberOfPages();
    // Primera tabla
    doc.autoTable({
      head: [[{ content: ht1[0], styles: { halign: 'center' } }]],
    });
    doc.autoTable({
      head: [ht1[1]],
      columnStyles: { 0: { halign: 'center' }, 2: { halign: 'right' } },
      body: bt1,
    });
    // Segunda tabla
    doc.autoTable({
      head: [[{ content: ht2[0], styles: { halign: 'center' } }]],
    });
    doc.autoTable({
      head: [ht2[1]],
      columnStyles: { 0: { halign: 'center' }, 2: { halign: 'right' } },
      body: bt2,
    });
    // Tercer tabla
    doc.autoTable({
      head: [[{ content: ht3[0], styles: { halign: 'center' } }]],
    });
    doc.autoTable({
      head: [ht3[1]],
      columnStyles: { 0: { halign: 'center' }, 2: { halign: 'right' } },
      body: bt3,
    });
    doc.setPage(pageNumber);
    // const pdfDataUri = doc.output('datauri');
    doc.save(titulo);
  }
  bodyFourTables(
    titulo: string,
    ht1: any,
    bt1: any,
    ht2: any,
    bt2: any,
    ht3: any,
    bt3: any,
    ht4: any,
    bt4: any,
    doc: any
  ) {
    this.header(titulo, doc);
    const pageNumber = doc.internal.getNumberOfPages();
    console.log(bt1);
    console.log(ht1);
    // Primera tabla
    doc.autoTable({
      head: [
        [
          {
            content: ht1[0],
            colSpan: ht1[1].length,
            styles: { halign: 'center', fontSize: 11 },
          },
        ],
        [
          {content: this.headStyles(ht1[1])}
/*           {
            content: ht1[1][0],
            styles: {
              halign: 'center',
              fillColor: [255, 255, 255],
              textColor: [0, 0, 0],
            },
          },
          {
            content: ht1[1][1],
            styles: {
              halign: 'center',
              fillColor: [255, 255, 255],
              textColor: [0, 0, 0],
            },
          },
          {
            content: ht1[1][2],
            styles: {
              halign: 'center',
              fillColor: [255, 255, 255],
              textColor: [0, 0, 0],
            },
          }, */
        ],
      ],
      columnStyles: { 0: { halign: 'center' }, 2: { halign: 'right' } },
      body: bt1,
    });
    doc.setPage(pageNumber);

    // Segunda tabla
    doc.autoTable({
      head: [
        [
          {
            content: ht2[0],
            colSpan: ht2[0].length,
            styles: { halign: 'center', fontSize: 11 },
          },
        ],
        [
          {
            content: ht2[1][0],
            styles: {
              halign: 'center',
              fillColor: [255, 255, 255],
              textColor: [0, 0, 0],
            },
          },
          {
            content: ht2[1][1],
            styles: {
              halign: 'center',
              fillColor: [255, 255, 255],
              textColor: [0, 0, 0],
            },
          },
          {
            content: ht2[1][2],
            styles: {
              halign: 'center',
              fillColor: [255, 255, 255],
              textColor: [0, 0, 0],
            },
          },
        ],
      ],
      columnStyles: { 0: { halign: 'center' }, 2: { halign: 'right' } },
      body: bt2,
    });
    // Tercer tabla
    doc.autoTable({
      head: [
        [
          {
            content: ht3[0],
            colSpan: ht3[0].length,
            styles: { halign: 'center', fontSize: 11 },
          },
        ],
        [
          {
            content: ht3[1][0],
            styles: {
              halign: 'center',
              fillColor: [255, 255, 255],
              textColor: [0, 0, 0],
            },
          },
          {
            content: ht3[1][1],
            styles: {
              halign: 'center',
              fillColor: [255, 255, 255],
              textColor: [0, 0, 0],
            },
          },
          {
            content: ht3[1][2],
            styles: {
              halign: 'center',
              fillColor: [255, 255, 255],
              textColor: [0, 0, 0],
            },
          },
        ],
      ],
      columnStyles: { 0: { halign: 'center' }, 2: { halign: 'right' } },
      body: bt3,
    });
    // Cuarta tabla
    doc.autoTable({
      head: [
        [
          {
            content: ht4[0],
            colSpan: ht4[0].length,
            styles: { halign: 'center', fontSize: 11 },
          },
        ],
        [
          {
            content: ht4[1][0],
            styles: {
              halign: 'center',
              fillColor: [255, 255, 255],
              textColor: [0, 0, 0],
            },
          },
          {
            content: ht4[1][1],
            styles: {
              halign: 'center',
              fillColor: [255, 255, 255],
              textColor: [0, 0, 0],
            },
          },
          {
            content: ht4[1][2],
            styles: {
              halign: 'center',
              fillColor: [255, 255, 255],
              textColor: [0, 0, 0],
            },
          },
        ],
      ],
      columnStyles: { 0: { halign: 'center' }, 2: { halign: 'right' } },
      body: bt4,
    });
    const pdfDataUri = doc.output('datauri');
    const pdfViewer: any = document.getElementById(
      'pdfViewer'
    ) as HTMLIFrameElement;

    return (pdfViewer.src = pdfDataUri);
  }

  headStyles(heads: any) {
    var styles: any = {};
    for (var i = 0; i < heads.length; i++) {
      styles[i] = {
        content: heads[i],
        styles: {
          halign: 'center',
          fillColor: [255, 255, 255],
          textColor: [0, 0, 0],
        },
      };
    }
    return styles;
  }

  footer(data: any, doc: any) {
    // Función para obtener la hora actual
    const getFormattedTime = () => {
      const now = new Date();
      const options: any = {
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: false,
      };
      return now.toLocaleString('es-ES', options);
    };

    // Agregar la tabla con el footer personalizado
    doc.autoTable(data, {
      margin: { top: 20 },
      styles: {
        fontSize: 10,
      },
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 40 },
        2: { cellWidth: 20 },
      },
      // Footer personalizado
      afterPageContent: function (data: {
        settings: { margin: { left: any } };
      }) {
        doc.setFontSize(8);
        doc.text(
          `Hora de generación: ${getFormattedTime()}`,
          data.settings.margin.left,
          doc.lastAutoTable.finalY + 10
        );
      },
    });
  }

  /*   tpcertificacion(titulo: string, tpcertifica: any) {
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
  } */
}
