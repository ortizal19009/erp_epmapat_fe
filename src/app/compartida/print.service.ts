import { HttpClient } from '@angular/common/http';
import autoTable from 'jspdf-autotable';
import 'jspdf-autotable';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

import { Injectable } from '@angular/core';

interface IExportHeaders {
   header: string;
   dataKey: string;
}

const getDefaultHeaders = (json: {}) => {
   const defaultHeaders = [];
   const keysObj = Object.keys(json);
   for (let value of keysObj) {
      const tempObj = {
         header: value, dataKey: value
      };
      defaultHeaders.push(tempObj)
   }
   return defaultHeaders;
}

const PDFConfig = { putOnlyUsedFonts: true, orientation: 'landscape' };


@Injectable({ providedIn: 'root' })

export class PrintService {

   constructor(http: HttpClient) { }

   exportPDF(data: any[], headers: IExportHeaders[] = [], filename = "file", headerTitle = "Documento eFact") {
      if (data.length === 0) {
         console.log('No hay datos disponibles para exportar');
      }

      if (!headers || headers.length == 0) {
         headers = getDefaultHeaders(data[0]);
      }

      //   this.messagesService.info_notification('Generando su documento PDF...');
      //   const doc = new jsPDF(PDFConfig);
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text(headerTitle, 14, 14);
      doc.setFontSize(8);
      const objColumns = {};
      for (const header of headers) {
         // objColumns[header.dataKey] = { columnWidth: 'auto' }
      }

      autoTable(doc, {
         columns: headers,
         body: data,
         startY: 20,
         columnStyles: objColumns,
         theme: 'striped',
         tableWidth: 'auto',
         // cellWidth: 'wrap',
         showHead: 'firstPage',
         headStyles: {
            fillColor: [52, 152, 219],
         },
         styles: {
            overflow: 'linebreak',
            cellWidth: 'wrap',
            fontSize: 8,
            cellPadding: 2,
            //  overflowColumns: 'linebreak'
         },
      });

      // const pageNumber = doc.internal.getNumberOfPages();
      const pageSize = doc.internal.pageSize;
      const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();

   }

   date = new Date();
   margin_l = 40;
   line = 0;
   url = "assets/"

   // leerJson() {   }

   header(titulo: string, doc: any) {
      this.margin_l = 40;
      this.line = 0;
      let logo = new Image();
      logo.src = '../../../../assets/img/lep.png'
      doc.setFontSize(30);
      doc.text("EpMapa-T", 140, 50);
      doc.setFontSize(7);
      doc.text("Empresa municipal de alcantarillado y agua potable", 140, 65);
      doc.addImage(logo, this.margin_l, 20, 80, 80);/*LOGO */
      doc.setFont("courier");
      doc.setFontSize(20);
      doc.text(titulo, 220, 100);/*TITULO */
      doc.setFontSize(12);
      doc.text(this.date.toLocaleDateString().toString(), 450, 40);/*FECHA*/
      /*CONTENIDO */
      //window.open(doc.output('bloburl'), '_blank');
      //doc.save(`doc-${titulo}`);
   }

   genPdf(row_datos: any, columns_datos: any, titulo: string) {
      // console.log(columns_datos)
      let doc = new jsPDF('p', 'pt', 'a4');
      //let i = 0;
      doc.setFont("courier");
      doc.setFontSize(11);
      this.header(titulo, doc);
      // console.log(row_datos);
      autoTable(doc, {
         startY: 120,
         columns: columns_datos,
         body: row_datos,
      });
      doc.output('pdfobjectnewwindow', { filename: `${titulo}.pdf` });

   }

   printTable(data: any[], config: any): void {
      const doc = new jsPDF();

      // Configuración de la tabla
      const columns = config.columns.map((column: any) => column.title);
      const rows = data.map((row: any) => config.columns.map((column: any) => row[column.dataKey]));
      const tableName = config.tableName || 'Tabla';

      // Generar la tabla
      autoTable(doc, {
         head: [columns],
         body: rows,
         startY: 20,
         //   tableName,
         showHead: 'firstPage'
      });

      // Guardar el archivo
      doc.save(`${tableName}.pdf`);
   }

}