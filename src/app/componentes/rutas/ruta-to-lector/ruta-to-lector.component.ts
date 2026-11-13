import { UsrxrutaServiceService } from './../../../servicios/usrxruta-service.service';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { UsuarioService } from 'src/app/servicios/administracion/usuario.service';
import { EmisionService } from 'src/app/servicios/emision.service';
import { RutasService } from 'src/app/servicios/rutas.service';
import { LecturasService } from 'src/app/servicios/lecturas.service';
import { RutasxemisionService } from 'src/app/servicios/rutasxemision.service';
import { LoadingService } from 'src/app/servicios/loading.service';
import Swal from 'sweetalert2';
import { firstValueFrom } from 'rxjs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as ExcelJS from 'exceljs';

@Component({
  selector: 'app-ruta-to-lector',
  templateUrl: './ruta-to-lector.component.html',
  styleUrls: ['./ruta-to-lector.component.css'],
})
export class RutaToLectorComponent implements OnInit {
  @ViewChild('btnCerrarModal', { static: false }) btnCerrarModal?: ElementRef<HTMLButtonElement>;
  @ViewChild('btnCerrarReporteModal', { static: false }) btnCerrarReporteModal?: ElementRef<HTMLButtonElement>;

  _usuarios: any[] = [];
  filtro: string = '';
  _rutas: any[] = [];
  rutasFiltradas: any[] = [];
  _emisiones: any[] = [];
  emisionSelected: any;
  usrxrutas: any;
  _rutasAsignadas: any[] = [];
  usuarioSeletced: any;
  usrxruta: any;
  swaddruta: boolean = false;
  filtrarRutas: string = '';
  cargandoRutas = false;
  ocupadas = new Set<number>();
  exportandoReporte = false;
  pdfPreviewUrl: SafeResourceUrl | null = null;
  private pdfPreviewObjectUrl: string | null = null;
  private filtroRutasTimer: ReturnType<typeof setTimeout> | null = null;
  rutaPreview: any = null;
  previewTitulo = 'Vista previa PDF';
  tipoReporteSeleccionado: 'general' | 'lecturas' = 'general';
  formatoReporteSeleccionado: 'pdf' | 'xlsx' = 'pdf';

  constructor(
    private usuarioService: UsuarioService,
    private emisionesService: EmisionService,
    private rutasService: RutasService,
    private usrxrutaService: UsrxrutaServiceService,
    private lecturasService: LecturasService,
    private rutasxemisionService: RutasxemisionService,
    private sanitizer: DomSanitizer,
    private loadingService: LoadingService
  ) { }

  ngOnInit(): void {
    this.getUsuarioLectores();
    this.getEmisiones();
  }

  getUsuarioLectores() {
    this.usuarioService.getByCargos([45, 25]).subscribe({
      next: (data: any) => {
        this.usuarioSeletced = data[0];
        this._usuarios = data;
      },
      error: (e: any) => console.error(e.error),
    });
  }

  onCellClick(event: any, usuario: any) {
    this.usuarioSeletced = usuario;
    this.cargarOcupadas();
    this.cerrarVistaPreviaPdf();

    if (!this.emisionSelected?.idemision) {
      this._rutasAsignadas = [];
      this.usrxrutas = null;
      return;
    }

    this.usrxrutaService.findByUsuarioAndEmision(
      usuario.idusuario,
      this.emisionSelected.idemision
    ).subscribe({
      next: (datos: any) => {
        if (!datos) {
          this.usrxrutas = null;
          this._rutasAsignadas = [];
          return;
        }
        this.usrxrutas = datos;
        this._rutasAsignadas = datos?.rutas ?? [];
      },
      error: (err: any) => {
        if (err?.status === 404) {
          this.usrxrutas = null;
          this._rutasAsignadas = [];
          return;
        }

        console.error('Error consultando rutas:', err);
        this.usrxrutas = null;
        this._rutasAsignadas = [];
      }
    });
  }

  getAllRutas() {
    this.cargandoRutas = true;
    this.rutasService.getRutasAsignacion(
      this.emisionSelected?.idemision,
      this.filtrarRutas,
      true,
      this.filtrarRutas?.trim() ? 300 : 200
    ).subscribe({
      next: (data: any) => {
        this._rutas = Array.isArray(data) ? data : [];
        this.rutasFiltradas = [...this._rutas];
        this.ocupadas = new Set(
          this._rutas
            .filter((ruta: any) => !!ruta?.ocupada)
            .map((ruta: any) => ruta.idruta)
        );
      },
      error: (e: any) => {
        console.error(e?.error ?? e);
        this._rutas = [];
        this.rutasFiltradas = [];
      },
      complete: () => {
        this.cargandoRutas = false;
      }
    });
  }

