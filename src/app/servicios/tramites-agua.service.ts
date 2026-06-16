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
    { nombre: 'Director de Gestión Técnica', cargo: 'DIRECTOR DE GESTIÓN TÉCNICA' },
    { nombre: 'Ab. Andrés Montenegro', cargo: 'Asesor Legal' },
  ];

  constructor(
    private s_header: TemplateHeaderService,
    private s_personal: PersonalService,
    private s_usuario: UsuarioService
  ) {}

  listaTramitesAgua(datos: any) {
    const titulo = 'Lista de trámites de agua';
    const doc = new jsPDF('p', 'pt', 'a4');
    this.s_header.header(titulo, doc);
    autoTable(doc, {
      html: `#${datos}`,
    });
    return doc.output('blob');
  }

  listaTramitesAguaFiltrados(datos: any[], titulo = 'Lista de trámites de agua'): Blob {
    const doc = new jsPDF('p', 'pt', 'a4');
    this.s_header.header(titulo, doc);

    autoTable(doc, {
      startY: 150,
      styles: {
        fontSize: 9,
        cellPadding: 4,
        overflow: 'linebreak',
      },
      head: [['#', 'Cliente', 'Cuenta', 'F. Inicia', 'Estado', 'Observaciones']],
      body: (datos || []).map((item: any, index: number) => [
        String(index + 1),
        this.getClienteNombre(item),
        this.getCuentaTramite(item),
        this.formatDate(item?.feccrea),
        this.getEstadoTexto(item?.estado),
        item?.observacion || '',
      ]),
    });

    return doc.output('blob');
  }

  private openBlobInNewTab(blob: Blob): void {
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  }

  async genContratoTramite(aguatramite: any, abonado: any, servicio: string) {
    const blob = await this.buildContratoTramiteBlob(aguatramite, abonado, servicio);
    this.openBlobInNewTab(blob);
  }

  async buildContratoTramiteBlob(aguatramite: any, abonado: any, servicio: string): Promise<Blob> {
    const titulo = 'CONCESIÓN DE SERVICIOS';
    const doc = new jsPDF('p', 'pt', 'a4');
    const margin = 30;
    const directorComercial = await this.obtenerDirectorComercialActivo();
    const usuarioResponsable = await this.obtenerUsuarioResponsable(aguatramite?.usucrea);

    this.s_header.header(titulo, doc);
    doc.setFontSize(10);
    doc.text(`TRÁMITE: ${aguatramite.idaguatramite}`, margin, 160);
    doc.text(`Tipo de servicio: ${servicio}`, margin, 190);
    doc.text(`Nro. cuenta: ${abonado.idabonado}`, margin, 210);
    doc.text(`Propietario cuenta: ${abonado.idcliente_clientes.nombre}`, margin, 225);
    doc.text(`C.I.: ${abonado.idcliente_clientes.cedula}`, margin, 240);
    doc.text(`Dirección cuenta: ${abonado.idcliente_clientes.direccion}`, margin, 255);
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
        ['No generó rubros.'],
        [`Solicitante: ${abonado.idcliente_clientes.nombre}`],
        [`Observaciones: ${aguatramite.observacion}`],
      ],
    });

    this.agregarFirmasTramite(doc, {
      director: directorComercial,
      cliente: {
        nombre: abonado?.idcliente_clientes?.nombre || 'No registrado',
        detalle: abonado?.idcliente_clientes?.cedula || 'Sin identificación',
      },
      responsable: usuarioResponsable,
      startY: (doc as any).lastAutoTable.finalY + 50,
      margin,
    });

    return doc.output('blob');
  }

  async genComprobanteTramite(aguatramite: any) {
    const blob = await this.buildComprobanteTramiteBlob(aguatramite);
    this.openBlobInNewTab(blob);
  }

  async buildComprobanteTramiteBlob(aguatramite: any): Promise<Blob> {
    const titulo = 'COMPROBANTE DE TRÁMITE DE AGUA';
    const doc = new jsPDF('p', 'pt', 'a4');
    const margin = 30;
    const tipoTramite =
      aguatramite?.idtipotramite_tipotramite?.descripcion || 'Trámite de agua';
    const clienteData = this.normalizarCliente(aguatramite);
    const cliente = clienteData.nombre;
    const identificacion = clienteData.cedula;
    const medidor = aguatramite?.codmedidor || 'No aplica';
    const nroDocumento = aguatramite?.nrodocumento || 'No registrado';
    const observacion = aguatramite?.observacion || 'Sin observaciones';
    const fechaCrea = this.formatDate(aguatramite?.feccrea);
    const fechaTermina = this.formatDate(aguatramite?.fechaterminacion);
    const directorComercial = await this.obtenerDirectorComercialActivo();
    const usuarioResponsable = await this.obtenerUsuarioResponsable(aguatramite?.usucrea);

    this.s_header.header(titulo, doc);
    doc.setFontSize(10);
    doc.text(`TRÁMITE NRO: ${aguatramite?.idaguatramite ?? ''}`, margin, 160);
    doc.text(`TIPO DE TRÁMITE: ${tipoTramite}`, margin, 180);
    doc.text(`CLIENTE: ${cliente}`, margin, 200);
    doc.text(`IDENTIFICACIÓN: ${identificacion}`, margin, 220);
    doc.text(`MEDIDOR / REFERENCIA: ${medidor}`, margin, 240);
    doc.text(`DOCUMENTO DE RESPALDO: ${nroDocumento}`, margin, 260);
    doc.text(`FECHA DE INGRESO: ${fechaCrea}`, margin, 280);
    doc.text(`FECHA DE FINALIZACIÓN: ${fechaTermina}`, margin, 300);
    doc.text('DETALLE DEL COMPROBANTE', margin, 330);

    autoTable(doc, {
      startY: 345,
      margin,
      styles: {
        fontSize: 10,
        cellPadding: 6,
      },
      body: [['Observaciones', observacion]],
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

    return doc.output('blob');
  }

  async genHojaInspeccion(datos: any, titulo: string) {
    const blob = await this.buildHojaInspeccionBlob(datos, titulo);
    this.openBlobInNewTab(blob);
  }

  async buildHojaInspeccionBlob(datos: any, titulo: string): Promise<Blob> {
    let medidor = 'NO';
    if (+datos.medidorempresa! === 1) {
      medidor = 'SI';
    }

    const doc = new jsPDF('p', 'pt', 'a4');
    const margx = 30;
    const margy = 570;
    const fechaCreacion = this.formatDate(datos?.feccrea);
    const direccion = this.getDisplayValue(datos?.direccion);
    const barrio = this.getDisplayValue(datos?.barrio);
    const departamento = this.getDisplayValue(datos?.departamento ?? datos?.nrodepar);
    const nroCasa = this.getDisplayValue(datos?.nrocasa);
    const observacion = this.getDisplayValue(datos?.observacion);
    const nombreSolicitante = this.getDisplayValue(datos?.idcliente_clientes?.nombre, 'No registrado');
    const cedulaSolicitante = this.getDisplayValue(
      datos?.idcliente_clientes?.cedula,
      'Sin identificaciÃ³n'
    );
    datos.idcliente_clientes = {
      ...(datos?.idcliente_clientes || {}),
      nombre: nombreSolicitante,
      cedula: cedulaSolicitante,
    };
    const serviciosSolicitados = this.buildServiciosSolicitados(datos);
    const tituloDocumento = titulo || 'Concesión de servicios';
    const directorGestionTecnica = await this.obtenerDirectorGestionTecnicaActivo();
    const usuarioResponsable = await this.obtenerUsuarioResponsable(datos?.usucrea);

    this.s_header.header(tituloDocumento, doc);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Trámite Nro:', margx, 150);
    doc.text('Fecha creación:', margx + 280, 150);
    doc.setFont('helvetica', 'normal');
    doc.text(`${datos?.idaguatramite ?? ''}`, margx + 80, 150);
    doc.text(fechaCreacion, margx + 365, 150);
    doc.line(margx, 158, 560, 158);

    doc.setFont('helvetica', 'bold');
    doc.text('Servicios solicitados:', margx, 178);
    doc.text('Adicional:', margx + 300, 178);
    doc.setFont('helvetica', 'normal');
    const lineasServicios = serviciosSolicitados.split('\n');
    lineasServicios.forEach((linea, index) => {
      doc.text(linea, margx + 20, 190 + index * 16);
    });
    doc.text(`Medidor empresa: ${medidor}`, margx + 300, 190);

    doc.setFont('helvetica', 'bold');
    doc.text('DATOS DEL SOLICITANTE', margx, 230);
    doc.setFont('helvetica', 'normal');
    doc.text(`Nombres: ${nombreSolicitante}`, margx + 20, 240);
    doc.text(`Dirección: ${direccion}`, margx + 20, 250);
    doc.text(`Barrio: ${barrio}`, margx + 20, 260);
    doc.text(`Ced/RUC: ${cedulaSolicitante}`, margx + 300, 240);
    doc.text(`Departamento: ${departamento}`, margx + 300, 250);
    doc.text(`Nro. Casa: ${nroCasa}`, margx + 300, 260);
    doc.text(nombreSolicitante, margx + 275, 330);
    doc.text(
      'Solicito a la empresa/municipalidad, se sirva disponer el trámite para la factibilidad de \nconcesión del servicio requerido.',
      margx,
      280
    );
    doc.line(margx + 270, 320, margy - 50, 320);
    doc.line(margx, 350, margy, 350);
    doc.text('CROQUIS.', margx, 360);
    doc.line(margx, 500, margy, 500);
    doc.text('FACTIBILIDAD.', margx, 510);
    doc.text('Tubería principal:', margx, 530);
    doc.line(margx + 140, 530, margy, 530);
    doc.text('Estado de la vía:', margx, 545);
    doc.text('Tierra()  Adoquín() Asfalto() Cemento() Otro()', margx + 140, 545);
    doc.text('Categoría:', margx, 560);
    doc.text(
      'Residencial()  Doméstica() Comercial() Oficial() Industrial() \nEspecial() Otro:_______',
      margx + 140,
      560
    );
    doc.text('Cuenta ref.(vecino):', margx, 585);
    doc.line(margx + 140, 585, margy, 585);
    doc.text('Observaciones:', margx, 600);
    doc.text(observacion, margx + 140, 600);
    doc.line(margx + 140, 602, margy, 602);
    doc.line(margx + 140, 615, margy, 615);
    doc.text('Materiales a facturar:', margx, 630);
    doc.line(margx + 140, 630, margy, 630);
    doc.line(margx, 645, margy, 645);
    doc.line(margx, 660, margy, 660);
    doc.line(margx, 675, margy, 675);
    doc.line(margx, 700, margy, 700);

    this.agregarFirmasHojaInspeccion(doc, {
      director: directorGestionTecnica,
      cliente: {
        nombre: datos?.idcliente_clientes?.nombre || 'No registrado',
        detalle: datos?.idcliente_clientes?.cedula || 'Sin identificación',
      },
      responsable: usuarioResponsable,
      startY: 740,
      margin: margx,
    });

    return doc.output('blob');
  }

  async genContrato(datos: any) {
    const blob = await this.buildContratoBlob(datos);
    this.openBlobInNewTab(blob);
  }

  async buildContratoBlob(datos: any): Promise<Blob> {
    const titulo = 'CONTRATO DE CONCESIÓN DE SERVICIOS';
    const doc = new jsPDF('p', 'pt', 'a4');
    const margin = 30;
    const directorComercial = await this.obtenerDirectorComercialActivo();
    const usuarioResponsable = await this.obtenerUsuarioResponsable(
      datos?.idaguatramite_aguatramite?.usucrea
    );
    const nombreCliente = this.getDisplayValue(
      datos?.idaguatramite_aguatramite?.idcliente_clientes?.nombre,
      'No registrado'
    );
    const cedulaCliente = this.getDisplayValue(
      datos?.idaguatramite_aguatramite?.idcliente_clientes?.cedula,
      'Sin identificaciÃ³n'
    );
    datos.idaguatramite_aguatramite = {
      ...(datos?.idaguatramite_aguatramite || {}),
      idcliente_clientes: {
        ...(datos?.idaguatramite_aguatramite?.idcliente_clientes || {}),
        nombre: nombreCliente,
        cedula: cedulaCliente,
      },
    };
    const p1 = `Comparecen por una parte el Gerente General de la Empresa Pública Municipal de Agua Potable y Alcantarillado de Tulcán EPMAPA-T, conjuntamente con el señor(a) Asesor Legal, en calidad de concesionario, y por otra parte, en calidad de cliente, el (la) Señor(a) ${datos.idaguatramite_aguatramite.idcliente_clientes.nombre}, domiciliado en ${datos.direccion}, para la concesión del servicio de agua potable y/o alcantarillado de acuerdo a las siguientes cláusulas: `;
    const p2 = `PRIMERA.- Conexión del servicio de agua potable. La EPMAPA-T, por medio del Departamento Técnico, realizará la conexión del servicio de agua potable desde la tubería matriz hasta el medidor de consumo, una vez que el cliente cumpla los requisitos legales establecidos. `;
    const p3 = `SEGUNDA.- Valores. Los derechos de instalación, reparación, desconexión y otros servicios conexos se encuentran establecidos en la ordenanza que regula la determinación, recaudación y administración de las tasas por los servicios de agua potable, alcantarillado, saneamiento, conservación de fuentes y recolección de basura, para la ciudad de Tulcán, la cual normaliza la operación y el funcionamiento de los sistemas de agua potable y alcantarillado. Los valores que pagará el usuario han sido establecidos de acuerdo con el valor de mano de obra, gastos administrativos y materiales a utilizarse, mismos que se hallan detallados en la factura respectiva.\nEl medidor de consumo lo ha proporcionado la empresa al solicitante. `;
    const p4 = `TERCERA.- Materiales. La EPMAPA-T dotará del medidor y demás materiales para la conexión del servicio; sin embargo, el costo deberá ser asumido por el usuario. Por la condición social o económica, dicho costo podrá ser prorrateado para ser pagado en cuotas. Art. 17 del Reglamento de servicios.`;
    const p5 = `CUARTA.- El diámetro de la tubería para la conexión del agua potable se concederá de acuerdo a la necesidad del solicitante y, previa la justificación del informe del Departamento Técnico, los valores a cobrarse se establecerán de acuerdo a lo determinado en la ordenanza y reglamento citados en la cláusula segunda de este documento.`;
    const p7 = `QUINTA.- Responsabilidades del usuario. El propietario del inmueble será el único responsable ante la EPMAPA-T por las relaciones derivadas de los servicios de agua potable y/o alcantarillado. En tal virtud, no podrá alegar mora de su inquilino cuando el inmueble estuviere arrendado, así como también cambio de propietario. El usuario está en la obligación de permitir al personal de la EPMAPA-T, debidamente identificado, acceder al medidor y a las instalaciones internas sin que esto constituya una violación a sus derechos. `;
    const p8 = `6.1 La EPMAPA-T emitirá dentro de los 5 primeros días de cada mes las facturas por los servicios de agua potable y/o alcantarillado. `;
    const p9 = `6.2 La EPMAPA-T reconocerá como válidos únicamente los pagos que se realicen en los lugares autorizados. `;
    const p10 = `6.3 Los inmuebles declarados de propiedad horizontal, que mantengan un solo medidor, serán facturados con una sola planilla.`;
    const p11 = `6.4 El plazo para el pago de las planillas por consumo de agua potable y/o alcantarillado es de treinta (30) días, contados a partir de la fecha de emisión. `;
    const p12 = `6.5 El usuario que no haya cancelado su factura después de sesenta (60) días, contados a partir de su emisión, será sujeto de suspensión de servicio previa notificación; en caso de no pago, se iniciará la acción coactiva.`;
    const p13 = `6.6 Los reclamos y observaciones a las planillas se presentarán en un plazo de hasta sesenta (60) días a partir de la fecha de emisión de la facturación, cumplidos los cuales, la facturación realizada se dará por aceptada y sin opción a reclamo. `;
    const p14 = `SÉPTIMA.- Aceptación. El solicitante declara estar de acuerdo con todo el contenido y se compromete a cumplir con todas las cláusulas y disposiciones descritas en el presente contrato. Para constancia y en acuerdo de las partes, se firma el presente contrato en original y copia de igual tenor y contenido. `;

    this.s_header.header(titulo, doc);
    doc.setFontSize(10);
    doc.text(`TRÁMITE: ${datos.idaguatramite_aguatramite.idaguatramite}`, margin, 160);
    doc.text(`TULCÁN, ${datos.fechafinalizacion}`, margin, 250);
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

    return doc.output('blob');
  }

  private formatDate(value: string | Date | null | undefined): string {
    if (!value) {
      return 'No registrada';
    }

    const fecha = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(fecha.getTime())) {
      return 'No registrada';
    }

    return fecha.toLocaleDateString('es-EC', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  private getDisplayValue(value: unknown, fallback = 'SN'): string {
    const normalized = String(value ?? '').trim();
    return normalized && normalized !== 'undefined' && normalized !== 'null' ? normalized : fallback;
  }

  private getEstadoTexto(estado: number): string {
    const estados: Record<number, string> = {
      0: 'Eliminado',
      1: 'Recien ingresado',
      2: 'Inspeccionando',
      3: 'Aprobado',
      4: 'Notificado',
      5: 'Contrato generado',
      6: 'Negado',
    };

    return estados[estado] || '';
  }

  private getCuentaTramite(aguatramite: any): string {
    return `${aguatramite?.idabonado ?? aguatramite?.idabonado_abonados?.idabonado ?? aguatramite?.abonado?.idabonado ?? aguatramite?.codmedidor ?? ''}`;
  }

  private getClienteNombre(origen: any): string {
    return this.normalizarCliente(origen).nombre;
  }

  private normalizarCliente(origen: any): { nombre: string; cedula: string; direccion: string } {
    const cliente =
      origen?.idcliente_clientes ||
      origen?.idcliente ||
      origen?.cliente ||
      origen?.idaguatramite_aguatramite?.idcliente_clientes ||
      origen?.idaguatramite_aguatramite?.idcliente ||
      origen?.abonado?.idcliente_clientes ||
      origen?.idabonado_abonados?.idcliente_clientes ||
      {};

    return {
      nombre: this.getDisplayValue(
        cliente?.nombre || cliente?.nombres || cliente?.razonsocial,
        'No registrado'
      ),
      cedula: this.getDisplayValue(cliente?.cedula, 'Sin identificación'),
      direccion: this.getDisplayValue(cliente?.direccion, 'SN'),
    };
  }

  private buildServiciosSolicitados(datos: any): string {
    const servicios: string[] = [];
    const agua = Number(datos?.agua ?? datos?.solicitaagua ?? 0);
    const alcantarillado = Number(datos?.alcantarillado ?? datos?.solicitaalcantarillado ?? 0);

    if (agua === 1) {
      servicios.push('- Instalación agua potable');
    }
    if (alcantarillado === 1) {
      servicios.push('- Instalación alcantarillado');
    }

    return servicios.length ? servicios.join('\n') : '- No especificado';
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

  private async obtenerDirectorGestionTecnicaActivo(): Promise<{ nombre: string; cargo: string }> {
    try {
      const personal: any = await firstValueFrom(this.s_personal.getAllPersonal());
      const lista = Array.isArray(personal) ? personal : [];
      const director = lista.find((item: any) => {
        const cargo = this.normalizarTexto(
          item?.idcargo_cargos?.descripcion || item?.cargoActual || item?.cargo || ''
        );
        return item?.estado === true && cargo.includes('director de gestion tecnica');
      });

      if (director) {
        const nombreCompleto = [director?.sufijo || '', director?.apellidos || '', director?.nombres || '']
          .map((value: string) => value.trim())
          .filter(Boolean)
          .join(' ');
        return {
          nombre: nombreCompleto || director?.nomfirma?.trim() || this.administradores[1].nombre,
          cargo: 'DIRECTOR DE GESTIÓN TÉCNICA',
        };
      }
    } catch (error) {
      console.error('No se pudo obtener el director de gestion tecnica activo', error);
    }

    return this.administradores[1];
  }

  private normalizarTexto(value: string): string {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  private async obtenerUsuarioResponsable(idusuario: number | null | undefined): Promise<{ nombre: string }> {
    if (!idusuario) {
      return { nombre: 'Usuario no registrado' };
    }

    try {
      const usuario: any = await this.s_usuario.getByIdusuarioAsync(idusuario);
      return { nombre: usuario?.nomusu || usuario?.alias || `Usuario ${idusuario}` };
    } catch (error) {
      console.error('No se pudo obtener el usuario responsable del trámite', error);
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
        [data.director.cargo, data.cliente.detalle || 'Cliente dueño del trámite', 'Responsable del trámite'],
      ],
    });
  }

  private agregarFirmasHojaInspeccion(
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
        fontSize: 8,
        halign: 'center',
        cellPadding: 2,
      },
      columnStyles: {
        0: { cellWidth: 130 },
        1: { cellWidth: 130 },
        2: { cellWidth: 130 },
        3: { cellWidth: 130 },
      },
      body: [
        ['________________________', '________________________', '________________________', '________________________'],
        ['________________________', data.cliente.nombre, data.responsable.nombre, data.director.nombre],
        ['INSPECTOR', data.cliente.detalle || 'Usuario', 'RESPONSABLE DEL TRAMITE', data.director.cargo],
      ],
    });
  }
}
