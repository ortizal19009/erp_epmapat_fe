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
    console.log(datos);
    let doc = new jsPDF('p', 'pt', 'a4');
    let margin = 30;
    doc.setFontSize(7);
    doc.text('EPMAPA-T', margin + 70, 50);
    doc.text(`${datos.nrofactura}`, margin, 65);
    doc.text(`Ruc/cedula: 0401501176`, margin, 80);
    doc.text(`Mes pagado: ${datos.fechacobro}`, margin, 95);
    doc.text(`Cliente: ${datos.idcliente.nombre}`, margin, 110);
    doc.text(`Dirección: ${datos.idcliente.direccion}`, margin, 125);
    doc.text(`Referencia: ${datos.idcliente.referencia}`, margin, 140);
    doc.text(`Cartas ant: 0`, margin, 155);
    doc.text(`Emision: 02/01/2024`, margin + 100, 155);
    doc.text(`Cuenta: ${datos.idabonado}`, margin, 170);
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
    doc.rect(margin + 225, 190, 215, 75); /* primer rectangulo */
    doc.rect(margin + 310, 265, 130, 15); /* primer rectangulo */
    doc.rect(margin + 310, 265, 130, 120); /* primer rectangulo */
    doc.line(margin + 250, 190, 280, 265); /* Linia vertical */
    doc.line(margin + 395, 190, 425, 385); /* Linia vertical */
    doc.line(margin + 225, 205, 470, 205);
    doc.text(`Cuenta: 1105`, margin + 230, 50);
    doc.text(`Ruta: AV.UNIVERSITARIA`, margin + 320, 50);
    doc.text(`Clave catastral:  SP`, margin + 230, 65);
    doc.text(`Clientes: ORTIZ ROSERO ALEXIS LEONARDO`, margin + 230, 80);
    doc.text(`RUC/Cédula: 0401501176`, margin + 400, 80);
    doc.text(`Dirección: GENERAL PLAZA Y BOLÍVAR`, margin + 230, 95);
    doc.text(`Medidor: BM50100291`, margin + 400, 95);
    doc.text(`L. Anterior: 4415`, margin + 230, 110);
    doc.text(`L. Actual: 4420`, margin + 400, 110);
    doc.text(
      `Cons. Act: DICIEMBRE DEL 2023(2401)Nro Medidor`,
      margin + 230,
      125
    );
    doc.text(`Categoría: COME`, margin + 400, 125);
    doc.text(`Nro cartas ant: 0`, margin + 230, 140);
    doc.text(`Fecha fact: 25/01/2024`, margin + 400, 140);
    doc.text(`Catastro emitido: 02/01/2024`, margin + 230, 155);
    doc.text(`Forma pago: Contado`, margin + 400, 155);
    doc.text(`Recaudador: WILLIAM`, margin + 230, 170);
    doc.text(`Cons. anterior: 14`, margin + 400, 170);
    doc.text(`Referencia: 11715MEJICO Y LAS TEJERIAS`, margin + 230, 185);
    doc.text(`Agua Potable T.`, margin + 400, 185);
    doc.text(`Cant:`, margin + 230, 200);
    doc.text(`1`, margin + 230, 215);
    doc.text(`1`, margin + 230, 230);
    doc.text(`1`, margin + 230, 245);
    doc.text(`1`, margin + 230, 260);
    doc.text(`Descripción:`, margin + 260, 200);
    doc.text(`alcantarillado`, margin + 260, 215);
    doc.text(`consumo agua`, margin + 260, 230);
    doc.text(`saneamiento`, margin + 260, 245);
    doc.text(`cons. Fuentes`, margin + 260, 260);
    doc.text(`V. Unitario:`, margin + 400, 200);
    doc.text(`2.33`, margin + 400, 215);
    doc.text(`4.60`, margin + 400, 230);
    doc.text(`3.26`, margin + 400, 245);
    doc.text(`0.1`, margin + 400, 260);
    doc.text(`Iva 12%`, margin + 320, 275);
    doc.text(``, margin + 400, 275);
    doc.text(`Descuento`, margin + 320, 290);
    doc.text(`0.00`, margin + 400, 290);
    doc.text(`Exoneración`, margin + 320, 305);
    doc.text(`.0`, margin + 400, 305);
    doc.text(`Intereses`, margin + 320, 320);
    doc.text(`0.00`, margin + 400, 320);
    doc.text(`Valor total`, margin + 320, 335);
    doc.text(`11.35`, margin + 400, 335);
    doc.text(`Deuda anterior`, margin + 320, 350);
    doc.text(`0.00`, margin + 400, 350);
    doc.text(`Interes anterior`, margin + 320, 365);
    doc.text(`0.00`, margin + 400, 365);
    doc.text(`Valor a pagar`, margin + 320, 380);
    doc.text(`11.35`, margin + 400, 380);

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