  getEmisiones() {
    this.emisionesService.findAllEmisionesBasic().subscribe({
      next: (data: any) => {
        this._emisiones = Array.isArray(data) ? data : [];

        if (!this._emisiones.length) {
          this.emisionSelected = null;
          this.swaddruta = false;
          this.ocupadas = new Set<number>();
          return;
        }

        this.emisionSelected = this._emisiones[0];
        this.swaddruta = this._emisiones[0]?.estado === 0;
        this.cargarOcupadas();
      },
      error: (e: any) => console.error(e?.error ?? e),
    });
  }

  onEmisionChange() {
    if (!this.emisionSelected) return;

    this.swaddruta = this.emisionSelected.estado === 0;
    this.cerrarVistaPreviaPdf();
    this.filtrarRutas = '';
    this.getAllRutas();

    if (this.usuarioSeletced) {
      this.onCellClick(null, this.usuarioSeletced);
    }
  }

  cargarOcupadas() {
    if (!this.emisionSelected?.idemision) {
      this.ocupadas = new Set<number>();
      return;
    }

    this.usrxrutaService.getRutasOcupadas(this.emisionSelected.idemision).subscribe({
      next: (ids: number[]) => this.ocupadas = new Set(ids),
      error: (e) => console.error(e)
    });
  }

  esOcupada(r: any): boolean {
    return this.ocupadas.has(r.idruta);
  }

  esOcupadaPorOtro(r: any): boolean {
    return this.esOcupada(r) && !this.isRutaAsignada(r);
  }

  esRutaCerrada(r: any): boolean {
    return r?.estado === 0 || r?.estado === false;
  }

  selectRuta(e: any, r: any) {
    if (this.esRutaCerrada(r)) {
      if (e?.target) e.target.checked = false;
      return;
    }

    if (!e.target.checked) {
      this.dropRuta(r);
      return;
    }

    const existe = this._rutasAsignadas.some(
      (ruta: any) => ruta.idruta === r.idruta
    );

    if (existe) return;

    this._rutasAsignadas = [...this._rutasAsignadas, r];
    this.ocupadas.add(r.idruta);
  }

  abrirModalRutas() {
    this.getAllRutas();
  }

  onFiltroRutasChange() {
    if (this.filtroRutasTimer) {
      clearTimeout(this.filtroRutasTimer);
    }
    this.filtroRutasTimer = setTimeout(() => this.getAllRutas(), 250);
  }

  dropRuta(r: any) {
    this._rutasAsignadas = this._rutasAsignadas.filter(
      (ruta: any) => ruta.idruta !== r.idruta
    );
    this.ocupadas.delete(r.idruta);
    if (this.rutaPreview?.idruta === r?.idruta) {
      this.cerrarVistaPreviaPdf();
    }
  }

  eliminarRutaAsignada(r: any) {
    if (!this.usuarioSeletced?.idusuario || !this.emisionSelected?.idemision) {
      this.swal('warning', 'Seleccione un lector y una emisiÃ³n');
      return;
    }

    const rutasPrevias = [...this._rutasAsignadas];
    const ocupadasPrevias = new Set(this.ocupadas);

    this.dropRuta(r);

    const payload = {
      rutas: this._rutasAsignadas,
      idusuario_usuarios: { idusuario: this.usuarioSeletced.idusuario },
      idemision_emisiones: { idemision: this.emisionSelected.idemision },
    };

    this.usrxrutaService.save(payload).subscribe({
      next: () => {
        this.swal('success', 'Ruta desvinculada correctamente');
        this.cargarOcupadas();
      },
      error: (e: any) => {
        this._rutasAsignadas = rutasPrevias;
        this.ocupadas = ocupadasPrevias;
        console.error(e.error);
        this.swal('error', 'No se pudo desvincular la ruta');
      },
    });
  }

  isRutaAsignada(r: any): boolean {
    if (this._rutasAsignadas && this._rutasAsignadas.length > 0) {
      return this._rutasAsignadas.some((ruta: any) => ruta.idruta === r.idruta);
    }
    return false;
  }

  trackByRuta(_: number, ruta: any): number {
    return ruta?.idruta;
  }

