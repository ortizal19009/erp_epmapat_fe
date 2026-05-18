import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { UsuarioService } from './administracion/usuario.service';
import { TemplateHeaderService } from './template-header.service';
import { PersonalService } from './rrhh/personal.service';

@Injectable({
  providedIn: 'root',
})
export class TramitesAguaService {
  administradores = [
    { nombre: 'Ing. Juan Diego Delgado', cargo: 'Director Comercial' },
    { nombre: 'Ab. AndrÃ©s Montenegro', cargo: 'Asesor Legal' },
  ];

  constructor(
    private s_header: TemplateHeaderService,
    private s_personal: PersonalService,
    private s_usuario: UsuarioService
  ) {}

  listaTramitesAgua(datos: any) {
    const titulo = 'Lista de tramites de agua';
    const doc = new jsPDF('p', 'pt', 'a4');
    this.s_header.header(titulo, doc);
    autoTable(doc, {
      html: `#${datos}`,
    });
    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  }

  async genContratoTramite(aguatramite: any, abonado: any, servicio: string) {
    const titulo = 'CONCESIÃ“N DE SERVICIOS';
    const doc = new jsPDF('p', 'pt', 'a4');
    const margin = 30;
    const directorComercial = await this.obtenerDirectorComercialActivo();
    const usuarioResponsable = await this.obtenerUsuarioResponsable(aguatramite?.usucrea);

    this.s_header.header(titulo, doc);
    doc.setFontSize(10);
    doc.text(`TRAMITE: ${aguatramite.idaguatramite}`, margin, 160);
    doc.text(`Tipo de servicio, ${servicio}`, margin, 190);
    doc.text(`Nro. cuenta: ${abonado.idabonado}`, margin, 210);
    doc.text(`Propietario Cuenta: ${abonado.idcliente_clientes.nombre}`, margin, 225);
    doc.text(`C.I.: ${abonado.idcliente_clientes.cedula}`, margin, 240);
    doc.text(`DirecciÃ³n Cuenta: ${abonado.idcliente_clientes.direccion}`, margin, 255);
    doc.text('El solicitante ha cancelado los siguientes valores', margin, 270);

    autoTable(doc, {
      styles: {
        fillColor: [255, 255, 255],
        textColor: '#0000',
        fontSize: 10,
      },
      alternateRowStyles: { fillColor: [255, 255, 255] },
      startY: 280,
      margin,
      body: [
        ['No genero Rubros.'],
        [`Solicitante: ${abonado.idcliente_clientes.nombre}`],
        [`Observaciones: ${aguatramite.observacion}`],
      ],
    });

    this.agregarFirmasTramite(doc, {
      director: directorComercial,
      cliente: {
        nombre: abonado?.idcliente_clientes?.nombre || 'No registrado',
        detalle: abonado?.idcliente_clientes?.cedula || 'Sin identificacion',
      },
      responsable: usuarioResponsable,
      startY: (doc as any).lastAutoTable.finalY + 50,
      margin,
    });

    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  }

  async genComprobanteTramite(aguatramite: any) {
    const titulo = 'COMPROBANTE DE TRAMITE DE AGUA';
    const doc = new jsPDF('p', 'pt', 'a4');
    const margin = 30;
    const tipoTramite =
      aguatramite?.idtipotramite_tipotramite?.descripcion || 'Tramite de agua';
    const cliente = aguatramite?.idcliente_clientes?.nombre || 'No registrado';
    const identificacion = aguatramite?.idcliente_clientes?.cedula || 'No registrada';
    const medidor = aguatramite?.codmedidor || 'No aplica';
    const nroDocumento = aguatramite?.nrodocumento || 'No registrado';
    const observacion = aguatramite?.observacion || 'Sin observaciones';
    const fechaCrea = aguatramite?.feccrea
      ? new Date(aguatramite.feccrea).toLocaleDateString('es-EC')
      : 'No registrada';
    const fechaTermina = aguatramite?.fechaterminacion
      ? new Date(aguatramite.fechaterminacion).toLocaleDateString('es-EC')
      : 'No registrada';
    const directorComercial = await this.obtenerDirectorComercialActivo();
    const usuarioResponsable = await this.obtenerUsuarioResponsable(aguatramite?.usucrea);

    this.s_header.header(titulo, doc);
    doc.setFontSize(10);
    doc.text(`TRAMITE NRO: ${aguatramite?.idaguatramite ?? ''}`, margin, 160);
    doc.text(`TIPO DE TRAMITE: ${tipoTramite}`, margin, 180);
    doc.text(`CLIENTE: ${cliente}`, margin, 200);
    doc.text(`IDENTIFICACION: ${identificacion}`, margin, 220);
    doc.text(`MEDIDOR / REFERENCIA: ${medidor}`, margin, 240);
    doc.text(`DOCUMENTO DE RESPALDO: ${nroDocumento}`, margin, 260);
    doc.text(`FECHA DE INGRESO: ${fechaCrea}`, margin, 280);
    doc.text(`FECHA DE FINALIZACION: ${fechaTermina}`, margin, 300);
    doc.text('DETALLE DEL COMPROBANTE', margin, 330);

    autoTable(doc, {
      startY: 345,
      margin,
      styles: {
        fontSize: 10,
        cellPadding: 6,
      },
      body: [
        ['Observaciones', observacion],
      ],
    });

    this.agregarFirmasTramite(doc, {
      director: directorComercial,
      cliente: {
        nombre: cliente,
        detalle: identificacion,
      },
      responsable: usuarioResponsable,
      startY: (doc as any).lastAutoTable.finalY + 30,
      margin,
    });

    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  }

