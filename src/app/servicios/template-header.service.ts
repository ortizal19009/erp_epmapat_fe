import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Injectable({
  providedIn: 'root',
})
export class TemplateHeaderService {
  date: Date = new Date();
  margin_l = 40;
  url = './assets';
  logo = new Image();

  constructor() {}

  header(titulo: string, doc: any) {
    this.logo.src = `${this.url}/img/lep.jpg`;
    doc.addImage(this.logo, 'jpg', 100, 10, 375, 100);
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
    //doc.output('pdfobjectnewwindow', { filename: `${titulo}.pdf` });
  }
}
