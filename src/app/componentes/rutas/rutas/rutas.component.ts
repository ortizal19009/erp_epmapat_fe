import { Component, HostListener, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { ColoresService } from 'src/app/compartida/colores.service';
import { Rutas } from 'src/app/modelos/rutas.model';
import { AbonadosService } from 'src/app/servicios/abonados.service';
import { LecturasService } from 'src/app/servicios/lecturas.service';
import { LoadingService } from 'src/app/servicios/loading.service';
import { RutasService } from 'src/app/servicios/rutas.service';
import { RutasxemisionService } from 'src/app/servicios/rutasxemision.service';
import { UsrxrutaServiceService } from 'src/app/servicios/usrxruta-service.service';

@Component({
  selector: 'app-rutas',
  templateUrl: './rutas.component.html',
  styleUrls: ['./rutas.component.css'],
})
export class RutasComponent implements OnInit {
  filtro: string;
  _rutas: any;
  _deudasRuta: any;
  _abonados: any;
  ruta: any;
  rutaSeleccionada: any = null;
  tipoReporteSeleccionado: 'resumen' | 'lecturas' = 'resumen';
  formatoReporteSeleccionado: 'pdf' | 'xml' = 'pdf';
  exportandoReporte = false;
  pdfPreviewUrl: SafeResourceUrl | null = null;
  private pdfPreviewObjectUrl: string | null = null;
  private reporteActual: any = null;

  constructor(
    private rutService: RutasService,
    private router: Router,
    private coloresService: ColoresService,
    public authService: AutorizaService,
    private loading: LoadingService,
    private s_abonado: AbonadosService,
    private lecturasService: LecturasService,
    private rutasxemisionService: RutasxemisionService,
    private usrxrutaService: UsrxrutaServiceService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    sessionStorage.setItem('ventana', '/rutas');
    let coloresJSON = sessionStorage.getItem('/rutas');
    if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));
    else this.buscaColor();

    this.listaRutas();
  }

  // @HostListener('window:beforeunload', ['$event'])
  // unloadHandler(event: Event): void {
  //    alert('Alerta')
  //    // Puedes agregar lógica aquí para determinar si permitir o no la recarga
  //    // Por ejemplo, devolver un mensaje personalizado
  //    // Este es el nuevo método para prevenir la acción predeterminada
  //    event.preventDefault();
  // }

  // onNavigationEnd() {
  //    this.router.navigate(['/app-rutas']);
  // }

  async buscaColor() {
    try {
      const datos = await this.coloresService.setcolor(1, 'rutas');
      const coloresJSON = JSON.stringify(datos);
      sessionStorage.setItem('/rutas', coloresJSON);
      this.colocaColor(datos);
    } catch (error) {
      console.error(error);
    }
  }

  colocaColor(colores: any) {
    document.documentElement.style.setProperty('--bgcolor1', colores[0]);
    const cabecera = document.querySelector('.cabecera');
    if (cabecera) cabecera.classList.add('nuevoBG1');
    document.documentElement.style.setProperty('--bgcolor2', colores[1]);
    const detalle = document.querySelector('.detalle');
    if (detalle) detalle.classList.add('nuevoBG2');
  }

  public listaRutas() {
    this.rutService.getListaRutas().subscribe({
      next: (rutas) => (this._rutas = rutas),
      error: (err) => console.error(err.error),
    });
  }

  onCellClick(event: any, ruta: Rutas) {
    this.rutaSeleccionada = ruta;
    const tagName = event.target.tagName;
    if (tagName === 'TD') {
      //  sessionStorage.setItem('codparToAuxgasto', presupue.codpar.toString());
      //  sessionStorage.setItem('nomparToAuxiliar', presupue.nompar.toString());
      //  sessionStorage.setItem('iniciaToAuxiliar', presupue.inicia.toString());
      //  this.router.navigate(['aux-gasto']);
    }
  }

  eliminarRuta(idruta: number) {
    this.rutService.deleteRuta(idruta).subscribe({
      next: (datos) => this.listaRutas(),
      error: (err) => console.error(err.error),
    });
  }

  modificarRuta(ruta: Rutas) {
    localStorage.setItem('idruta', ruta.idruta.toString());
    this.router.navigate(['modificar-rutas']);
  }

  mostrarDatos(ruta: Rutas) {
    let cod = ruta.codigo;
    console.log(cod[0]);
  }
  setRuta(ruta: any){
  this.ruta = ruta}

  public info(idruta: number) {
    sessionStorage.setItem('idrutaToInfo', idruta.toString());
    this.router.navigate(['info-ruta']);
  }
  async getDeudasOfRuta(idruta: number) {
    this.loading.showLoading();
    this._deudasRuta = [];
    this._deudasRuta = await this.rutService.getDeudaOfCuentasByIdrutas(idruta);
    this.loading.hideLoading();
  }
  getAbonadosByRuta(idruta: number) {
    this.loading.showLoading();
    this.s_abonado.getByIdrutaAsync(idruta).then((abonados: any) => {
      console.log(abonados);
      this._abonados = abonados;
      this.loading.hideLoading();
    });
  }

  async generarReporteRuta() {
    if (!this.rutaSeleccionada?.idruta) {
      return;
    }

    this.exportandoReporte = true;
    this.cerrarVistaPreviaPdf();

    try {
      const reporte =
        this.tipoReporteSeleccionado === 'resumen'
          ? await this.construirReporteResumenRuta(this.rutaSeleccionada)
          : await this.construirReporteLecturasRuta(this.rutaSeleccionada);

      this.reporteActual = reporte;

      if (this.formatoReporteSeleccionado === 'pdf') {
        const blob =
          this.tipoReporteSeleccionado === 'resumen'
            ? this.buildPdfResumenRuta(reporte)
            : this.buildPdfLecturasRuta(reporte);
        this.pdfPreviewObjectUrl = URL.createObjectURL(blob);
        this.pdfPreviewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.pdfPreviewObjectUrl);
      } else {
        this.exportarXmlReporte(reporte, this.tipoReporteSeleccionado);
      }
    } catch (error) {
      console.error('Error generando reporte de ruta:', error);
    } finally {
      this.exportandoReporte = false;
    }
  }

  descargarPdfPreview() {
    if (!this.pdfPreviewObjectUrl || !this.reporteActual) {
      return;
    }

    const a = document.createElement('a');
    a.href = this.pdfPreviewObjectUrl;
    a.download = this.buildNombreArchivo(this.reporteActual.ruta, this.tipoReporteSeleccionado, 'pdf');
    a.click();
  }

  cerrarVistaPreviaPdf() {
    if (this.pdfPreviewObjectUrl) {
      URL.revokeObjectURL(this.pdfPreviewObjectUrl);
      this.pdfPreviewObjectUrl = null;
    }
    this.pdfPreviewUrl = null;
  }

  private async construirReporteResumenRuta(ruta: any): Promise<any> {
    const [deudas, asignaciones] = await Promise.all([
      this.rutService.getDeudaOfCuentasByIdrutas(ruta.idruta),
      firstValueFrom(this.usrxrutaService.findAll()),
    ]);

    const lectores = (asignaciones ?? [])
      .filter((item: any) => Array.isArray(item?.rutas) && item.rutas.some((r: any) => r?.idruta === ruta.idruta))
      .map((item: any) => ({
        lector: item?.idusuario_usuarios?.nomusu ?? 'Sin lector',
        idusuario: item?.idusuario_usuarios?.idusuario ?? '',
        emision: item?.idemision_emisiones?.emision ?? '',
      }));

    const detalleDeudas = (deudas ?? []).map((item: any, index: number) => ({
      numero: index + 1,
      nombre: item?.nombre ?? '',
      cedula: item?.cedula ?? '',
      cuenta: item?.cuenta ?? '',
      subtotal: Number(item?.subtotal ?? 0),
      interes: Number(item?.total_interes ?? 0),
      total: Number(item?.total_final ?? 0),
      facturas: Number(item?.total_facturas ?? 0),
    }));

    const totalDeuda = detalleDeudas.reduce((acc: number, item: any) => acc + item.total, 0);

    return {
      tipo: 'resumen',
      fechaGeneracion: new Date(),
      ruta: {
        idruta: ruta.idruta,
        codigo: ruta.codigo,
        descripcion: ruta.descripcion,
      },
      lectores,
      detalleDeudas,
      totalLectores: lectores.length,
      totalCuentas: detalleDeudas.length,
      totalDeuda,
    };
  }

  private async construirReporteLecturasRuta(ruta: any): Promise<any> {
    const rutasEmision: any[] = await firstValueFrom(this.rutasxemisionService.getLista1());
    const coincidencias = (rutasEmision ?? []).filter((item: any) => item?.idruta_rutas?.idruta === ruta.idruta);
    const detalles: any[] = [];

    for (const item of coincidencias) {
      const lecturas: any[] = await firstValueFrom(this.lecturasService.get_Lecturas(item.idrutaxemision));
      for (const lectura of lecturas ?? []) {
        detalles.push({
          numero: detalles.length + 1,
          emision: item?.idemision_emisiones?.emision ?? '',
          cuenta: lectura?.idabonado_abonados?.idabonado ?? '',
          abonado:
            lectura?.idabonado_abonados?.idcliente_clientes?.nombre ??
            lectura?.idabonado_abonados?.idresponsable?.nombre ??
            '',
          identificacion:
            lectura?.idabonado_abonados?.idcliente_clientes?.cedula ??
            lectura?.idabonado_abonados?.idresponsable?.cedula ??
            '',
          categoria: lectura?.idabonado_abonados?.idcategoria_categorias?.descripcion ?? '',
          lecturaAnterior: Number(lectura?.lecturaanterior ?? 0),
          lecturaActual: Number(lectura?.lecturaactual ?? 0),
          consumo: Number((lectura?.lecturaactual ?? 0) - (lectura?.lecturaanterior ?? 0)),
          total: Number(lectura?.total1 ?? 0),
          novedad: lectura?.idnovedad_novedades?.descripcion ?? '',
        });
      }
    }

    return {
      tipo: 'lecturas',
      fechaGeneracion: new Date(),
      ruta: {
        idruta: ruta.idruta,
        codigo: ruta.codigo,
        descripcion: ruta.descripcion,
      },
      totalLecturas: detalles.length,
      detalles,
    };
  }

  private buildPdfResumenRuta(reporte: any): Blob {
    const doc = new jsPDF('l', 'mm', 'a4');
    const fecha = reporte.fechaGeneracion.toLocaleString('es-EC');

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Resumen total de ruta', 14, 12);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Ruta: ${reporte.ruta.descripcion} (${reporte.ruta.codigo})`, 14, 19);
    doc.text(`Fecha: ${fecha}`, 14, 25);
    doc.text(`Lectores asignados: ${reporte.totalLectores}`, 14, 31);
    doc.text(`Cuentas con deuda: ${reporte.totalCuentas}`, 90, 31);
    doc.text(`Total deuda: ${reporte.totalDeuda.toFixed(2)}`, 165, 31);

    autoTable(doc, {
      startY: 36,
      theme: 'grid',
      head: [['Lector', 'Id usuario', 'Emision']],
      body: (reporte.lectores.length ? reporte.lectores : [{ lector: 'Sin asignaciones', idusuario: '', emision: '' }]).map((item: any) => [
        item.lector,
        item.idusuario,
        item.emision,
      ]),
      headStyles: { fillColor: [52, 73, 94] },
      styles: { fontSize: 8 },
    });

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 8,
      theme: 'grid',
      head: [['N°', 'Nombre', 'Identificacion', 'Cuenta', 'Subtotal', 'Interes', 'Total', 'Facturas']],
      body: reporte.detalleDeudas.map((item: any) => [
        item.numero,
        item.nombre,
        item.cedula,
        item.cuenta,
        item.subtotal.toFixed(2),
        item.interes.toFixed(2),
        item.total.toFixed(2),
        item.facturas,
      ]),
      headStyles: { fillColor: [41, 128, 185] },
      styles: { fontSize: 7.5 },
    });

    return doc.output('blob');
  }

  private buildPdfLecturasRuta(reporte: any): Blob {
    const doc = new jsPDF('l', 'mm', 'a4');
    const fecha = reporte.fechaGeneracion.toLocaleString('es-EC');

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Lecturas consolidadas por ruta', 14, 12);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Ruta: ${reporte.ruta.descripcion} (${reporte.ruta.codigo})`, 14, 19);
    doc.text(`Fecha: ${fecha}`, 14, 25);
    doc.text(`Total lecturas: ${reporte.totalLecturas}`, 14, 31);

    autoTable(doc, {
      startY: 36,
      theme: 'grid',
      head: [[
        'N°',
        'Emision',
        'Cuenta',
        'Abonado',
        'Identificacion',
        'Categoria',
        'Anterior',
        'Actual',
        'Consumo',
        'Total',
        'Novedad',
      ]],
      body: reporte.detalles.map((item: any) => [
        item.numero,
        item.emision,
        item.cuenta,
        item.abonado,
        item.identificacion,
        item.categoria,
        item.lecturaAnterior,
        item.lecturaActual,
        item.consumo,
        item.total.toFixed(2),
        item.novedad,
      ]),
      headStyles: { fillColor: [22, 160, 133] },
      styles: { fontSize: 7 },
      margin: { left: 6, right: 6 },
    });

    return doc.output('blob');
  }

  private exportarXmlReporte(reporte: any, tipo: 'resumen' | 'lecturas') {
    const contenido =
      tipo === 'resumen'
        ? this.buildXmlResumenRuta(reporte)
        : this.buildXmlLecturasRuta(reporte);

    const blob = new Blob([contenido], { type: 'application/xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = this.buildNombreArchivo(reporte.ruta, tipo, 'xml');
    a.click();
    URL.revokeObjectURL(url);
  }

  private buildXmlResumenRuta(reporte: any): string {
    const lectoresXml = reporte.lectores
      .map((item: any) => [
        '    <lector>',
        `      <nombre>${this.escapeXml(item.lector)}</nombre>`,
        `      <idusuario>${this.escapeXml(item.idusuario)}</idusuario>`,
        `      <emision>${this.escapeXml(item.emision)}</emision>`,
        '    </lector>',
      ].join('\n'))
      .join('\n');

    const deudasXml = reporte.detalleDeudas
      .map((item: any) => [
        '    <deuda>',
        `      <numero>${item.numero}</numero>`,
        `      <nombre>${this.escapeXml(item.nombre)}</nombre>`,
        `      <identificacion>${this.escapeXml(item.cedula)}</identificacion>`,
        `      <cuenta>${this.escapeXml(item.cuenta)}</cuenta>`,
        `      <subtotal>${item.subtotal.toFixed(2)}</subtotal>`,
        `      <interes>${item.interes.toFixed(2)}</interes>`,
        `      <total>${item.total.toFixed(2)}</total>`,
        `      <facturas>${item.facturas}</facturas>`,
        '    </deuda>',
      ].join('\n'))
      .join('\n');

    return [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<reporteResumenRuta>',
      `  <fechaGeneracion>${this.escapeXml(reporte.fechaGeneracion.toISOString())}</fechaGeneracion>`,
      '  <ruta>',
      `    <idruta>${this.escapeXml(reporte.ruta.idruta)}</idruta>`,
      `    <codigo>${this.escapeXml(reporte.ruta.codigo)}</codigo>`,
      `    <descripcion>${this.escapeXml(reporte.ruta.descripcion)}</descripcion>`,
      '  </ruta>',
      '  <resumen>',
      `    <totalLectores>${reporte.totalLectores}</totalLectores>`,
      `    <totalCuentas>${reporte.totalCuentas}</totalCuentas>`,
      `    <totalDeuda>${reporte.totalDeuda.toFixed(2)}</totalDeuda>`,
      '  </resumen>',
      '  <lectores>',
      lectoresXml,
      '  </lectores>',
      '  <deudas>',
      deudasXml,
      '  </deudas>',
      '</reporteResumenRuta>',
    ].join('\n');
  }

  private buildXmlLecturasRuta(reporte: any): string {
    const detallesXml = reporte.detalles
      .map((item: any) => [
        '    <lectura>',
        `      <numero>${item.numero}</numero>`,
        `      <emision>${this.escapeXml(item.emision)}</emision>`,
        `      <cuenta>${this.escapeXml(item.cuenta)}</cuenta>`,
        `      <abonado>${this.escapeXml(item.abonado)}</abonado>`,
        `      <identificacion>${this.escapeXml(item.identificacion)}</identificacion>`,
        `      <categoria>${this.escapeXml(item.categoria)}</categoria>`,
        `      <lecturaAnterior>${item.lecturaAnterior}</lecturaAnterior>`,
        `      <lecturaActual>${item.lecturaActual}</lecturaActual>`,
        `      <consumo>${item.consumo}</consumo>`,
        `      <total>${item.total.toFixed(2)}</total>`,
        `      <novedad>${this.escapeXml(item.novedad)}</novedad>`,
        '    </lectura>',
      ].join('\n'))
      .join('\n');

    return [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<reporteLecturasRuta>',
      `  <fechaGeneracion>${this.escapeXml(reporte.fechaGeneracion.toISOString())}</fechaGeneracion>`,
      '  <ruta>',
      `    <idruta>${this.escapeXml(reporte.ruta.idruta)}</idruta>`,
      `    <codigo>${this.escapeXml(reporte.ruta.codigo)}</codigo>`,
      `    <descripcion>${this.escapeXml(reporte.ruta.descripcion)}</descripcion>`,
      '  </ruta>',
      `  <totalLecturas>${reporte.totalLecturas}</totalLecturas>`,
      '  <detalles>',
      detallesXml,
      '  </detalles>',
      '</reporteLecturasRuta>',
    ].join('\n');
  }

  private buildNombreArchivo(ruta: any, tipo: 'resumen' | 'lecturas', extension: 'pdf' | 'xml'): string {
    const rutaNombre = (ruta?.descripcion ?? 'ruta').toString().replace(/\s+/g, '_');
    return `${tipo}_ruta_${rutaNombre}.${extension}`;
  }

  private escapeXml(value: any): string {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}
