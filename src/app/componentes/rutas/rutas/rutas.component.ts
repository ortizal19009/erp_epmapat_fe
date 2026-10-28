import { Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { firstValueFrom, Subscription } from 'rxjs';
import * as L from 'leaflet';
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
export class RutasComponent implements OnInit, OnDestroy {
  filtro = '';
  filtroEstado: 'todas' | 'activas' | 'inactivas' | 'sinEstado' = 'todas';

  get rutasPorEstado(): any[] {
    return (this._rutas ?? []).filter((ruta: any) =>
      this.filtroEstado === 'todas' ||
      (this.filtroEstado === 'activas' && ruta.estado === true) ||
      (this.filtroEstado === 'inactivas' && ruta.estado === false) ||
      (this.filtroEstado === 'sinEstado' && ruta.estado == null)
    );
  }

  cambiarEstado() {
    if (this.rutaSeleccionada && !this.rutasPorEstado.some(r => r.idruta === this.rutaSeleccionada.idruta)) {
      clearTimeout(this.busquedaTimer);
      this.detalleSubscription?.unsubscribe();
      this.destruirMapa();
      this.rutaSeleccionada = null;
    }
  }

  cargandoRutas = false;
  errorRutas = '';
  tabDetalle: 'abonados' | 'mapa' = 'abonados';
  cargandoDetalle = false;
  errorDetalle = '';
  paginaAbonados = 0;
  tamanoPagina = 20;
  filtroAbonados = '';
  private busquedaTimer?: ReturnType<typeof setTimeout>;
  private mapaResize?: ResizeObserver;

  buscarAbonados() {
    clearTimeout(this.busquedaTimer);
    this.detalleSubscription?.unsubscribe();
    this.cargandoDetalle = true;
    this.busquedaTimer = setTimeout(() => this.cargarAbonados(0), 350);
  }

  cambiarTamanoPagina() {
    clearTimeout(this.busquedaTimer);
    this.cargarAbonados(0);
  }

  totalPaginas = 0;
  totalAbonados = 0;
  private detalleSubscription?: Subscription;
  cuentasMapa: any[] = [];
  cuentasSinCoordenadas = 0;
  private mapa?: L.Map;
  private mapasCache = new Map<number, any[]>();

  @ViewChild('mapaCuentas') set mapaCuentas(elemento: ElementRef<HTMLDivElement> | undefined) {
    this.destruirMapa();
    if (!elemento) return;
    const puntosValidos = this.cuentasMapa.map(c => this.parseCoordenadas(c.geolocalizacion)).filter((c): c is L.LatLngTuple => c !== null);
    const mapa = L.map(elemento.nativeElement, { zoomAnimation: false, markerZoomAnimation: false })
      .setView(puntosValidos[0] ?? [0.811, -77.718], 16);
    this.mapa = mapa;
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap', maxZoom: 19
    }).addTo(mapa);
    const puntos: L.LatLngTuple[] = [];
    for (const cuenta of this.cuentasMapa) {
      const coords = this.parseCoordenadas(cuenta.geolocalizacion);
      if (!coords) continue;
      puntos.push(coords);
      const popup = document.createElement('div');
      const titulo = document.createElement('strong');
      titulo.textContent = `Cuenta ${cuenta.idabonado}`;
      popup.append(titulo, document.createElement('br'),
        document.createTextNode(cuenta.nombre || 'Sin nombre'), document.createElement('br'),
        document.createTextNode(cuenta.direccion || 'Sin direccion'));
      const icono = L.divIcon({
        className: 'cuenta-marcador',
        html: '<span style="display:block;width:18px;height:18px;background:#007bff;border:3px solid white;border-radius:50%;box-shadow:0 1px 5px #333"></span>',
        iconSize: [18, 18], iconAnchor: [9, 9], popupAnchor: [0, -10]
      });
      L.marker(coords, { icon: icono, title: `Cuenta ${cuenta.idabonado}`, keyboard: true })
        .bindTooltip(`Cuenta ${cuenta.idabonado}`).bindPopup(popup).addTo(mapa);
    }
    const ajustarMapa = () => {
      if (this.mapa !== mapa || !elemento.nativeElement.clientWidth) return;
      mapa.invalidateSize({ animate: false });
      if (puntos.length) mapa.fitBounds(L.latLngBounds(puntos), { padding: [25, 25], maxZoom: 18, animate: false });
    };
    this.mapaResize = new ResizeObserver(ajustarMapa);
    this.mapaResize.observe(elemento.nativeElement);
    requestAnimationFrame(ajustarMapa);
  }

  private destruirMapa() {
    this.mapaResize?.disconnect();
    this.mapaResize = undefined;
    this.mapa?.remove();
    this.mapa = undefined;
  }

  parseCoordenadas(valor: any): L.LatLngTuple | null {
    try {
      const coords = typeof valor === 'string' ? JSON.parse(valor) : valor;
      if (!Array.isArray(coords) || coords.length !== 2) return null;
      if (coords.some(v => v === null || typeof v === 'boolean' || String(v).trim() === '')) return null;
      const lat = Number(coords[0]), lng = Number(coords[1]);
      if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180 || (lat === 0 && lng === 0)) return null;
      return [lat, lng];
    } catch { return null; }
  }
  private paginasCache = new Map<string, any>();

  ngOnDestroy(): void {
    clearTimeout(this.busquedaTimer);
    this.detalleSubscription?.unsubscribe();
    this.destruirMapa();
    this.cerrarVistaPreviaPdf();
  }

  seleccionarRuta(ruta: any) {
    if (this.rutaSeleccionada?.idruta === ruta.idruta) return;
    clearTimeout(this.busquedaTimer);
    this.filtroAbonados = "";
    this.detalleSubscription?.unsubscribe();
    this.destruirMapa();
    this.rutaSeleccionada = ruta;
    this._abonados = [];
    this.cuentasMapa = [];
    this.cuentasSinCoordenadas = 0;
    this.tabDetalle = 'abonados';
    this.totalAbonados = 0;
    this.totalPaginas = 0;
    this.cargarAbonados(0);
  }

  cambiarTab(tab: 'abonados' | 'mapa') {
    if (this.tabDetalle === tab) return;
    clearTimeout(this.busquedaTimer);
    this.tabDetalle = tab;
    this.detalleSubscription?.unsubscribe();
    this.destruirMapa();
    this.errorDetalle = '';
    if (tab === 'abonados') this.cargarAbonados(this.paginaAbonados);
    else this.cargarMapa();
  }

  cargarAbonados(pagina: number) {
    const id = this.rutaSeleccionada.idruta;
    const key = `${id}:${pagina}:${this.tamanoPagina}:${this.filtroAbonados.trim()}`;
    this.detalleSubscription?.unsubscribe();
    this.paginaAbonados = pagina;
    this.errorDetalle = '';
    const aplicar = (datos: any) => {
      this._abonados = datos.content ?? [];
      this.totalAbonados = datos.totalElements ?? 0;
      this.totalPaginas = datos.totalPages ?? 0;
      this.cargandoDetalle = false;
    };
    if (this.paginasCache.has(key)) { aplicar(this.paginasCache.get(key)); return; }
    this.cargandoDetalle = true;
    this.detalleSubscription = this.s_abonado.getAbonadosByRutaPageable(id, pagina, this.tamanoPagina, this.filtroAbonados).subscribe({
      next: datos => { this.paginasCache.set(key, datos); aplicar(datos); },
      error: () => { this.cargandoDetalle = false; this.errorDetalle = 'No se pudieron cargar los abonados.'; }
    });
  }

  cargarMapa() {
    const id = this.rutaSeleccionada.idruta;
    this.detalleSubscription?.unsubscribe();
    this.errorDetalle = '';
    const aplicar = (cuentas: any[]) => {
      this.cuentasMapa = cuentas;
      this.cuentasSinCoordenadas = cuentas.filter(c => !this.parseCoordenadas(c.geolocalizacion)).length;
      this.cargandoDetalle = false;
    };
    if (this.mapasCache.has(id)) { aplicar(this.mapasCache.get(id)!); return; }
    this.cargandoDetalle = true;
    this.detalleSubscription = this.rutService.getCuentasMapa(id).subscribe({
      next: cuentas => { this.mapasCache.set(id, cuentas); aplicar(cuentas); },
      error: () => { this.cargandoDetalle = false; this.errorDetalle = 'No se pudieron cargar las cuentas del mapa.'; }
    });
  }

  reintentarDetalle() {
    if (this.tabDetalle === 'abonados') this.cargarAbonados(this.paginaAbonados);
    else this.cargarMapa();
  }

  _rutas: any;
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
      const datos = await this.coloresService.setcolor(this.authService.idusuario, 'rutas');
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
    this.cargandoRutas = true;
    this.errorRutas = '';
    this.rutService.getListaRutas(true).subscribe({
      next: rutas => { this._rutas = rutas; this.cargandoRutas = false; },
      error: () => { this.errorRutas = 'No se pudieron cargar las rutas.'; this.cargandoRutas = false; }
    });
  }

  onCellClick(event: any, ruta: Rutas) {
    this.seleccionarRuta(ruta);
  }

  abrirDetalleCuenta(idabonado: number) {
    if (!idabonado || idabonado <= 0) return;
    sessionStorage.setItem('idabonadoToFactura', String(idabonado));
    this.router.navigate(['detalles-abonado']);
  }

  confirmarEliminarRuta(ruta: Rutas) {
    if (window.confirm(`Eliminar la ruta ${ruta.codigo} - ${ruta.descripcion}?`)) {
      this.eliminarRuta(ruta.idruta);
    }
  }

  eliminarRuta(idruta: number) {
    this.rutService.deleteRuta(idruta).subscribe({
      next: () => {
        if (this.rutaSeleccionada?.idruta === idruta) {
          clearTimeout(this.busquedaTimer);
          this.detalleSubscription?.unsubscribe();
          this.destruirMapa();
          this.rutaSeleccionada = null;
        }
        this.paginasCache.clear();
        this.mapasCache.clear();
        this.listaRutas();
      },
      error: (err) => console.error(err.error),
    });
  }

  menuRuta: any = null;
  menuRutaTop = 0;
  menuRutaLeft = 0;

  alternarMenuRuta(event: MouseEvent, ruta: any) {
    event.stopPropagation();
    if (this.menuRuta?.idruta === ruta.idruta) { this.cerrarMenuRuta(); return; }
    const boton = event.currentTarget as HTMLElement;
    const rect = boton.getBoundingClientRect();
    const ancho = Math.min(230, window.innerWidth - 16);
    const alto = 150;
    this.menuRutaLeft = Math.max(8, Math.min(rect.right - ancho, window.innerWidth - ancho - 8));
    this.menuRutaTop = rect.bottom + alto < window.innerHeight
      ? rect.bottom + 4 : Math.max(8, rect.top - alto);
    this.menuRuta = ruta;
  }

  @HostListener('document:click')
  @HostListener('document:keydown.escape')
  @HostListener('window:resize')
  @HostListener('window:scroll')
  cerrarMenuRuta() { this.menuRuta = null; }

  ejecutarAccionRuta(accion: 'editar' | 'info' | 'eliminar') {
    const ruta = this.menuRuta;
    this.cerrarMenuRuta();
    if (!ruta) return;
    if (accion === 'editar') this.modificarRuta(ruta);
    else if (accion === 'info') this.seleccionarRuta(ruta);
    else this.confirmarEliminarRuta(ruta);
  }

  modificarRuta(ruta: Rutas) {
    localStorage.setItem('idruta', ruta.idruta.toString());
    this.router.navigate(['editar-ruta', ruta.idruta]);
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
