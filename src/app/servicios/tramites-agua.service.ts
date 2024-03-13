import { Injectable } from '@angular/core';
import { TemplateHeaderService } from './template-header.service';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Injectable({
  providedIn: 'root',
})
export class TramitesAguaService {
  administradores = [
    { nombre: 'Ing. Juan Diego Delgado', cargo: 'Director Comercial' },
    { nombre: 'Abg. Rigoberto Narváez', cargo: 'Asesor Legal' },
  ];
  constructor(private s_header: TemplateHeaderService) {}

  listaTramitesAgua(datos: any) {
    let titulo: string = 'Lista de tramites de agua';
    let doc = new jsPDF('p', 'pt', 'a4');
    this.s_header.header(titulo, doc);
    autoTable(doc, {
      html: `#${datos}`,
    });
    doc.output('pdfobjectnewwindow', { filename: `${titulo}.pdf` });
  }

  genContratoTramite(aguatramite: any, abonado: any, servicio: string) {
    let titulo: string = 'CONCESIÓN DE SERVICIOS';
    let doc = new jsPDF('p', 'pt', 'a4');
    this.s_header.header(titulo, doc);
    let margin = 30;

    doc.setFontSize(10);
    doc.text(`TRAMITE: ${aguatramite.idaguatramite}`, margin, 160);
    doc.text(`Tipo de servicio, ${servicio}`, margin, 190);
    doc.text(`Nro. cuenta: ${abonado.idabonado}`, margin, 210);
    doc.text(
      `Propietario Cuenta: ${abonado.idcliente_clientes.nombre}`,
      margin,
      225
    );
    doc.text(`C.I.: ${abonado.idcliente_clientes.cedula}`, margin, 240);
    doc.text(
      `Dirección Cuenta: ${abonado.idcliente_clientes.direccion}`,
      margin,
      255
    );
    doc.text(`El solicitante ha cancelado los siguientes valores`, margin, 270);
    autoTable(doc, {
      styles: {
        fillColor: [255, 255, 255],
        textColor: '#0000',
        fontSize: 10,
      },
      alternateRowStyles: { fillColor: [255, 255, 255] },
      startY: 280,
      margin: margin,
      body: [
        ['No genero Rubros.'],
        [`Solicitante: ${abonado.idcliente_clientes.nombre}`],
        [`Observaciones: ${aguatramite.observacion}`],
        [],
        [],
        [],
        [`Ing. Juan Diego Delgado \nDIRECTOR GESTIÓN COMERCIAL`],
        [],
        [],
        [],
        [
          `${abonado.idcliente_clientes.nombre}\n${abonado.idcliente_clientes.cedula}`,
        ],
      ],
    });
    doc.output('pdfobjectnewwindow', { filename: `${titulo}.pdf` });
  }