  async genHojaInspeccion(datos: any, titulo: string) {
    let medidor = 'NO';
    let agua = '';
    let alcantarillado = '';
    if (+datos.medidorempresa! === 1) {
      medidor = 'SI';
    }
    if (datos.agua === 1) {
      agua = 'InstalaciÃ³n agua potable:';
    }
    if (datos.alcantarillado === 1) {
      alcantarillado = 'InstalaciÃ³n alcantarillado:';
    }

    const doc = new jsPDF('p', 'pt', 'a4');
    const margx = 30;
    const margy = 570;
    const directorComercial = await this.obtenerDirectorComercialActivo();
    const usuarioResponsable = await this.obtenerUsuarioResponsable(datos?.usucrea);

    doc.setFontSize(10);
    this.s_header.header(titulo, doc);
    doc.setFontSize(10);
    doc.text('Tipo de trÃ¡mite: ', margx, 130);
    doc.text('Tramite Nro: ', margx, 150);
    doc.text(`Fecha creaciÃ³n: ${datos.feccrea}`, margx + 300, 150);
    doc.text('Servicios solicitados: ', margx, 170);
    doc.text(`${agua}`, margx + 20, 190);
    doc.text(`${alcantarillado}`, margx + 20, 210);
    doc.text('Adicional: ', margx + 300, 170);
    doc.text(`Medidor empresa: ${medidor}`, margx + 300, 190);
    doc.text('DATOS DEL SOLICITANTE ', margx, 230);
    doc.text(`Nombres: ${datos.idcliente_clientes.nombre}`, margx + 20, 240);
    doc.text(`DirecciÃ³n: ${datos.direccion}`, margx + 20, 250);
    doc.text(`Barrio: ${datos.barrio}`, margx + 20, 260);
    doc.text(`Ced/RUC: ${datos.idcliente_clientes.cedula}`, margx + 300, 240);
    doc.text(`Departamento: ${datos.departamento}`, margx + 300, 250);
    doc.text(`Nro. Casa: ${datos.nrocasa}`, margx + 300, 260);
    doc.text(datos.idcliente_clientes.nombre, margx + 275, 330);
    doc.text(
      'Solicito a la empresa/municipalidad, se sirva disponer el trÃ¡mite para la factibilidad de \nconcesiÃ³n del servicio requerido.',
      margx,
      280
    );
    doc.line(margx + 270, 320, margy - 50, 320);
    doc.line(margx, 350, margy, 350);
    doc.text('CROQUIS. ', margx, 360);
    doc.line(margx, 500, margy, 500);
    doc.text('FACTIBILIDAD. ', margx, 510);
    doc.text('TuberÃ­a principal: ', margx, 530);
    doc.line(margx + 140, 530, margy, 530);
    doc.text('Estado de la vÃ­a: ', margx, 545);
    doc.text('Tierra()  Adoquin() Asfalto() Cemento() Otro() ', margx + 140, 545);
    doc.text('CategorÃ­a: ', margx, 560);
    doc.text(
      'Residencial()  DomÃ©stica() Comercial() Oficial() Industrial() \nEspecial() Otro:_______',
      margx + 140,
      560
    );
    doc.text('Cuenta ref.(vecino): ', margx, 585);
    doc.line(margx + 140, 585, margy, 585);
    doc.text('Observaciones: ', margx, 600);
    doc.text(`${datos.observacion}`, margx + 140, 600);
    doc.line(margx + 140, 602, margy, 602);
    doc.line(margx + 140, 615, margy, 615);
    doc.text('Materiales a facturar: ', margx, 630);
    doc.line(margx + 140, 630, margy, 630);
    doc.line(margx, 645, margy, 645);
    doc.line(margx, 660, margy, 660);
    doc.line(margx, 675, margy, 675);
    doc.line(margx, 700, margy, 700);

    this.agregarFirmasTramite(doc, {
      director: directorComercial,
      cliente: {
        nombre: datos?.idcliente_clientes?.nombre || 'No registrado',
        detalle: datos?.idcliente_clientes?.cedula || 'Sin identificacion',
      },
      responsable: usuarioResponsable,
      startY: 710,
      margin: margx,
    });

    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  }

