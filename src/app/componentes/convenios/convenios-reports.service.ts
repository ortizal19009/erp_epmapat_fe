import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { TemplateHeaderService } from 'src/app/servicios/template-header.service';

@Injectable({
  providedIn: 'root',
})
export class ConveniosReportsService {
  constructor(private header: TemplateHeaderService) {}
  impContratoConvenio(datos: any, cuotas: any) {
    let margin = 30;
    let doc = new jsPDF('p', 'pt', 'a4');
    let meses = [
      'enero',
      'febrero',
      'marzo',
      'abril',
      'mayo',
      'junio',
      'julio',
      'agosto',
      'septiembre',
      'octubre',
      'noviembre',
      'diciembre',
    ];
    let administradores = [
      { nombre: 'Ing. Juan Diego Delgado', cargo: 'Director Comercial' },
      { nombre: 'Abg. Rigoberto Narváez', cargo: 'Asesor Legal' },
    ];
    this.header.header(
      `MODULO: AGUA Y ALCANTARILLADO N° ${datos.nroconvenio}`,
      doc
    );
    let empresa =
      'Empresa Pública Municipal de Agua Potable y Alcantarillado de Tulcán';
    //doc.setFontSize(12);
    let _cuotas: any = [];
    let fecha: Date = new Date(datos.feccrea);
    let p1 = `En la ciudad de Tulcán, a los ${
      fecha.getDate() + 1
    } dias del mes ${
      meses[fecha.getMonth()]
    } del año ${fecha.getFullYear()}, comparecen, por una parte el ${
      administradores[0].nombre
    } en calidad de ${administradores[0].cargo}, el ${
      administradores[1].nombre
    } como ${
      administradores[1].cargo
    } de la ${empresa}, y por otra parte el(la) Sr.(a) ${
      datos.nomcli
    } en su calidad de solicitante, las partes en forma libre y voluntaria, convienen en suscribir el presente convenio, al tenor de las clusulas siguientes: `;
    let p2 = `PRIMERA.- ANTECEDENTES:`;
    let p3 = `1.- El deudor posee una deuda por Titulo(s) de AGUA Y ALCANTARILLADO a nombre de la ${empresa}, de referencia Nro.: ${datos.referencia}. El deudor por el momento no cuenta con los recursos económicos necesarios para cancelar los valores adeudados.`;
    let p4 = `2.- Mediante autorización, el (la) ${administradores[0].nombre} ${administradores[0].cargo} autoriza se realice el correspondiente convenio de pago en un plazo de ${cuotas.length} meses.`;
    let p5 = `SEGUNDA.- OBJETO:`;
    let p6 = `El(la) deudor se compromete a cancelar a la ${empresa} el valor adeudado, que en total es de $${datos.totalconvenio.toFixed(2)}, de acuerdo a la fórmula de pago determinada en la cláusula siguiente: por título(s) pendiente(s) de pago a la ${empresa}.`;
    let p7 = `TERCERA.- FORMA DE PAGO: `;
    let p8 = `El(la) solicitante depositará en la ventanilla de recaudación el pago de acuerdo a la tabla que se adjunta al presente convenio:`;
    let p9 = `Siendo un total de ${datos.totalconvenio.toFixed(2)}, a partir de la fecha de suscripción de este convenio hasta su termicación en el lapso de ${cuotas.length} meses, más la carta marcada en el transcurso del año.`;
    let p10 = `CUARTA.- SANCIÓN: `;
    let p11 = `En caso de que el(la) deudor(a) no cancel los valores pactados en la fecha establecida, se indicará y/o continuará el juicio de coactivas en su contra, sin lugar a prorroga o plazo alguno.`;
    let p12 = `Para constancia de lo estipulado en las cláusulas anteriores, las partes se afirman y ratifican en cada una de ellas, por lo que libre y voluntariamente firman el presente conveio.`;
    cuotas.forEach((item: any, index: any) => {
      let fechapago: Date = new Date(item.feccrea);
      let fecha = `${fechapago.getFullYear()}-${
        fechapago.getMonth() + 1 + index
      }-${fechapago.getDate() + 1}`;
      _cuotas.push([
        item.nrocuota,
        item.idfactura.totaltarifa.toFixed(2),
        fecha,
      ]);
    });
    autoTable(doc, {
      bodyStyles: { halign: 'justify' },
      body: [[p1], [p2], [p3], [p4], [p5], [p6], [p7], [p8]],
    });
    autoTable(doc, {
      headStyles: { halign: 'center' },
      head: [['N° couta', 'Valor a pagar', 'Fechas de pago']],
      bodyStyles: {
        halign: 'right',
      },
      body: _cuotas,
    });
    autoTable(doc, {
      bodyStyles: { halign: 'justify' },
      body: [[p9], [p10], [p11], [p12]],
    });
    autoTable(doc, {
      bodyStyles: { halign: 'justify' },
      body: [
        [administradores[0].nombre, administradores[1].nombre, datos.nomcli],
        [
          administradores[0].cargo,
          administradores[1].cargo,
          'CI:_________________',
        ],
      ],
    });
    doc.output('pdfobjectnewwindow', { filename: 'Convenio de pago' });
  }
}
