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
  _emisiones: any[] = [];
  emisionSelected: any;
  usrxrutas: any;
  _rutasAsignadas: any[] = [];
  usuarioSeletced: any;
  usrxruta: any;
  swaddruta: boolean = false;
  filtrarRutas: string = '';
  ocupadas = new Set<number>();
  exportandoReporte = false;
  pdfPreviewUrl: SafeResourceUrl | null = null;
  private pdfPreviewObjectUrl: string | null = null;
  rutaPreview: any = null;

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
    this.getAllRutas();
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
    this.rutasService.getListaRutas().subscribe((data: any) => {
      this._rutas = data;
    });
  }

  getEmisiones() {
    this.emisionesService.getAllEmisiones().then((data) => {
      this._emisiones = data;
      this.emisionSelected = data[0];
      this.swaddruta = data[0]?.estado === 0;
      this.cargarOcupadas();
    });
  }

  onEmisionChange() {
    if (!this.emisionSelected) return;

    this.swaddruta = this.emisionSelected.estado === 0;
    this.cargarOcupadas();
    this.cerrarVistaPreviaPdf();

    if (this.usuarioSeletced) {
      this.onCellClick(null, this.usuarioSeletced);
    }
  }

  cargarOcupadas() {
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
  }

  dropRuta(r: any) {
    this._rutasAsignadas = this._rutasAsignadas.filter(
      (ruta: any) => ruta.idruta !== r.idruta
    );
    if (this.rutaPreview?.idruta === r?.idruta) {
      this.cerrarVistaPreviaPdf();
    }
  }

  isRutaAsignada(r: any): boolean {
    if (this._rutasAsignadas && this._rutasAsignadas.length > 0) {
      return this._rutasAsignadas.some((ruta: any) => ruta.idruta === r.idruta);
    }
    return false;
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

  async exportarRutaAsignada(ruta: any, formato: 'pdf' | 'xml') {
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
        this.abrirVistaPreviaPdf(reporte);
      } else {
        this.generarXmlRutaAsignada(reporte);
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

  private abrirVistaPreviaPdf(reporte: any) {
    this.limpiarVistaPreviaPdf();
    this.pdfPreviewObjectUrl = URL.createObjectURL(this.buildPdfRutaAsignada(reporte));
    this.pdfPreviewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.pdfPreviewObjectUrl);
    this.rutaPreview = reporte.ruta;
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

  private generarXmlRutaAsignada(reporte: any) {
    const detallesXml = reporte.detalles
      .map((item: any) => [
        '    <detalle>',
        `      <numero>${this.escapeXml(item.numero)}</numero>`,
        `      <idabonado>${this.escapeXml(item.idabonado)}</idabonado>`,
        `      <responsablePago>${this.escapeXml(item.responsablePago)}</responsablePago>`,
        `      <identificacion>${this.escapeXml(item.identificacion)}</identificacion>`,
        `      <categoria>${this.escapeXml(item.categoria)}</categoria>`,
        `      <lecturaAnterior>${this.escapeXml(item.lecturaAnterior)}</lecturaAnterior>`,
        '      <lecturaActual></lecturaActual>',
        `      <observacion>${this.escapeXml(item.observacion)}</observacion>`,
        '    </detalle>'
      ].join('\n'))
      .join('\n');

    const contenido = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<reporteRutasAsignadas>',
      '  <cabecera>',
      `    <lector>${this.escapeXml(reporte.lector)}</lector>`,
      `    <idusuario>${this.escapeXml(reporte.idusuario)}</idusuario>`,
      `    <emision>${this.escapeXml(reporte.emision)}</emision>`,
      `    <fechaGeneracion>${this.escapeXml(reporte.fechaGeneracion.toISOString())}</fechaGeneracion>`,
      '  </cabecera>',
      '  <ruta>',
      `    <idruta>${this.escapeXml(reporte.ruta?.idruta)}</idruta>`,
      `    <codigo>${this.escapeXml(reporte.ruta?.codigo)}</codigo>`,
      `    <descripcion>${this.escapeXml(reporte.ruta?.descripcion)}</descripcion>`,
      '  </ruta>',
      '  <detalles>',
      detallesXml,
      '  </detalles>',
      '</reporteRutasAsignadas>'
    ].join('\n');

    const blob = new Blob([contenido], { type: 'application/xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = this.buildNombreArchivo(reporte.ruta, 'xml');
    a.click();
    URL.revokeObjectURL(url);

    this.swal('success', 'XML generado correctamente');
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
  }

  private buildNombreArchivo(ruta: any, extension: 'pdf' | 'xml'): string {
    const lector = (this.usuarioSeletced?.nomusu ?? 'lector').replace(/\s+/g, '_');
    const emision = (this.emisionSelected?.emision ?? 'emision').toString().replace(/\s+/g, '_');
    const rutaNombre = (ruta?.descripcion ?? 'ruta').toString().replace(/\s+/g, '_');
    return `ruta_asignada_${rutaNombre}_${lector}_${emision}.${extension}`;
  }

  private escapeXml(value: any): string {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
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
