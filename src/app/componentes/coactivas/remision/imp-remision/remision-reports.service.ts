import { Injectable } from '@angular/core';
import autoTable from 'jspdf-autotable';
import { Colores } from 'src/app/modelos/administracion/colores.model';
import { FormatFechaPipe } from 'src/app/pipes/format-fecha.pipe';
import { FacturaService } from 'src/app/servicios/factura.service';
import { PdfService } from 'src/app/servicios/pdf.service';
let administradores = [
  { nombre: 'Ing. Juan Diego Delgado', cargo: 'Director Comercial' },
  { nombre: 'Ab. Rigoberto Narvaez', cargo: 'Jefe de coactivas' },
];
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
@Injectable({
  providedIn: 'root',
})
export class RemisionReportsService {
  constructor(private s_pdf: PdfService) {}

  genContratoRemision(doc: any, remisiones: any, facturas: any) {
    console.log(remisiones);
    console.log(facturas);
    let fecha: Date = new Date(remisiones.feccrea);
    console.log(fecha);
    this.s_pdf.header(
      'CONVENIO DE PAGO - REMISION DE INTERESES, MULTAS Y RECARGOS EPMAPAT',
      doc
    );
    let p1 = `En la ciudad de Tulcán, a los ${fecha.getDate() + 1} días del ${
      meses[fecha.getMonth()]
    } del año ${fecha.getFullYear()}, comparecen, por una parte el ${
      administradores[0].nombre
    } en calidad de ${administradores[0].cargo}, el ${
      administradores[1].nombre
    } como ${
      administradores[1].cargo
    } de la Empresa Pública Municipal de Agua Potable y Alcantarillado de Tulcán, y por otra parte el(la) Sr.(a) ${
      remisiones.idcliente_clientes.nombre
    } en su calidad de solicitante, las partes en forma libre y voluntaria, convienen en suscribir el presente convenio, al tenor de las cláusulas siguientes:`;
    let p2 = `PRIMERO. - ANTECEDENTES: `;
    let p3 = `1. Mediante Registro Oficial-Edición especial Nro. 2025 de lugar y fecha Quito 22 de enero del 2025, se publicó la “Ordenanza de Remisión del 100% de Intereses, Multas, Recargos, Costas y Todos los accesorios derivados de los Tributos, inclusive el Impuesto al Rodaje, cuya administración recaudación le corresponde al Gobierno Municipal de Tulcán, sus Empresas Públicas y Entidades Adscritas”, en la que en su Artículo 13 Convenios de Pago, dispone: “Si el contribuyente se encuentra en mora y se aplica remisión de interés, mora y multa; puede solicitar convenio de pago, realizando una oferta de pago inmediato no menor a un 20% de la obligación, el saldo de diferencia se lo puede diferir mediante convenio de pago hasta el 30 de junio del 2025, en concordancia con lo establecido en el Código Orgánico Administrativo COA en sus Art.  274 y 275”`;
    let p4 = `2. El deudor posee una deuda por Título(s) de AGUA Y ALCANTARILLADO a nombre de la Empresa Pública Municipal de Agua Potable y Alcantarillado de Tulcán, de referencia Nro.: ${remisiones.idabonado_abonados.idabonado}. El deudor por el momento no cuenta con los recursos económicos necesarios para cancelar los valores adeudados.`;
    let p5 = `3. Mediante autorización, el (la) ${administradores[0].nombre} ${administradores[0].cargo} autoriza se realice el correspondiente convenio de pago en un plazo de ${remisiones.cuotas} meses. `;
    let p6 = `SEGUNDA.- OBJETO: `;
    let total = remisiones.totcapital + remisiones.totintereses;
    let p7 = `El(la) deudor se compromete a cancelar a la Empresa Pública Municipal de Agua Potable y Alcantarillado de Tulcán el valor adeudado, que en total es de $${total.toFixed(
      2
    )}, de acuerdo a la fórmula de pago determinada en la cláusula siguiente: por título(s) pendiente(s) de pago a la Empresa Pública Municipal de Agua Potable y Alcantarillado de Tulcán.`;
    let p8 = `TERCERA.- FORMA DE PAGO: `;
    let p9 = `El(la) solicitante depositará en la ventanilla de recaudación el pago de acuerdo a la tabla que se adjunta al presente convenio:`;
    autoTable(doc, {
      theme: 'plain',

      styles: { halign: 'justify' },

      body: [[p1], [p2], [p3], [p4], [p5], [p6], [p7], [p8], [p9]],
    });
    let fac: any[] = [];
    let capital: number = 0;
    facturas.forEach((item: any, index: number) => {
      fac.push([
        index + 1,
        item.idfactura_facturas.idfactura,
        item.idfactura_facturas.totaltarifa.toFixed(2),
        item.idfactura_facturas.feccrea,
      ]);
      capital += item.idfactura_facturas.totaltarifa;
    });
    autoTable(doc, {
      theme: 'striped',
      head: [['Nro. couta', 'Planilla', 'Valor', 'Fecha pago']],
      body: fac,
    });
    let p10 = `Siendo un total de ${capital.toFixed(
      2
    )}, a partir de la fecha de suscripción de este convenio hasta su terminación en el lapso de ${
      remisiones.cuotas
    } meses, más la carta marcada en el transcurso del año. `;
    let p11 = `CUARTA.- SANCIÓN: `;
    let p12 = `En caso de que el(la) deudor(a) no cancel los valores pactados en la fecha establecida, se indicará y/o continuará el juicio de coactivas en su contra, sin lugar a prorroga o plazo alguno. Para constancia de lo estipulado en las cláusulas anteriores, las partes se afirman y ratifican en cada una de ellas, por lo que libre y voluntariamente firman el presente convenio`;
    autoTable(doc, {
      theme: 'plain',

      styles: { halign: 'justify' },

      body: [[p10], [p11], [p12]],
    });

    autoTable(doc, {
      theme: 'plain',

      bodyStyles: { halign: 'justify' },
      body: [
        ['', '', ''], // Empty rows (if needed)
        ['', '', ''],
        ['', '', ''],
        [
          administradores[0].nombre, // Ensure administradores[0] is defined
          administradores[1].nombre, // Ensure administradores[1] is defined
          remisiones.idcliente_clientes.nombre, // Ensure remisiones is defined
        ],
        [
          administradores[0].cargo, // Ensure administradores[0] is defined
          administradores[1].cargo, // Ensure administradores[1] is defined
          `CI: ${remisiones.idcliente_clientes.cedula}`, // Ensure remisiones is defined
        ],
      ],
    });
    const horaImpresion = this.getDateTime();
    doc.setFontSize(7);

    // Agregar el pie de página
    doc.text(
      `Fecha y hora de impresión: ${horaImpresion}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
    doc.save('Convenio por remision');
  }

  getDateTime() {
    var now = new Date();
    var year = now.getFullYear();
    var month = now.getMonth() + 1; // Meses comienzan en 0
    var day = now.getDate();
    var hour = now.getHours();
    var minute = now.getMinutes();
    var second = now.getSeconds();

    return (
      day + '/' + month + '/' + year + ' ' + hour + ':' + minute + ':' + second
    );
  }
}
