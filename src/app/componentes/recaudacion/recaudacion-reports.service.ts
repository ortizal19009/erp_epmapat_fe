import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Injectable({
  providedIn: 'root',
})
export class RecaudacionReportsService {
  date: Date = new Date();
  constructor() {}

  comprobantePago(datos: any) {
    let doc = new jsPDF('p', 'pt', 'a4');
    let margin = 30;
    doc.setFontSize(9);
    doc.text('EPMAPA-T', margin + 70, 50);
    doc.text(`001-018-000252902`, margin, 65);
    doc.text(`Ruc/cedula: 0401501176`, margin, 80);
    doc.text(`Mes pagado: Diciembre del 2023 (2401)Nro`, margin, 95);
    doc.text(`Cliente: GER ALEMERID ASDJFJLOG`, margin, 110);
    doc.text(`Dirección: GENREALPAKASDFA`, margin, 125);
    doc.text(`Referencia: AHSDFHASDHFHASDFH`, margin, 140);
    doc.text(`Cartas ant: 0`, margin, 155);
    doc.text(`Emision: 02/01/2024`, margin + 100, 155);
    doc.text(`Cuenta: 1105`, margin, 170);
    doc.text(`FechaPag: 02/02/2024`, margin + 100, 170);
    doc.text(`L. Anterior: 4415`, margin, 185);
    doc.text(`L. Actual: 4420`, margin + 100, 185);
    doc.text(`Cons. Ant: 14`, margin, 200);
    doc.text(`Recaudador: WILLIAM`, margin + 100, 200);
    doc.text(`Categoría: COME`, margin, 215);
    doc.text(`Descripcion R`, margin + 20, 265);
    doc.text(`Valor unitario`, margin + 130, 265);
    doc.text(`alcantarillado`, margin, 280);
    doc.text(`consumo agua`, margin, 295);
    doc.text(`saneamiento`, margin, 310);
    doc.text(`cons. fuentes`, margin, 325);
    doc.text(`0.00`, margin + 180, 280);
    doc.text(`0.00`, margin + 180, 295);
    doc.text(`0.00`, margin + 180, 310);
    doc.text(`0.00`, margin + 180, 325);

    /* FIGURAS */
    doc.rect(margin - 5, 30, 215, 210); /* primer rectangulo */
    doc.rect(margin - 5, 250, 215, 80); /* segundo rectangulo */
    doc.line(margin * 5, 250, 150, 330); /* Linia vertical */
    doc.line(margin - 5, 266, 240, 266);
    /* --------------------------------
DATOS IZQUIERDA
-----------------------------------*/
    doc.text(`Cuenta: 1105`, margin + 230, 50);
    doc.text(`Ruta: AV.UNIVERSITARIA`, margin + 320, 50);

    /*     autoTable(doc, {
      headStyles: {
        halign: 'center',
      },
      body: [['Row-1', 'col-2']],
    });
    autoTable(doc, {
      headStyles: {
        halign: 'center',
      },
      body: [['col', 'col-2']],
    }); */
    doc.output('pdfobjectnewwindow', { filename: 'hoja de reporte de pago' });
  }
}