  async genContrato(datos: any) {
    const titulo = 'CONTRATO DE CONCESIÃ“N DE SERVICIOS';
    const doc = new jsPDF('p', 'pt', 'a4');
    const margin = 30;
    const directorComercial = await this.obtenerDirectorComercialActivo();
    const usuarioResponsable = await this.obtenerUsuarioResponsable(
      datos?.idaguatramite_aguatramite?.usucrea
    );
    const p1 = `Comparecen por una parte Gerente General de la Empresa PÃºblica Municipal de Agua Potable y Alcantarillado de TulcÃ¡n EPMAPA-T, conjuntamente con el seÃ±or(a) Asesor Legal, en calidad de concesionario, por otra parte en calidad de cliente el (la) SeÃ±or(a). ${datos.idaguatramite_aguatramite.idcliente_clientes.nombre}, domiciliado en ${datos.direccion}, para la concesiÃ³n del servicio de agua potable y/o alcantarillado de acuerdo a las siguientes clausulas: `;
    const p2 = `PRIMERA.- ConexiÃ³n del Servicio de Agua Potable. La EPMAPA-T, por medio del Departamento TÃ©cnico, realizarÃ¡ la conexiÃ³n del servicio de Agua Potable desde la tuberÃ­a matriz hasta el medidor de consumo, una vez que el cliente cumpla los requisitos legales establecidos. `;
    const p3 = `SEGUNDA.- Valores. Los derechos de instalaciÃ³n, reparaciÃ³n, desconexiÃ³n y otros servicios conexos se encuentran establecidos en la Ordenanza que Regula la DeterminaciÃ³n, RecaudaciÃ³n y AdministraciÃ³n de las Tasas por los Servicios de Agua Potable, Alcantarillado, Saneamiento, ConservaciÃ³n de Fuentes y RecolecciÃ³n de Basura, para la ciudad de TulcÃ¡n la cual normaliza l a operaciÃ³n y el funcionamiento de los sistemas de agua potable y alcantarillado. Los valores que pagarÃ¡ el usuario han sido establecidos de acuerdo con el valor de mano de obra, gastos administrativos y materiales ha utilizarse, mismos que se hallan detallados en la factura respectiva.\nEl medidor de consumo lo ha proporcionado la empresa el solicitante. `;
    const p4 = `TERCERA.- Materiales. La EPMAPA-T dotarÃ¡ del medidor y demÃ¡s materiales para la conexiÃ³n del servicio, sin embargo el costo deberÃ¡ ser asumido por el usuario, por la condiciÃ³n social o econÃ³mica dicho costo podrÃ¡ ser prorrateado para ser pagado en cuotas. Art. 17 del Reglamento de servicios.`;
    const p5 = `CUARTA.- El diÃ¡metro de la tuberÃ­a para la conexiÃ³n del Agua Potable, se concederÃ¡ de acuerdo a la necesidad del solicitante, y , previo la justificaciÃ³n del informe del Departamento TÃ©cnico, los valores ha cobrarse se establecerÃ¡n de acuerdo a lo determinado en la ordenanza y reglamento citados en la clÃ¡usula segunda de este documento.`;
    const p7 = `QUINTA.- Responsabilidades del Usuario. El propietario del inmueble serÃ¡ el Ãºnico responsable ante la EPMAPA-T por las relaciones derivadas de los servicios de agua potable y/o alcantarillado. En tal virtud, no podrÃ¡ alegar mora de su inquilino cuando el inmueble estuviere arrendado, asÃ­ como tambiÃ©n cambio de propietario. El usuario estÃ¡ en la obligaciÃ³n de permitir al personal de la EPMAPA-T, debidamente identificado, acceder al medidor y las instalaciones internas sin que esto constituya una violaciÃ³n a sus derechos. `;
    const p8 = `6.1 La EPMAPA-T emitirÃ¡ dentro de los 5 primeros dÃ­as de cada mes, las facturas por los servicios de agua potable y/o alcantarillado. `;
    const p9 = `6.2 la EPMAPA-T reconocerÃ¡ como vÃ¡lidos Ãºnicamente los pagos que se realicen en los lugares autorizados. `;
    const p10 = `6.3 Los inmuebles declarados de propiedad horizontal, que mantengan un solo medidor, serÃ¡n facturados con una sola planilla.`;
    const p11 = `6.4 El plazo para el pago de las planillas por consumo de agua potable y/o alcantarillado es de treinta (30) dÃ­as, contados a partir de la fecha de emisiÃ³n. `;
    const p12 = `6.5 El usuario que no haya cancelado su factura despuÃ©s de sesenta (60) dÃ­as, contados a partir de su emisiÃ³n, serÃ¡ sujeto de suspensiÃ³n de servicio previa notificaciÃ³n, en caso de no pago, se iniciarÃ¡ la acciÃ³n coactiva.`;
    const p13 = `6.6 Los reclamos y observaciones a las plantillas se presentarÃ¡n en un plazo de hasta sesenta (60) dÃ­as a partir de la fecha de emisiÃ³n de la facturaciÃ³n, complidos los cuales, la facturaciÃ³n realizada se la darÃ¡ por aceptada y sin opciÃ³n a reclamo. `;
    const p14 = `SÃ‰PTIMA.- AceptaciÃ³n. El solicitante declara estar de acuerdo en todo el contenido y se compromete a cumplir con todas las clausulas y las disposiciones descritas en el presente contrato. Para constancia y en acuerdo de las partes, se firma el presente contrato en original y copia de igual tenor y contenido. `;

    this.s_header.header(titulo, doc);
    doc.setFontSize(10);
    doc.text(`TRAMITE: ${datos.idaguatramite_aguatramite.idaguatramite}`, margin, 160);
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
      margin,
      body: [[p1], [p2], [p3], [p4], [p5], [p7], [p8], [p9], [p10], [p11], [p12], [p13], [p14]],
    });

    this.agregarFirmasTramite(doc, {
      director: directorComercial,
      cliente: {
        nombre: `${datos.idaguatramite_aguatramite.idcliente_clientes.nombre}`,
        detalle: `${datos.idaguatramite_aguatramite.idcliente_clientes.cedula}`,
      },
      responsable: usuarioResponsable,
      startY: (doc as any).lastAutoTable.finalY + 30,
      margin,
    });

    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  }

  private async obtenerDirectorComercialActivo(): Promise<{ nombre: string; cargo: string }> {
    try {
      const personal: any = await firstValueFrom(this.s_personal.getAllPersonal());
      const lista = Array.isArray(personal) ? personal : [];
      const director = lista.find((item: any) => {
        const cargo = `${item?.idcargo_cargos?.descripcion || item?.cargoActual || item?.cargo || ''}`.toLowerCase();
        return item?.estado === true && cargo.includes('director comercial');
      });

      if (director) {
        const nombreCompleto = [director?.sufijo || '', director?.apellidos || '', director?.nombres || '']
          .map((value: string) => value.trim())
          .filter(Boolean)
          .join(' ');
        return {
          nombre: nombreCompleto || director?.nomfirma?.trim() || this.administradores[0].nombre,
          cargo: director?.idcargo_cargos?.descripcion || director?.cargoActual || 'Director Comercial',
        };
      }
    } catch (error) {
      console.error('No se pudo obtener el director comercial activo', error);
    }

    return this.administradores[0];
  }

  private async obtenerUsuarioResponsable(idusuario: number | null | undefined): Promise<{ nombre: string }> {
    if (!idusuario) {
      return { nombre: 'Usuario no registrado' };
    }

    try {
      const usuario: any = await this.s_usuario.getByIdusuarioAsync(idusuario);
      return { nombre: usuario?.nomusu || usuario?.alias || `Usuario ${idusuario}` };
    } catch (error) {
      console.error('No se pudo obtener el usuario responsable del tramite', error);
      return { nombre: `Usuario ${idusuario}` };
    }
  }

  private agregarFirmasTramite(
    doc: jsPDF,
    data: {
      director: { nombre: string; cargo: string };
      cliente: { nombre: string; detalle: string };
      responsable: { nombre: string };
      startY: number;
      margin: number;
    }
  ) {
    autoTable(doc, {
      startY: data.startY,
      margin: data.margin,
      theme: 'plain',
      styles: {
        fontSize: 10,
        halign: 'center',
      },
      body: [
        ['______________________________', '______________________________', '______________________________'],
        [data.director.nombre, data.cliente.nombre, data.responsable.nombre],
        [data.director.cargo, data.cliente.detalle || 'Cliente dueno del tramite', 'Responsable del tramite'],
      ],
    });
  }
}
