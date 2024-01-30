import { Injectable } from '@angular/core';
import autoTable from 'jspdf-autotable';

@Injectable({
  providedIn: 'root',
})
export class HeaderService {
  date: Date = new Date();
  urlMedia: './assets';
  logo = new Image();

  constructor() {}
  header(titulo: string, doc: any) {
    this.logo.src = `${this.urlMedia}/img/lep.jpg`;
    doc.addImage(this.logo, 'jpg0, 100,10,375,100');
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
  }
}
