import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Injectable({
  providedIn: 'root',
})
export class ConveniosReportsService {
  constructor() {}
  impContratoConvenio(datos: any) {
    console.log(datos);
    let margin = 30;
    let doc = new jsPDF('p', 'pt', 'a4');
    doc.setFontSize(12);
    let p1 = `En la ciudad de Tulcán, a los <dias mes ></dias> dpias del mes (1) del año (2024), comparecen, por una parte el Ing. Juan Diego Delgado en calidad de Director Comercial, el Abg, Rogoberto Narváez como Asesor Legal de la Empresa Pública Municipal de Agua Potable y Alcantarillado de Tulcán, y por otra parte el(la) Sr.(a) <Nombre del cliente></Nombre> `;
    autoTable(doc, {
      //head: {}
    });
  }
}