  trackByUsuario(_: number, usuario: any): number {
    return usuario?.idusuario;
  }

  onSubmit() {
    this.usrxruta = {
      rutas: this._rutasAsignadas,
      idusuario_usuarios: { idusuario: this.usuarioSeletced.idusuario },
      idemision_emisiones: { idemision: this.emisionSelected.idemision },
    };

    this.usrxrutaService.save(this.usrxruta).subscribe({
      next: () => {
        this.swal('success', 'Datos guardados');
        this.cargarOcupadas();
        this.btnCerrarModal?.nativeElement.click();
      },
      error: (e: any) => console.error(e.error),
    });
  }

  async exportarRutaAsignada(ruta: any, formato: 'pdf' | 'xlsx') {
    if (!this.usuarioSeletced?.idusuario || !this.emisionSelected?.idemision) {
      this.swal('warning', 'Seleccione un lector y una emisiÃ³n');
      return;
    }

    if (!ruta?.idruta) {
      this.swal('info', 'No hay ruta seleccionada para exportar');
      return;
    }

    this.exportandoReporte = true;
    this.loadingService.showLoading();

    try {
      const reporte = await this.construirReporteRutaAsignada(ruta);

      if (!reporte.detalles.length) {
        this.swal('info', 'No se encontraron lecturas para la ruta seleccionada');
        return;
      }

      if (formato === 'pdf') {
        this.abrirVistaPreviaPdf(reporte, 'Hoja de lectura por ruta asignada');
      } else {
        await this.generarExcelRutaAsignada(reporte);
      }
    } catch (error) {
      console.error('Error exportando ruta asignada:', error);
      this.swal('error', 'No se pudo generar el reporte');
    } finally {
      this.exportandoReporte = false;
      this.loadingService.hideLoading();
    }
  }

  private async construirReporteRutaAsignada(ruta: any): Promise<any> {
    const rutaEmision: any = await firstValueFrom(
      this.rutasxemisionService.getByEmisionRuta(
        this.emisionSelected.idemision,
        ruta.idruta
      )
    );

    const detalles: any[] = [];

    if (rutaEmision?.idrutaxemision) {
      const lecturas: any[] = await firstValueFrom(
        this.lecturasService.get_Lecturas(rutaEmision.idrutaxemision)
      );

      for (const lectura of lecturas ?? []) {
        detalles.push({
          numero: detalles.length + 1,
          idabonado: lectura?.idabonado_abonados?.idabonado ?? '',
          responsablePago:
            lectura?.idabonado_abonados?.idresponsable?.nombre ??
            lectura?.idabonado_abonados?.idcliente_clientes?.nombre ??
            '',
          identificacion:
            lectura?.idabonado_abonados?.idresponsable?.cedula ??
            lectura?.idabonado_abonados?.idcliente_clientes?.cedula ??
            '',
          categoria:
            lectura?.idabonado_abonados?.idcategoria_categorias?.descripcion ?? '',
          lecturaAnterior: lectura?.lecturaanterior ?? '',
          lecturaActual: '',
          observacion: lectura?.observaciones ?? lectura?.observacion ?? ''
        });
      }
    }

    return {
      lector: this.usuarioSeletced?.nomusu ?? 'Sin lector',
      idusuario: this.usuarioSeletced?.idusuario ?? '',
      emision: this.emisionSelected?.emision ?? '',
      fechaGeneracion: new Date(),
      ruta: {
        idruta: ruta?.idruta ?? '',
        codigo: rutaEmision?.idruta_rutas?.codigo ?? ruta?.codigo ?? '',
        descripcion: rutaEmision?.idruta_rutas?.descripcion ?? ruta?.descripcion ?? ''
      },
      detalles
    };
  }

