import { UsrxrutaServiceService } from './../../../servicios/usrxruta-service.service';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { UsuarioService } from 'src/app/servicios/administracion/usuario.service';
import { EmisionService } from 'src/app/servicios/emision.service';
import { RutasService } from 'src/app/servicios/rutas.service';
import { LecturasService } from 'src/app/servicios/lecturas.service';
import { RutasxemisionService } from 'src/app/servicios/rutasxemision.service';
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

  constructor(
    private usuarioService: UsuarioService,
    private emisionesService: EmisionService,
    private rutasService: RutasService,
    private usrxrutaService: UsrxrutaServiceService,
    private lecturasService: LecturasService,
    private rutasxemisionService: RutasxemisionService,
    private sanitizer: DomSanitizer
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
      this.swal('warning', 'Seleccione un lector y una emisión');
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
      this.swal('warning', 'Seleccione un lector y una emisión');
      return;
    }

    if (!ruta?.idruta) {
      this.swal('info', 'No hay ruta seleccionada para exportar');
      return;
    }

    this.exportandoReporte = true;

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
    doc.text(`Emisión: ${reporte.emision}`, 14, 25);
    doc.text(`Fecha: ${fecha} ${hora}`, 14, 31);
    doc.text(`Ruta: ${reporte.ruta?.descripcion ?? ''}`, 14, 37);
    doc.text(`Código ruta: ${reporte.ruta?.codigo ?? ''}`, 120, 37);

    autoTable(doc, {
      startY: 42,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 1.5, valign: 'middle' },
      headStyles: { fillColor: [52, 73, 94] },
      margin: { left: 8, right: 8 },
      head: [[
        'N°',
        'Id abonado',
        'Responsable de pago',
        'Identificación',
        'Categoría',
        'Lectura anterior',
        'Lectura actual',
        'Observación'
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
      'N°',
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
      this.swal('warning', 'Seleccione una emisión');
      return;
    }

    this.exportandoReporte = true;

    try {
      const reporte = await this.construirReporteGeneralAsignaciones();

      if (!reporte.detalles.length) {
        this.swal('info', 'No hay rutas asignadas para la emisión seleccionada');
        return;
      }

      if (formato === 'pdf') {
        this.limpiarVistaPreviaPdf();
        this.pdfPreviewObjectUrl = URL.createObjectURL(this.buildPdfReporteGeneral(reporte));
        this.pdfPreviewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.pdfPreviewObjectUrl);
        this.rutaPreview = null;
        this.previewTitulo = 'Reporte general de rutas asignadas';
      } else {
        await this.generarExcelReporteGeneral(reporte);
      }
    } catch (error) {
      console.error('Error exportando reporte general:', error);
      this.swal('error', 'No se pudo generar el reporte general');
    } finally {
      this.exportandoReporte = false;
    }
  }

  async exportarLecturasGenerales(formato: 'pdf' | 'xlsx') {
    if (!this.emisionSelected?.idemision) {
      this.swal('warning', 'Seleccione una emisión');
      return;
    }

    this.exportandoReporte = true;

    try {
      const reporte = await this.construirReporteLecturasGenerales();

      if (!reporte.detalles.length) {
        this.swal('info', 'No se encontraron lecturas para la emisión seleccionada');
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
    }
  }

  private async construirReporteGeneralAsignaciones(): Promise<any> {
    const asignaciones: any[] = await firstValueFrom(
      this.usrxrutaService.findByEmision(this.emisionSelected.idemision)
    ) as any[];

    const detalles = (asignaciones ?? []).map((item: any, index: number) => ({
      numero: index + 1,
      idusuario: item?.idusuario_usuarios?.idusuario ?? item?.idusuario ?? '',
      lector: item?.idusuario_usuarios?.nomusu ?? item?.nomusu ?? '',
      totalRutas: (item?.rutas ?? []).length,
      rutas: (item?.rutas ?? []).map((ruta: any) => ({
        idruta: ruta?.idruta ?? '',
        codigo: ruta?.codigo ?? '',
        descripcion: ruta?.descripcion ?? ''
      }))
    }));

    return {
      emision: this.emisionSelected?.emision ?? '',
      fechaGeneracion: new Date(),
      detalles
    };
  }

  private async construirReporteLecturasGenerales(): Promise<any> {
    const asignaciones: any[] = await firstValueFrom(
      this.usrxrutaService.findByEmision(this.emisionSelected.idemision)
    ) as any[];

    const detalles: any[] = [];

    for (const asignacion of asignaciones ?? []) {
      const lector = asignacion?.idusuario_usuarios?.nomusu ?? asignacion?.nomusu ?? 'Sin lector';
      const idusuario = asignacion?.idusuario_usuarios?.idusuario ?? asignacion?.idusuario ?? '';

      for (const ruta of asignacion?.rutas ?? []) {
        const rutaEmision: any = await firstValueFrom(
          this.rutasxemisionService.getByEmisionRuta(this.emisionSelected.idemision, ruta.idruta)
        );

        if (!rutaEmision?.idrutaxemision) {
          continue;
        }

        const lecturas: any[] = await firstValueFrom(
          this.lecturasService.get_Lecturas(rutaEmision.idrutaxemision)
        );

        for (const lectura of lecturas ?? []) {
          const abonado = lectura?.idabonado_abonados ?? {};
          const novedad = lectura?.idnovedad_novedades ?? {};
          detalles.push({
            numero: detalles.length + 1,
            lector,
            idusuario,
            rutaCodigo: rutaEmision?.idruta_rutas?.codigo ?? ruta?.codigo ?? '',
            rutaDescripcion: rutaEmision?.idruta_rutas?.descripcion ?? ruta?.descripcion ?? '',
            idabonado: abonado?.idabonado ?? '',
            responsablePago:
              abonado?.idresponsable?.nombre ??
              abonado?.idcliente_clientes?.nombre ??
              '',
            identificacion:
              abonado?.idresponsable?.cedula ??
              abonado?.idcliente_clientes?.cedula ??
              '',
            categoria: abonado?.idcategoria_categorias?.descripcion ?? '',
            nromedidor: abonado?.nromedidor ?? '',
            promedio: abonado?.promedio ?? '',
            geolocalizacion: abonado?.geolocalizacion ?? '',
            fechalectura: lectura?.fechalectura ?? '',
            idnovedad: novedad?.idnovedad ?? '',
            novedad: novedad?.descripcion ?? '',
            lecturaAnterior: lectura?.lecturaanterior ?? '',
            lecturaActual: lectura?.lecturaactual ?? '',
            observacion: lectura?.observaciones ?? lectura?.observacion ?? ''
          });
        }
      }
    }

    return {
      emision: this.emisionSelected?.emision ?? '',
      fechaGeneracion: new Date(),
      detalles
    };
  }

  private buildPdfReporteGeneral(reporte: any): Blob {
    const doc = new jsPDF('p', 'mm', 'a4');
    const fecha = reporte.fechaGeneracion.toLocaleDateString('es-EC');
    const hora = reporte.fechaGeneracion.toLocaleTimeString('es-EC');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('Reporte general de rutas asignadas', 14, 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Emisión: ${reporte.emision}`, 14, 19);
    doc.text(`Fecha: ${fecha} ${hora}`, 14, 25);

    autoTable(doc, {
      startY: 32,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 1.5, valign: 'middle' },
      headStyles: { fillColor: [52, 73, 94] },
      margin: { left: 8, right: 8 },
      head: [[
        'N°',
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
    const doc = new jsPDF('l', 'mm', 'a4');
    const fecha = reporte.fechaGeneracion.toLocaleDateString('es-EC');
    const hora = reporte.fechaGeneracion.toLocaleTimeString('es-EC');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('Reporte general de lecturas', 14, 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Emisión: ${reporte.emision}`, 14, 19);
    doc.text(`Fecha: ${fecha} ${hora}`, 14, 25);

    autoTable(doc, {
      startY: 32,
      theme: 'grid',
      styles: { fontSize: 7, cellPadding: 1.2, valign: 'middle' },
      headStyles: { fillColor: [52, 73, 94] },
      margin: { left: 6, right: 6 },
      head: [[
        'N°',
        'Lector',
        'Ruta',
        'Id abonado',
        'Responsable',
        'Identificación',
        'Categoría',
        'Medidor',
        'Prom.',
        'Fecha lec.',
        'Id nov.',
        'Novedad',
        'Lect. ant.',
        'Lect. act.',
        'Observación'
      ]],
      body: reporte.detalles.map((item: any) => [
        item.numero,
        item.lector,
        `${item.rutaCodigo} - ${item.rutaDescripcion}`,
        item.idabonado,
        item.responsablePago,
        item.identificacion,
        item.categoria,
        item.nromedidor,
        item.promedio,
        item.fechalectura ? new Date(item.fechalectura).toLocaleDateString('es-EC') : '',
        item.idnovedad,
        item.novedad,
        item.lecturaAnterior,
        this.getLecturaActualPdf(item.lecturaActual),
        item.observacion
      ])
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

    worksheet.addRow(['Reporte general de rutas asignadas']);
    worksheet.addRow(['Emision', reporte.emision]);
    worksheet.addRow(['Fecha', reporte.fechaGeneracion.toLocaleString('es-EC')]);
    worksheet.addRow([]);

    const headerRow = worksheet.addRow([
      'N°',
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
    await this.descargarWorkbook(workbook, `reporte_general_rutas_${this.emisionSelected?.emision ?? 'emision'}.xlsx`);
    this.swal('success', 'Excel general generado correctamente');
  }

  private async generarExcelLecturasGenerales(reporte: any) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Lecturas');

    worksheet.addRow(['Reporte general de lecturas']);
    worksheet.addRow(['Emision', reporte.emision]);
    worksheet.addRow(['Fecha', reporte.fechaGeneracion.toLocaleString('es-EC')]);
    worksheet.addRow([]);

    const headerRow = worksheet.addRow([
      'N°',
      'Lector',
      'Id usuario',
      'Codigo ruta',
      'Ruta',
      'Id abonado',
      'Responsable',
      'Identificacion',
      'Categoria',
      'Lectura anterior',
      'Lectura actual',
      'Observacion'
    ]);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF34495E' } };

    reporte.detalles.forEach((item: any) => {
      worksheet.addRow([
        item.numero,
        item.lector,
        item.idusuario,
        item.rutaCodigo,
        item.rutaDescripcion,
        item.idabonado,
        item.responsablePago,
        item.identificacion,
        item.categoria,
        item.lecturaAnterior,
        item.lecturaActual,
        item.observacion
      ]);
    });

    this.configurarAnchos(worksheet, [10, 24, 14, 14, 28, 14, 28, 18, 18, 18, 12, 26, 16, 12, 24, 16, 16, 30]);
    await this.descargarWorkbook(workbook, `reporte_general_lecturas_${this.emisionSelected?.emision ?? 'emision'}.xlsx`);
    this.swal('success', 'Excel de lecturas generado correctamente');
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
}
