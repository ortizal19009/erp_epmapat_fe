import { ParseSpan } from '@angular/compiler';
import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Injectable({
  providedIn: 'root',
})
export class RecaudacionReportsService {
  date: Date = new Date();
  total: number = 0;
  interes: number = 0;
  constructor() { }

  comprobantePago(l_datos: any, _rubrosxfac: any) {
    console.log(_rubrosxfac);
    this.total = 0;
    console.log(l_datos)
    let datos = _rubrosxfac[0].idfactura_facturas
    console.log(datos);
    this.interes = 0;
    /*   if (_interes < 0) {
        this.interes = 0;
      } else {
        this.interes = _interes;
      } */
    let doc = new jsPDF('p', 'pt', 'a4');

    let m3 = l_datos.lecturaactual - l_datos.lecturaanterior
    let rubros: any = [];
    _rubrosxfac.forEach((item: any) => {
      if (item.idrubro_rubros.idrubro != 5) {
        this.total += +item.valorunitario!;
        rubros.push([item.idrubro_rubros.descripcion, item.valorunitario.toFixed(2)]);
      } else {

        this.interes = item.valorunitario
      }
    });
    this.total += this.interes;
    doc.setFontSize(7);
    // doc.text('EPMAPA-T', margin + 70, 50);


    const tableWidth = 200;
    autoTable(doc, {
      //doc.setFontType("bold");
      //startY: 250,
      tableWidth,
      //theme: 'striped',
      styles: { fontSize: 8, fontStyle: 'bold' },
      columnStyles: {
        0: { minCellWidth: 10 },
        2: { minCellWidth: 15 },
      },
      bodyStyles: { cellPadding: 1 },

      headStyles: {
        halign: 'center',
        fillColor: 'white',
        textColor: 'black',
      },
      columns: ['EPMAPA-TULCAN', ''],
      body: [
        [`Nro factura: ${datos.nrofactura}`],
        [`Ruc/cedula: ${datos.idcliente.cedula}`],
        [`Mes pagado: ${l_datos.fechaemision.slice(0, 10)}`],
        [`Cliente: ${datos.idcliente.nombre}`],
        [`Dirección: ${datos.idcliente.direccion}`],
        /* [`Referencia: ${datos.idcliente.referencia}`], */
        [`M3: ${m3}`, `Emision: ${l_datos.idemision}`],
        [`Cuenta: ${datos.idabonado}`, `FechaPag: ${datos.fechacobro}`],
        [`L. Anterior: ${l_datos.lecturaanterior}`, `L. Actual: ${l_datos.lecturaactual}`],
        [`Cons. Ant: ---`, `Categoría: ${l_datos.idabonado_abonados.idcategoria_categorias.descripcion}`],
        [`Recaudador: ---`],
      ],
    });
    autoTable(doc, {
      //startY: 250,
      //startY: 250,
      tableWidth,
      theme: 'grid',
      styles: { fontSize: 8, fontStyle: 'bold' },
      headStyles: {
        halign: 'center',
        fillColor: 'white',
        textColor: 'black',
      },
      bodyStyles: { cellPadding: 1 },
      columnStyles: {
        0: { minCellWidth: 10 },
        1: { minCellWidth: 15, halign: 'right' },
      },

      columns: ['Descripción', 'Valor unitario'],
      body: rubros,
    });
    autoTable(doc, {
      //startY: 250,
      //startY: 250,
      tableWidth,
      theme: 'grid',
      styles: { fontSize: 8, fontStyle: 'bold' },
      headStyles: {
        halign: 'center',
        fillColor: 'white',
        textColor: 'black',
      },
      bodyStyles: { cellPadding: 1 },
      columnStyles: {
        0: { minCellWidth: 10 },
        1: { minCellWidth: 15, halign: 'right' },
      },

      columns: ['', ''],
      body: [
        /* ['Iva 12%', '0.00'], */
        ['Descuento 0%', '0.00'],
        ['Intereses', this.interes.toFixed(2)],
        ['Valor total', this.total.toFixed(2)],
      ],
    });

    /* FIGURAS */
    //doc.rect(margin - 5, 30, 215, 210); /* primer rectangulo */
    //doc.rect(margin - 5, 250, 215, 80); /* segundo rectangulo */
    // doc.line(margin * 5, 250, 150, 330); /* Linia vertical */
    // doc.line(margin - 5, 266, 240, 266);
    /* --------------------------------
    DATOS IZQUIERDA
    -----------------------------------*/
    /*     doc.rect(margin + 225, 190, 215, 75); 
        doc.rect(margin + 310, 265, 130, 15); 
        doc.rect(margin + 310, 265, 130, 120);
        doc.line(margin + 250, 190, 280, 265);
        doc.line(margin + 395, 190, 425, 385);
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
        doc.text(`Agua Potable T.`, margin + 400, 185); */
    /* doc.text(`Cant:`, margin + 230, 200);
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
    doc.text(`0.1`, margin + 400, 260); */
    /*     doc.text(`Iva 12%`, margin + 320, 275);
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
        doc.text(`11.35`, margin + 400, 380); */
    /*autoTable(doc, {
      headStyles: {
        halign: 'center',
      },
      body: [['col', 'col-2']],
    }); */
    doc.output('pdfobjectnewwindow', { filename: 'hoja de reporte de pago' });
  }
}