  private abrirVistaPreviaPdf(reporte: any, titulo: string) {
    this.limpiarVistaPreviaPdf();
    this.pdfPreviewObjectUrl = URL.createObjectURL(this.buildPdfRutaAsignada(reporte));
    this.pdfPreviewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.pdfPreviewObjectUrl);
    this.rutaPreview = reporte.ruta;
    this.previewTitulo = titulo;
  }

  private buildPdfRutaAsignada(reporte: any): Blob {
    const doc = new jsPDF('l', 'mm', 'a4');
    const fecha = reporte.fechaGeneracion.toLocaleDateString('es-EC');
    const hora = reporte.fechaGeneracion.toLocaleTimeString('es-EC');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('Hoja de lectura por ruta asignada', 14, 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Lector: ${reporte.lector}`, 14, 19);
    doc.text(`EmisiÃ³n: ${reporte.emision}`, 14, 25);
    doc.text(`Fecha: ${fecha} ${hora}`, 14, 31);
    doc.text(`Ruta: ${reporte.ruta?.descripcion ?? ''}`, 14, 37);
    doc.text(`CÃ³digo ruta: ${reporte.ruta?.codigo ?? ''}`, 120, 37);

    autoTable(doc, {
      startY: 42,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 1.5, valign: 'middle' },
      headStyles: { fillColor: [52, 73, 94] },
      margin: { left: 8, right: 8 },
      head: [[
        'NÂ°',
        'Id abonado',
        'Responsable de pago',
        'IdentificaciÃ³n',
        'CategorÃ­a',
        'Lectura anterior',
        'Lectura actual',
        'ObservaciÃ³n'
      ]],
      body: reporte.detalles.map((item: any) => [
        item.numero,
        item.idabonado,
        item.responsablePago,
        item.identificacion,
        item.categoria,
        item.nromedidor,
        item.promedio,
        item.geolocalizacion,
        item.fechalectura ? new Date(item.fechalectura).toLocaleDateString('es-EC') : '',
        item.idnovedad,
        item.novedad,
        item.lecturaAnterior,
        item.lecturaActual,
        item.observacion
      ]),
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 5) {
          data.cell.styles.minCellHeight = 10;
        }
      }
    });

    return doc.output('blob');
  }

  private async generarExcelRutaAsignada(reporte: any) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Ruta asignada');

    worksheet.addRow(['Hoja de lectura por ruta asignada']);
    worksheet.addRow(['Lector', reporte.lector]);
    worksheet.addRow(['Id usuario', reporte.idusuario]);
    worksheet.addRow(['Emision', reporte.emision]);
    worksheet.addRow(['Fecha', reporte.fechaGeneracion.toLocaleString('es-EC')]);
    worksheet.addRow(['Ruta', reporte.ruta?.descripcion ?? '']);
    worksheet.addRow(['Codigo ruta', reporte.ruta?.codigo ?? '']);
    worksheet.addRow([]);

    const headerRow = worksheet.addRow([
      'NÂ°',
      'Id abonado',
      'Responsable de pago',
      'Identificacion',
      'Categoria',
      'Nro medidor',
      'Promedio',
      'Geolocalizacion',
      'Fecha lectura',
      'Id novedad',
      'Novedad',
      'Lectura anterior',
      'Lectura actual',
      'Observacion'
    ]);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF34495E' } };

    reporte.detalles.forEach((item: any) => {
      worksheet.addRow([
        item.numero,
        item.idabonado,
        item.responsablePago,
        item.identificacion,
        item.categoria,
        item.lecturaAnterior,
        item.lecturaActual,
        item.observacion
      ]);
    });

    this.configurarAnchos(worksheet, [10, 14, 34, 18, 18, 16, 16, 32]);
    await this.descargarWorkbook(workbook, this.buildNombreArchivo(reporte.ruta, 'xlsx'));
    this.swal('success', 'Excel generado correctamente');
  }

  descargarPdfPreview() {
    if (!this.pdfPreviewObjectUrl || !this.rutaPreview) {
      return;
    }

    const a = document.createElement('a');
    a.href = this.pdfPreviewObjectUrl;
    a.download = this.buildNombreArchivo(this.rutaPreview, 'pdf');
    a.click();
  }

  cerrarVistaPreviaPdf() {
    this.limpiarVistaPreviaPdf();
  }

  private limpiarVistaPreviaPdf() {
    if (this.pdfPreviewObjectUrl) {
      URL.revokeObjectURL(this.pdfPreviewObjectUrl);
      this.pdfPreviewObjectUrl = null;
      this.pdfPreviewUrl = null;
    }
    this.rutaPreview = null;
    this.previewTitulo = 'Vista previa PDF';
  }

  async exportarReporteGeneral(formato: 'pdf' | 'xlsx') {
    if (!this.emisionSelected?.idemision) {
      this.swal('warning', 'Seleccione una emisiÃ³n');
      return;
    }

    this.exportandoReporte = true;
    this.loadingService.showLoading();

    try {
      const reporte = await this.construirReporteGeneralAsignaciones();

      if (!reporte.detalles.length) {
        this.swal('info', 'No hay rutas asignadas para la emisiÃ³n seleccionada');
        return;
      }

      if (formato === 'pdf') {
        this.limpiarVistaPreviaPdf();
        this.pdfPreviewObjectUrl = URL.createObjectURL(this.buildPdfReporteGeneral(reporte));
        this.pdfPreviewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.pdfPreviewObjectUrl);
        this.rutaPreview = null;
        this.previewTitulo = 'Reporte general de rutas de la emisión';
      } else {
        await this.generarExcelReporteGeneral(reporte);
      }
    } catch (error) {
      console.error('Error exportando reporte general:', error);
      this.swal('error', 'No se pudo generar el reporte general');
    } finally {
      this.exportandoReporte = false;
      this.loadingService.hideLoading();
    }
  }

  async exportarLecturasGenerales(formato: 'pdf' | 'xlsx') {
    if (!this.emisionSelected?.idemision) {
      this.swal('warning', 'Seleccione una emisiÃ³n');
      return;
    }

    this.exportandoReporte = true;
    this.loadingService.showLoading();

    try {
      const reporte = await this.construirReporteLecturasGenerales();

      if (!reporte.detalles.length) {
        this.swal('info', 'No se encontraron lecturas para la emisiÃ³n seleccionada');
        return;
      }

      if (formato === 'pdf') {
        this.limpiarVistaPreviaPdf();
        this.pdfPreviewObjectUrl = URL.createObjectURL(this.buildPdfLecturasGenerales(reporte));
        this.pdfPreviewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.pdfPreviewObjectUrl);
        this.rutaPreview = null;
        this.previewTitulo = 'Reporte general de lecturas';
      } else {
        await this.generarExcelLecturasGenerales(reporte);
      }
    } catch (error) {
      console.error('Error exportando lecturas generales:', error);
      this.swal('error', 'No se pudo generar el reporte de lecturas');
    } finally {
      this.exportandoReporte = false;
      this.loadingService.hideLoading();
    }
  }

  // Combina el catalogo de la emision con las asignaciones; no depende del lector seleccionado.
  private async cargarRutasReporte(idemision: number): Promise<any[]> {
    const [asignaciones, rutasEmision] = await Promise.all([
      firstValueFrom(this.usrxrutaService.findByEmision(idemision)) as Promise<any[]>,
      firstValueFrom(this.rutasxemisionService.getByIdEmision(idemision))
    ]);
    const rutas = new Map<number, any>();
    for (const item of rutasEmision ?? []) {
      const ruta = item?.idruta_rutas;
      if (ruta?.idruta != null) rutas.set(Number(ruta.idruta), { ...ruta, lectores: new Map<number, any>() });
    }
    for (const asignacion of asignaciones ?? []) {
      const usuario = asignacion?.idusuario_usuarios;
      const idusuario = usuario?.idusuario ?? asignacion?.idusuario;
      for (const ruta of asignacion?.rutas ?? []) {
        if (ruta?.idruta == null) continue;
        const id = Number(ruta.idruta);
        if (!rutas.has(id)) rutas.set(id, { ...ruta, lectores: new Map<number, any>() });
        if (idusuario != null) rutas.get(id).lectores.set(Number(idusuario), {
          idusuario, lector: usuario?.nomusu ?? asignacion?.nomusu ?? 'Sin nombre'
        });
      }
    }
    return Array.from(rutas.values()).map(ruta => ({
      ...ruta, lectores: Array.from(ruta.lectores.values())
        .sort((a: any, b: any) => Number(a.idusuario) - Number(b.idusuario))
    })).sort((a, b) => String(a.codigo ?? a.idruta).localeCompare(String(b.codigo ?? b.idruta), 'es', { numeric: true }));
  }

  private async construirReporteGeneralAsignaciones(): Promise<any> {
    const emision = { ...this.emisionSelected };
    const rutas = await this.cargarRutasReporte(emision.idemision);
    const grupos = new Map<string, any>();
    for (const ruta of rutas) {
      const clave = ruta.lectores.map((lector: any) => lector.idusuario).join(',');
      if (!grupos.has(clave)) grupos.set(clave, {
        numero: grupos.size + 1,
        idusuario: ruta.lectores.map((lector: any) => lector.idusuario).join(', '),
        lector: ruta.lectores.map((lector: any) => lector.lector).join(' / ') || 'Sin lector asignado',
        totalRutas: 0, rutas: []
      });
      const grupo = grupos.get(clave);
      grupo.rutas.push(ruta);
      grupo.totalRutas++;
    }
    return { emision: emision.emision ?? '', fechaGeneracion: new Date(), totalRutas: rutas.length,
      detalles: Array.from(grupos.values()) };
  }

  private async construirReporteLecturasGenerales(): Promise<any> {
    const emision = { ...this.emisionSelected };
    const [rutas, lecturas] = await Promise.all([
      this.cargarRutasReporte(emision.idemision),
      firstValueFrom(this.lecturasService.getByIdEmision(emision.idemision))
    ]);
    const porRuta = new Map<number, any>(rutas.map(ruta => [Number(ruta.idruta), ruta]));
    const detalles = (lecturas ?? []).map((lectura: any) => {
      const abonado = lectura?.idabonado_abonados ?? {};
      const ruta = lectura?.idrutaxemision_rutasxemision?.idruta_rutas ?? abonado?.idruta_rutas ?? {};
      const lectores = porRuta.get(Number(ruta.idruta))?.lectores ?? [];
      const novedad = lectura?.idnovedad_novedades ?? {};
      const lecturaAnterior = Number(lectura?.lecturaanterior ?? 0);
      const lecturaActual = Number(lectura?.lecturaactual ?? 0);
      const fechaHora = this.parseFechaLectura(lectura?.fechalectura, lectura?.readingCapturedAt);
      return {
        numero: 0,
        lector: lectores.map((lector: any) => lector.lector).join(' / ') || 'Sin lector asignado',
        idusuario: lectores.map((lector: any) => lector.idusuario).join(', '),
        rutaCodigo: ruta.codigo ?? '', rutaDescripcion: ruta.descripcion ?? 'Sin ruta registrada',
        cuenta: abonado?.idabonado ?? '', nromedidor: abonado?.nromedidor ?? '',
        abonado: abonado?.idresponsable?.nombre ?? abonado?.idcliente_clientes?.nombre ?? '',
        direccion: abonado?.direccionubicacion ?? abonado?.idcliente_clientes?.direccion ?? '',
        categoria: abonado?.idcategoria_categorias?.descripcion ?? '',
        promedio: lectura?.promedio ?? abonado?.promedio ?? '',
        geolocalizacion: abonado?.geolocalizacion ?? '',
        fecha: fechaHora.fecha, hora: fechaHora.hora,
        foto: String(lectura?.fotoPath ?? '').trim() ? 'Sí' : 'No',
        idnovedad: novedad?.idnovedad ?? '', novedad: novedad?.descripcion ?? '',
        lecturaAnterior, lecturaActual, consumo: lecturaActual - lecturaAnterior,
        observacion: lectura?.observaciones ?? lectura?.observacion ?? '',
        confirmacion: this.getConfirmacionLectura(lectura)
      };
    }).sort((a: any, b: any) => String(a.rutaCodigo).localeCompare(String(b.rutaCodigo), 'es', { numeric: true })
      || Number(a.cuenta) - Number(b.cuenta));
    detalles.forEach((detalle, index) => detalle.numero = index + 1);
    return { emision: emision.emision ?? '', fechaGeneracion: new Date(), detalles };
  }

  private buildPdfReporteGeneral(reporte: any): Blob {
    const doc = new jsPDF('p', 'mm', 'a4');
    const fecha = reporte.fechaGeneracion.toLocaleDateString('es-EC');
    const hora = reporte.fechaGeneracion.toLocaleTimeString('es-EC');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('Reporte general de rutas de la emisión', 14, 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`EmisiÃ³n: ${reporte.emision}`, 14, 19);
    doc.text(`Fecha: ${fecha} ${hora}`, 14, 25);

    autoTable(doc, {
      startY: 32,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 1.5, valign: 'middle' },
      headStyles: { fillColor: [52, 73, 94] },
      margin: { left: 8, right: 8 },
      head: [[
        'NÂ°',
        'Cod. lector',
        'Lector',
        'Total rutas',
        'Rutas asignadas'
      ]],
      body: reporte.detalles.map((item: any) => [
        item.numero,
        item.idusuario,
        item.lector,
        item.totalRutas,
        item.rutas.map((ruta: any) => `${ruta.codigo || ruta.idruta} - ${ruta.descripcion}`).join('\n')
      ])
    });

    return doc.output('blob');
  }

  private buildPdfLecturasGenerales(reporte: any): Blob {
    const doc = new jsPDF('l', 'mm', 'a3');
    const fecha = reporte.fechaGeneracion.toLocaleDateString('es-EC');
    const hora = reporte.fechaGeneracion.toLocaleTimeString('es-EC');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('Reporte global de lecturas', 14, 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Emision: ${reporte.emision}`, 14, 19);
    doc.text(`Fecha: ${fecha} ${hora}`, 14, 25);

    autoTable(doc, {
      startY: 32,
      theme: 'grid',
      tableWidth: 396,
      styles: { fontSize: 7, cellPadding: 1, valign: 'middle' },
      headStyles: { fillColor: [52, 73, 94] },
      margin: { left: 6, right: 6 },
      head: [[
        'Cod. ruta',
        'Ruta',
        'Cuenta',
        'Nro. Medidor',
        'Abonado',
        'Direccion',
        'Categoria',
        'Lectura anterior',
        'Lectura actual',
        'Consumo',
        'Promedio',
        'Id novedad',
        'Novedad',
        'Observaciones',
        'Geolocalizacion',
        'Confirmacion',
        'Lector',
        'Fecha',
        'Foto',
        'Hora de toma'
      ]],
      body: reporte.detalles.map((item: any) => [
        item.rutaCodigo,
        item.rutaDescripcion,
        item.cuenta,
        item.nromedidor,
        item.abonado,
        item.direccion,
        item.categoria,
        item.lecturaAnterior,
        this.getLecturaActualPdf(item.lecturaActual),
        item.consumo,
        item.promedio,
        item.idnovedad,
        item.novedad,
        item.observacion,
        item.geolocalizacion,
        item.confirmacion,
        item.lector,
        item.fecha,
        item.foto,
        item.hora
      ]),
      columnStyles: {
        0: { cellWidth: 18 },
        1: { cellWidth: 26 },
        2: { cellWidth: 15 },
        3: { cellWidth: 18 },
        4: { cellWidth: 32 },
        5: { cellWidth: 32 },
        6: { cellWidth: 20 },
        7: { cellWidth: 17 },
        8: { cellWidth: 17 },
        9: { cellWidth: 14 },
        10: { cellWidth: 14 },
        11: { cellWidth: 12 },
        12: { cellWidth: 22 },
        13: { cellWidth: 28 },
        14: { cellWidth: 24 },
        15: { cellWidth: 14 },
        16: { cellWidth: 22 },
        17: { cellWidth: 20 },
        18: { cellWidth: 13 },
        19: { cellWidth: 18 }
      }
    });

    return doc.output('blob');
  }

  private getLecturaActualPdf(lecturaActual: any): string | number {
    const valor = Number(lecturaActual ?? 0);
    return valor > 0 ? valor : '';
  }

  private async generarExcelReporteGeneral(reporte: any) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Rutas asignadas');

    worksheet.addRow(['Reporte general de rutas de la emisión']);
    worksheet.addRow(['Emision', reporte.emision]);
    worksheet.addRow(['Fecha', reporte.fechaGeneracion.toLocaleString('es-EC')]);
    worksheet.addRow([]);

    const headerRow = worksheet.addRow([
      'NÂ°',
      'Cod. lector',
      'Lector',
      'Total rutas',
      'Rutas asignadas'
    ]);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF34495E' } };

    reporte.detalles.forEach((item: any) => {
      worksheet.addRow([
        item.numero,
        item.idusuario,
        item.lector,
        item.totalRutas,
        item.rutas.map((ruta: any) => `${ruta.codigo || ruta.idruta} - ${ruta.descripcion}`).join(', ')
      ]);
    });

    this.configurarAnchos(worksheet, [10, 14, 26, 14, 60]);
    await this.descargarWorkbook(workbook, `reporte_general_rutas_${reporte.emision || 'emision'}.xlsx`);
    this.swal('success', 'Excel general generado correctamente');
  }

  private async generarExcelLecturasGenerales(reporte: any) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Lecturas');

    worksheet.addRow(['Reporte global de lecturas']);
    worksheet.addRow(['Emision', reporte.emision]);
    worksheet.addRow(['Fecha', reporte.fechaGeneracion.toLocaleString('es-EC')]);
    worksheet.addRow([]);

    const headerRow = worksheet.addRow([
      'Cod. ruta',
      'Ruta',
      'Cuenta',
      'Nro. Medidor',
      'Abonado',
      'Direccion',
      'Categoria',
      'Lectura anterior',
      'Lectura actual',
      'Consumo',
      'Promedio',
      'Id novedad',
      'Novedad',
      'Observaciones',
      'Geolocalizacion',
      'Confirmacion',
      'Lector',
      'Fecha',
      'Foto',
      'Hora de toma'
    ]);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF34495E' } };

    reporte.detalles.forEach((item: any) => {
      worksheet.addRow([
        item.rutaCodigo,
        item.rutaDescripcion,
        item.cuenta,
        item.nromedidor,
        item.abonado,
        item.direccion,
        item.categoria,
        item.lecturaAnterior,
        item.lecturaActual,
        item.consumo,
        item.promedio,
        item.idnovedad,
        item.novedad,
        item.observacion,
        item.geolocalizacion,
        item.confirmacion,
        item.lector,
        item.fecha,
        item.foto,
        item.hora
      ]);
    });

    this.configurarAnchos(worksheet, [16, 30, 12, 16, 34, 34, 18, 16, 16, 12, 12, 14, 20, 26, 24, 16, 24, 16, 10, 18]);
    await this.descargarWorkbook(workbook, `reporte_global_lecturas_${reporte.emision || 'emision'}.xlsx`);
    this.swal('success', 'Excel de lecturas generado correctamente');
  }

  private parseFechaLectura(fechaLectura: any, captura?: any): { fecha: string; hora: string } {
    const capturada = captura ? new Date(captura) : null;
    const tieneCaptura = capturada != null && !Number.isNaN(capturada.getTime());
    const fecha = tieneCaptura ? capturada! : fechaLectura ? new Date(fechaLectura) : null;
    if (!fecha || Number.isNaN(fecha.getTime())) return { fecha: '', hora: 'Sin registro' };
    const zona = 'America/Guayaquil';
    const hora = fecha.toLocaleTimeString('es-EC', {
      timeZone: zona, hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23'
    });
    // Las fechas historicas a medianoche no conservan la hora de toma.
    const soloFecha = typeof fechaLectura === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(fechaLectura);
    return {
      fecha: soloFecha && !tieneCaptura
        ? fechaLectura.split('-').reverse().join('/')
        : fecha.toLocaleDateString('es-EC', { timeZone: zona }),
      hora: tieneCaptura || (!soloFecha && hora !== '00:00:00') ? hora : 'Sin registro'
    };
  }

  private getConfirmacionLectura(lectura: any): string {
    const valor = lectura?.confirmacion
      ?? lectura?.confirmado
      ?? lectura?.procesado
      ?? lectura?.confirmada
      ?? lectura?.swconfirmacion;

    if (typeof valor === 'boolean') {
      return valor ? 'SI' : 'NO';
    }

    if (valor === 1 || valor === '1') return 'SI';
    if (valor === 0 || valor === '0') return 'NO';
    if (valor == null || valor === '') return '';
    return String(valor);
  }

  private buildNombreArchivo(ruta: any, extension: 'pdf' | 'xlsx'): string {
    const lector = (this.usuarioSeletced?.nomusu ?? 'lector').replace(/\s+/g, '_');
    const emision = (this.emisionSelected?.emision ?? 'emision').toString().replace(/\s+/g, '_');
    const rutaNombre = (ruta?.descripcion ?? 'ruta').toString().replace(/\s+/g, '_');
    return `ruta_asignada_${rutaNombre}_${lector}_${emision}.${extension}`;
  }

  private configurarAnchos(worksheet: ExcelJS.Worksheet, widths: number[]) {
    widths.forEach((width, index) => {
      worksheet.getColumn(index + 1).width = width;
    });
  }

  private async descargarWorkbook(workbook: ExcelJS.Workbook, filename: string) {
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  private swal(icon: 'success' | 'error' | 'info' | 'warning', mensaje: string) {
    Swal.fire({
      toast: true,
      icon,
      title: mensaje,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
    });
  }

  abrirModalReporte() {
    this.tipoReporteSeleccionado = 'general';
    this.formatoReporteSeleccionado = 'pdf';
  }

  async ejecutarReporteSeleccionado() {
    this.btnCerrarReporteModal?.nativeElement.click();

    if (this.tipoReporteSeleccionado === 'general') {
      await this.exportarReporteGeneral(this.formatoReporteSeleccionado);
      return;
    }

    await this.exportarLecturasGenerales(this.formatoReporteSeleccionado);
  }
}
