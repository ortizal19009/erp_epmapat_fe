import { Injectable } from '@angular/core';
import { TemplateHeaderService } from './template-header.service';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Injectable({
   providedIn: 'root',
})

export class DocCertificacionesService {

   fecha: Date = new Date();
   meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'juiio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
   directorComercial = {
      nombre: 'Juan Diego Delgado Flores',
      sufijo: 'Ing',
      cargo: 'Director comercial EPMAPA-T',
      identificacion: '0401282462',
   };

   cDate = `${this.fecha.getDay()} de ${this.meses[+this.fecha.getMonth()!]
      } de ${this.fecha.getFullYear()}`;
   constructor(private s_header: TemplateHeaderService) { }
 
   certificaadoNoAdeudar(datos: any) {
      let titulo: string = '';
      let doc = new jsPDF('p', 'pt', 'a4');
      let margin = 30;
      let nroDocumento = '000';
      this.s_header.header(titulo, doc);
      doc.setFontSize(12);
      doc.text(`Tulcán, ${this.cDate}`, 350, 150);
      doc.text(
         `Of. N° ${nroDocumento}-DC-EPMAPA-T-${this.fecha.getFullYear()}`,
         350,
         165
      );

      let p1 = `Yo, ${this.directorComercial.nombre} con cédula de ciudadania N° ${this.directorComercial.identificacion}, en mi calidad de ${this.directorComercial.cargo} tengo bien certificar: `;
      let p2 = `Que la cuenta N° ${datos.cliente.cuenta} perteneciente a ${datos.cliente.nombre} ubicada en ${datos.cliente.direccion} SI tiene valores pendientes con la EPMAPA-T.`;
      let p3 = `Particular que pongo en conocimiento para los fines pertinentes`;
      if (+datos.sino! === 0) {
         p2 = `Que la cuenta N° ${datos.cliente.cuenta} perteneciente a ${datos.cliente.nombre} ubicada en ${datos.cliente.direccion} NO tiene valores pendientes con la EPMAPA-T.`;
      }
      autoTable(doc, {
         headStyles: { halign: 'center' },
         head: [['CERTIFICACIÓN']],
         styles: {
            fillColor: [255, 255, 255],
            textColor: '#0000',
            fontSize: 12,
            halign: 'justify',
         },
         alternateRowStyles: { fillColor: [255, 255, 255] },
         startY: 200,
         margin: margin,
         body: [[p1], [], [p2], [], [p3]],
         footStyles: {
            halign: 'center',
         },
         foot: [
            [],
            ['Atentamente,'],
            [],
            [],
            [`${this.directorComercial.sufijo} ${this.directorComercial.nombre}`],
            [this.directorComercial.cargo],
         ],
      });
      doc.output('pdfobjectnewwindow', { filename: `${titulo}.pdf` });
   }
 
   certificadoEstarAlDia(datos: any) {
      let titulo: string = '';
      let doc = new jsPDF('p', 'pt', 'a4');
      let margin = 30;
      let nroDocumento = '000';
      this.s_header.header(titulo, doc);
      doc.setFontSize(12);
      doc.text(`Tulcán, ${this.cDate}`, 350, 150);
      doc.text(
         `Of. N° ${nroDocumento}-DC-EPMAPA-T-${this.fecha.getFullYear()}`,
         350,
         165
      );

      let p1 = `Yo, ${this.directorComercial.nombre} con cédula de ciudadania N° ${this.directorComercial.identificacion}, en mi calidad de ${this.directorComercial.cargo} tengo bien certificar: `;
      let p2 = `Que la cuenta N° ${datos.cliente.cuenta} perteneciente a ${datos.cliente.nombre} ubicada en ${datos.cliente.direccion} SI se encuentra al día en los pagos del elemento vital.`;
      let p3 = `Particular que pongo en conocimiento para los fines pertinentes`;
      if (+datos.sino! === 0) {
         p2 = `Que la cuenta N° ${datos.cliente.cuenta} perteneciente a ${datos.cliente.nombre} ubicada en ${datos.cliente.direccion} NO se encuentra al día en los pagos del elemento vital.`;
      }
      autoTable(doc, {
         headStyles: { halign: 'center' },
         head: [['CERTIFICACIÓN']],
         styles: {
            fillColor: [255, 255, 255],
            textColor: '#0000',
            fontSize: 12,
            halign: 'justify',
         },
         alternateRowStyles: { fillColor: [255, 255, 255] },
         startY: 200,
         margin: margin,
         body: [[p1], [], [p2], [], [p3]],
         footStyles: {
            halign: 'center',
         },
         foot: [
            [],
            ['Atentamente,'],
            [],
            [],
            [`${this.directorComercial.sufijo} ${this.directorComercial.nombre}`],
            [this.directorComercial.cargo],
         ],
      });
      doc.output('pdfobjectnewwindow', { filename: `${titulo}.pdf` });
   }

   certificadoServAbonado(datos: any) {
      let titulo: string = '';
      let fecha: Date = new Date(datos.fechaSolicitud);
      let doc = new jsPDF('p', 'pt', 'a4');
      let margin = 30;
      let nroDocumento = '000';
      this.s_header.header(titulo, doc);
      doc.setFontSize(12);
      doc.text(`Tulcán, ${this.cDate}`, 350, 150);
      doc.text(
         `Of. N° ${nroDocumento}-DC-EPMAPA-T-${this.fecha.getFullYear()}`,
         350,
         165
      );
      doc.text(`${datos.sufijo}`, margin, 180);
      doc.text(`${datos.nombre}`, margin, 195);
      doc.text(`${datos.cargo}`, margin, 210);
      doc.text('Presente.', margin, 225);
      doc.text('De mis consideraciones: ', margin, 250);
      let p1 = `En relación al escrito de fecha ${fecha.getDay()} de ${this.meses[+fecha.getMonth()!]
         } de ${fecha.getFullYear()}, ingresado a la Dirección de Gestión Comercial de la Empresa Pública Municipal de Agua Potable y Alcantarillado de Tulcán con fecha ${this.cDate
         }, me permito INFORMAR Y CERTIFICAR: `;
      let p2 = `Que, el señor: ${datos.cliente.nombre}, portador de la cédula de ciudadanía N° ${datos.cliente.cIdentificacion}, SI se encuentra registrado, y mantiene contratado al servicio de agua potable con la EPMAPA-T con cuenta N° ${datos.cliente.cuenta} ubicada en la dirección ${datos.cliente.direccion}`;
      let p3 = `Particular que pongo en conocimiento para los fines pertinentes`;
      if (+datos.sino! === 0) {
         p2 = `Que, el señor: ${datos.cliente.nombre}, portador de la cédula de ciudadanía N° ${datos.cliente.cIdentificacion}, NO se encuentra registrado, ni mantiene contratado al servicio de agua potable con la EPMAPA-T `;
      }
      autoTable(doc, {
         styles: {
            fillColor: [255, 255, 255],
            textColor: '#0000',
            fontSize: 12,
            halign: 'justify',
         },
         alternateRowStyles: { fillColor: [255, 255, 255] },
         startY: 280,
         margin: margin,
         body: [[p1], [], [p2], [], [p3]],
         footStyles: {
            halign: 'center',
         },
         foot: [
            [],
            ['Atentamente,'],
            [],
            [],
            [`${this.directorComercial.sufijo} ${this.directorComercial.nombre}`],
            [this.directorComercial.cargo],
         ],
      });
      doc.output('pdfobjectnewwindow', { filename: `${titulo}.pdf` });
   }
}