  genHojaInspeccion(datos: any, titulo: string) {
    let medidor: string;
    let agua: string = '';
    let alcantarillado: string = '';
    if (+datos.medidorempresa! === 1) {
      medidor = 'SI';
    } else {
      medidor = 'NO';
    }
    if (datos.agua === 1) {
      agua = `Instalación agua potable:`;
    }
    if (datos.alcantarillado === 1) {
      alcantarillado = `Instalación alcantarillado:`;
    }
    let doc = new jsPDF('p', 'pt', 'a4');
    let margx = 30;
    let margy = 570;
    //doc.setFont('courier');
    doc.setFontSize(10);
    this.s_header.header(titulo, doc);
    doc.setFontSize(10);
    doc.text('Tipo de trámite: ', margx, 130);
    doc.text('Tramite Nro: ', margx, 150);
    doc.text(`Fecha creación: ${datos.feccrea}`, margx + 300, 150);
    doc.text('Servicios solicitados: ', margx, 170);
    doc.text(`${agua}`, margx + 20, 190);
    doc.text(`${alcantarillado}`, margx + 20, 210);
    doc.text('Adicional: ', margx + 300, 170);
    doc.text(`Medidor empresa: ${medidor}`, margx + 300, 190);
    doc.text('DATOS DEL SOLICITANTE ', margx, 230);
    doc.text(`Nombres: ${datos.idcliente_clientes.nombre}`, margx + 20, 240);
    doc.text(`Dirección: ${datos.direccion}`, margx + 20, 250);
    doc.text(`Barrio: ${datos.barrio}`, margx + 20, 260);
    doc.text(`Ced/RUC: ${datos.idcliente_clientes.cedula}`, margx + 300, 240);
    doc.text(`Departamento: ${datos.departamento}`, margx + 300, 250);
    doc.text(`Nro. Casa: ${datos.nrocasa}`, margx + 300, 260);
    doc.text(datos.idcliente_clientes.nombre, margx + 275, 330);
    doc.text(
      'Solicito a la empresa/municipalidad, se sirva disponer el trámite para la factibilidad de \nconcesión del servicio requerido.',
      margx,
      280
    );
    doc.line(margx + 270, 320, margy - 50, 320);
    doc.line(margx, 350, margy, 350);
    doc.text('CROQUIS. ', margx, 360);
    doc.line(margx, 500, margy, 500);
    doc.text('FACTIBILIDAD. ', margx, 510);
    doc.text('Tubería principal: ', margx, 530);
    doc.line(margx + 140, 530, margy, 530);
    doc.text('Estado de la vía: ', margx, 545);
    doc.text(
      'Tierra()  Adoquin() Asfalto() Cemento() Otro() ',
      margx + 140,
      545
    );
    doc.text('Categoría: ', margx, 560);
    doc.text(
      'Residencial()  Doméstica() Comercial() Oficial() Industrial() \nEspecial() Otro:_______',
      margx + 140,
      560
    );
    doc.text('Cuenta ref.(vecino): ', margx, 585);
    doc.line(margx + 140, 585, margy, 585);
    doc.text(`Observaciones: `, margx, 600);
    doc.text(`${datos.observacion}`, margx + 140, 600);
    doc.line(margx + 140, 602, margy, 602);
    doc.line(margx + 140, 615, margy, 615);
    doc.text(`Materiales a facturar: `, margx, 630);
    doc.line(margx + 140, 630, margy, 630);
    doc.line(margx, 645, margy, 645);
    doc.line(margx, 660, margy, 660);
    doc.line(margx, 675, margy, 675);
    doc.line(margx, 700, margy, 700);
    doc.text(`Inspector: `, margx, 715);
    doc.line(margx + 130, 720, margy - 300, 720);
    doc.text(`Firma: `, margx + 300, 720);
    doc.line(margx + 370, 720, margy, 720);
    doc.text(`Dir. Técnica(Aut): `, margx, 740);
    doc.line(margx + 130, 740, margy - 300, 740);
    doc.text(`Firma: `, margx + 300, 740);
    doc.line(margx + 370, 740, margy, 740);

    doc.output('pdfobjectnewwindow', { filename: `${titulo}.pdf` });
  }

