import { Injectable } from '@angular/core';
import autoTable from 'jspdf-autotable';
import { PdfService } from 'src/app/servicios/pdf.service';

@Injectable({
  providedIn: 'root',
})
export class RemisionReportsService {
  constructor(private s_pdf: PdfService) {}
  genContratoRemision(doc: any) {
    this.s_pdf.header(
      'CONVENIO DE PAGO - REMISION DE INTERESES, MULTAS Y RECARGOS EPMAPAT',
      doc
    );
    let p1 = `En la ciudad de Tulcán, a los 30 días del mes enero del año 2025, comparecen, por una parte el Ing. Juan Diego Delgado en calidad de Director Comercial, el Ab. Rigoberto Narvaez como Jefe de coactivas de la Empresa Pública Municipal de Agua Potable y Alcantarillado de Tulcán, y por otra parte el(la) Sr.(a) PAZMIÑO MONTALVO CARLOS EDUARDO en su calidad de solicitante, las partes en forma libre y voluntaria, convienen en suscribir el presente convenio, al tenor de las cláusulas siguientes:`;
    let p2 = `PRIMERO. - ANTECEDENTES: `;
    let p3 = `1. Mediante Registro Oficial-Edición especial Nro. 2025 de lugar y fecha Quito 22 de enero del 2025, se publicó la “Ordenanza de Remisión del 100% de Intereses, Multas, Recargos, Costas y Todos los accesorios derivados de los Tributos, inclusive el Impuesto al Rodaje, cuya administración recaudación le corresponde al Gobierno Municipal de Tulcán, sus Empresas Públicas y Entidades Adscritas”, en la que en su Artículo 13 Convenios de Pago, dispone: “Si el contribuyente se encuentra en mora y se aplica remisión de interés, mora y multa; puede solicitar convenio de pago, realizando una oferta de pago inmediato no menor a un 20% de la obligación, el saldo de diferencia se lo puede diferir mediante convenio de pago hasta el 30 de junio del 2025, en concordancia con lo establecido en el Código Orgánico Administrativo COA en sus Art.  274 y 275”`;
    autoTable(doc, {
      body: [
        [{ content: p1, styles: { halign: 'justify' } }],
        [{ content: p2, styles: { halign: 'justify' } }],
        [{ content: p3, styles: { halign: 'justify' } }],
      ],
    });
    doc.save('Convenio por remision');
  }
}
