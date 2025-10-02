import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import { PdfService } from 'src/app/servicios/pdf.service';

@Injectable({
  providedIn: 'root'
})
export class CajaReportsService {
  otraPagina: boolean = false;
  constructor(private _pdf: PdfService) { }
  cajasIndividuales() {
    let doc = new jsPDF('p', 'pt', 'a4');
    let margin = 30;
    this._pdf.header('PRUEBA', doc);
    //doc.output('pdfobjectnewwindow', { filename: `fff.pdf` });

    var opciones = {
      filename: 'lecturas.pdf',
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    };

    if (this.otraPagina) doc.output('dataurlnewwindow', opciones);
    else {
      const pdfDataUri = doc.output('datauristring');
      //Si ya existe el <embed> primero lo remueve
      const elementoExistente = document.getElementById('idembed');
      if (elementoExistente) { elementoExistente.remove(); }
      //Crea el <embed>
      var embed = document.createElement('embed');
      embed.setAttribute('src', pdfDataUri);
      embed.setAttribute('type', 'application/pdf');
      embed.setAttribute('width', '75%');
      embed.setAttribute('height', '100%');
      embed.setAttribute('id', 'idembed');
      //Agrega el <embed> al contenedor del Modal
      var container: any;
      container = document.getElementById('pdf');
      container.appendChild(embed);
    }
  }
}