  genContrato(datos: any) {
    console.log(datos);
    let titulo: string = 'CONTRATO DE CONCESIÓN DE SERVICIOS';
    let doc = new jsPDF('p', 'pt', 'a4');
    this.s_header.header(titulo, doc);
    let margin = 30;
    let p1 = `Comparecen por una parte Gerente General de la Empresa Pública Municipal de Agua Potable y Alcantarillado de Tulcán EPMAPA-T, conjuntamente con el señor(a) Asesor Legal, en calidad de concesionario, por otra parte en calidad de cliente el (la) Señor(a). ${datos.idaguatramite_aguatramite.idcliente_clientes.nombre}, domiciliado en ${datos.direccion}, para la concesión del servicio de agua potable y/o alcantarillado de acuerdo a las siguientes clausulas: `;
    let p2 = `PRIMERA.- Conexión del Servicio de Agua Potable. La EPMAPA-T, por medio del Departamento Técnico, realizará la conexión del servicio de Agua Potable desde la tubería matriz hasta el medidor de consumo, una vez que el cliente cumpla los requisitos legales establecidos. `;
    let p3 = `SEGUNDA.- Valores. Los derechos de instalación, reparación, desconexión y otros servicios conexos se encuentran establecidos en la Ordenanza que Regula la Determinación, Recaudación y Administración de las Tasas por los Servicios de Agua Potable, Alcantarillado, Saneamiento, Conservación de Fuentes y Recolección de Basura, para la ciudad de Tulcán la cual normaliza l a operación y el funcionamiento de los sistemas de agua potable y alcantarillado. Los calores que pagará el usuario han sido establecidos de acuerdo con el valor de mano de obra, gastos administrativos y materiales ha utilizarse, mismos que se hallan detallados en la factura respectiva.
    \nEl medidor de consumo lo ha proporcionado la empresa el solicitante. `;
    let p4 = `TERCERA.- Materiales. La EPMAPA-T dotará del medidor y demás materiales para la conexión del servicio, sin embargo el costo deberá ser asumido por el usuario, por la condición social o económica dicho costo podrá ser prorrateado para ser pagado en cuotas. Art. 17 del Reglamento de servicios.`;
    let p5 = `CUARTA.- El diámetro de la tubería para la conexión del Agua Potable, se concederá de acuerdo a la necesidad del solicitante, y , previo la justificación del informe del Departamento Técnico, los valores ha cobrarse se establecerán de acuerdo a lo determinado en la ordenanza y reglamento citados en la cláusula segunda de este documento.`;
    let p7 = `QUINTA.- Responsabilidades del Usuario. El propietario del inmueble será el único responsable ante la EPMAPA-T por las relaciones derivadas de los servicios de agua potable y/o alcantarillado. En tal virtud, no podrá alegar mora de su inquilino cuando el inmueble estuviere arrendado, así como también cambio de propietario. El usuario está en la obligación de permitir al personal de la EPMAPA-T, debidamente identificado, acceder al medidor y las instalaciones internas sin que esto constituya una violación a sus derechos. `;
    let p8 = `6.1 La EPMAPA-T emitirá dentro de los 5 primeros días de cada mes, las facturas por los servicios de agua potable y/o alcantarillado. `;
    let p9 = `6.2 la EPMAPA-T reconocerá como válidos únicamente los pagos que se realicen en los lugares autorizados. `;
    let p10 = `6.3 Los inmuebles declarados de propiedad horizontal, que mantengan un solo medidor, serán facturados con una sola planilla.`;
    let p11 = `6.4 El plazo para el pago de las planillas por consumo de agua potable y/o alcantarillado es de treinta (30) días, contados a partir de la fecha de emisión. `;
    let p12 = `6.5 El usuario que no haya cancelado su factura después de sesenta (60) días, contados a partir de su emisión, será sujeto de suspensión de servicio previa notificación, en caso de no pago, se iniciará la acción coactiva.`;
    let p13 = `6.6 Los reclamos y observaciones a las plantillas se presentarán en un plazo de hasta sesenta (60) días a partir de la fecha de emisión de la facturación, complidos los cuales, la facturación realizada se la dará por aceptada y sin opción a reclamo. `;
    let p14 = `SÉPTIMA.- Aceptación. El solicitante declara estar de acuerdo en todo el contenido y se compromete a cumplir con todas las clausulas y las disposiciones descritas en el presente contrato. Para constancia y en acuerdo de las partes, se firma el presente contrato en original y copia de igual tenor y contenido. `;
    doc.setFontSize(10);
    doc.text(
      `TRAMITE: ${datos.idaguatramite_aguatramite.idaguatramite}`,
      margin,
      160
    );
    doc.text(`TULCAN, ${datos.fechafinalizacion}`, margin, 250);
    doc.text(`Nro. cuenta: ${datos}`, margin, 270);
    autoTable(doc, {
      styles: {
        fillColor: [255, 255, 255],
        textColor: '#0000',
        fontSize: 11,
        halign: 'justify',
      },
      alternateRowStyles: { fillColor: [255, 255, 255] },
      startY: 290,
      margin: margin,
      body: [
        [p1],
        [p2],
        [p3],
        [p4],
        [p5],
        [p7],
        [p8],
        [p9],
        [p10],
        [p11],
        [p12],
        [p13],
        [p14],
      ],
    });
    autoTable(doc, {
      bodyStyles: { halign: 'justify' },
      alternateRowStyles: { fillColor: [255, 255, 255] },
      body: [
        ['____________________________', '____________________________'],
        [this.administradores[0].nombre, this.administradores[1].nombre],
        [this.administradores[0].cargo, this.administradores[1].cargo],
      ],
    });

    doc.output('pdfobjectnewwindow', { filename: `${titulo}.pdf` });
  }
}
