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

  constructor(http: HttpClient) { }
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
    //btener la hora actual
    const horaImpresion = this.getDateTime();
    doc.setFontSize(10);

    // Agregar el pie de página
    doc.text(
      `Fecha y hora de impresión: ${horaImpresion}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );

    const pdfDataUri = doc.output('datauristring');
    const pdfViewer: any = document.getElementById(
      'pdfViewer'
    ) as HTMLIFrameElement;
    return (pdfViewer.src = pdfDataUri);
  }
  setfooter(doc: any) {
    // Obtener la fecha y hora actual
    const horaImpresion = this.setDateTime();
  
    // Configurar el estilo del texto
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100); // Color gris
    doc.setFont('helvetica', 'normal'); // Fuente helvetica
  
    // Agregar el pie de página
    doc.text(
      `Fecha y hora de impresión: ${horaImpresion}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 20, // Margen inferior aumentado
      { align: 'center' }
    );
  }
  
  setDateTime(): string {
    const now = new Date();
    return now.toLocaleString(); // Formato local
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
    }); //btener la hora actual
    const horaImpresion = this.getDateTime();
    doc.setFontSize(10);

    // Agregar el pie de página
    doc.text(
      `Fecha y hora de impresión: ${horaImpresion}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
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

    console.log(ht1, bt1);
    console.log(ht2, bt2);
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
    //btener la hora actual
    const horaImpresion = this.getDateTime();
    doc.setFontSize(10);

    // Agregar el pie de página
    doc.text(
      `Fecha y hora de impresión: ${horaImpresion}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
    doc.setPage(pageNumber);
    doc.save(titulo);
  }
  _bodyShowTwoTables(
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

    console.log(ht1, bt1);
    console.log(ht2, bt2);
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
    const pdfDataUri = doc.output('datauri');
    const pdfViewer: any = document.getElementById(
      'pdfViewer'
    ) as HTMLIFrameElement;

    return (pdfViewer.src = pdfDataUri);
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
  async bodyFourTables(
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
        this.headStyles(ht1[1]),
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
            colSpan: ht2[1].length,
            styles: { halign: 'center', fontSize: 11 },
          },
        ],
        this.headStyles(ht2[1]),
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
            colSpan: ht3[1].length,
            styles: { halign: 'center', fontSize: 11 },
          },
        ],
        this.headStyles(ht3[1]),
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
            colSpan: ht4[1].length,
            styles: { halign: 'center', fontSize: 11 },
          },
        ],
        this.headStyles(ht4[1]),
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
  async bodyFiveTables(
    titulo: string,
    ht1: any,
    bt1: any,
    ht2: any,
    bt2: any,
    ht3: any,
    bt3: any,
    ht4: any,
    bt4: any,
    ht5: any,
    bt5: any,
    doc: any
  ) {
    this.header(titulo, doc);
    const pageNumber = doc.internal.getNumberOfPages();
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
        this.headStyles(ht1[1]),
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
            colSpan: ht2[1].length,
            styles: { halign: 'center', fontSize: 11 },
          },
        ],
        this.headStyles(ht2[1]),
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
            colSpan: ht3[1].length,
            styles: { halign: 'center', fontSize: 11 },
          },
        ],
        this.headStyles(ht3[1]),
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
            colSpan: ht4[1].length,
            styles: { halign: 'center', fontSize: 11 },
          },
        ],
        this.headStyles(ht4[1]),
      ],
      columnStyles: { 0: { halign: 'center' }, 2: { halign: 'right' } },
      body: bt4,
    });
    // QUINTA tabla
    doc.autoTable({
      head: [
        [
          {
            content: ht5[0],
            colSpan: ht5[1].length,
            styles: { halign: 'center', fontSize: 11 },
          },
        ],
        this.headStyles(ht5[1]),
      ],
      columnStyles: { 0: { halign: 'center' }, 2: { halign: 'right' } },
      body: bt5,
    });
    const pdfDataUri = doc.output('datauri');
    const pdfViewer: any = document.getElementById(
      'pdfViewer'
    ) as HTMLIFrameElement;

    return (pdfViewer.src = pdfDataUri);
  }

  headStyles(heads: any) {
    let styles: any = [];
    for (var i = 0; i < heads.length; i++) {
      styles.push({
        content: heads[i],
        styles: {
          halign: 'center',
          fillColor: [255, 255, 255],
          textColor: [0, 0, 0],
        },
      });
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

  getDateTime() {
    var now = new Date();
    var year = now.getFullYear();
    var month = now.getMonth() + 1; // Meses comienzan en 0
    var day = now.getDate();
    var hour = now.getHours();
    var minute = now.getMinutes();
    var second = now.getSeconds();

    return (
      day + '/' + month + '/' + year + ' ' + hour + ':' + minute + ':' + second
    );
  }
}
