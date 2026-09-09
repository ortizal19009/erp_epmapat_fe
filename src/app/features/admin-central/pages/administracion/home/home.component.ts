import { AfterViewInit, Component, OnInit } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import * as ExcelJS from 'exceljs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AbonadosService } from 'src/app/servicios/abonados.service';
import { EmisionService } from 'src/app/servicios/emision.service';
import * as L from 'leaflet';
import { RutasService } from 'src/app/servicios/rutas.service';
import { ColoresService } from 'src/app/compartida/colores.service';
import { ConvenioService } from 'src/app/servicios/convenio.service';
import { PdfService } from 'src/app/servicios/pdf.service';
import { ClientesService } from 'src/app/servicios/clientes.service';
import { CategoriaService } from 'src/app/servicios/categoria.service';
import { FacturaService } from 'src/app/servicios/factura.service';
import { AutorizaService } from 'src/app/compartida/autoriza.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit, AfterViewInit {

  // ══════════════════════════════════════
  //   PROPIEDADES
  // ══════════════════════════════════════

  _resumenEmisiones: any;
  _ByEstados: any;
  _ByCategorias: any;
  categoriasCatalogo: any[] = [];
  _rutas: any;
  _abonados: any[] = [];
  abonados: any;
  abonadosDetalleLoading = false;
  abonadosDetalleFiltro = '';
  abonadosDetallePage = 0;
  abonadosDetalleSize = 10;
  filtro: string = '';
  txtModal: string = 'DETALLES';
  hoy = new Date();
  conveniosFechaDesde = '';
  conveniosFechaHasta = '';
  convenioStatsLoading = false;
  convenioStats = {
    total: 0,
    cuotas0: 0,
    masDeUnaCuota: 0,
    eliminados: 0,
    anulados: 0,
    pagados: 0,
    totalConveniado: 0,
    totalRecaudado: 0,
    totalPendiente: 0,
  };
  conveniosStatsDetalle: any[] = [];
  carteraVencidaFecha = '';
  carteraVencidaLoading = false;
  carteraVencidaDetalle: any[] = [];
  carteraVencidaTotal = 0;
  carteraVencidaClientes = 0;
  carteraVencidaConsumo = 0;
  carteraVencidaNoConsumo = 0;

  edificioMatriz: any = [0.8038125013453109, -77.72763063596486];

  _ubicaciones = [
    { nombre: 'EPMAPA-T (Matriz)',       direccion: 'Juan Ramón Arellano y Bolívar', color: 'teal',  coords: [0.8038125013453109, -77.72763063596486] as L.LatLngExpression },
    { nombre: 'Edf. Comercialización',   direccion: 'Tulcán, Carchi',               color: 'green', coords: null },
    { nombre: 'Planta de Tratamiento',   direccion: 'Tulcán, Carchi',               color: 'blue',  coords: null },
    { nombre: 'Tanques de Agua',         direccion: 'Tulcán, Carchi',               color: 'amber', coords: null },
  ];

  private map!: L.Map | undefined;
  private citiesLayer: L.LayerGroup | null = null;

  // ══════════════════════════════════════
  //   GETTERS (KPIs calculados)
  // ══════════════════════════════════════

  get totalAbonados(): number {
    if (!this._ByEstados?.length) return 0;
    return this._ByEstados.reduce((sum: number, e: any) => sum + (e.ncuentas || 0), 0);
  }

  get totalCobrado(): number {
    if (!this._resumenEmisiones?.length) return 0;
    return this._resumenEmisiones[0]?.total_pagado ?? 0;
  }

  get totalPendiente(): number {
    if (!this._resumenEmisiones?.length) return 0;
    return this._resumenEmisiones[0]?.total_pendiente ?? 0;
  }

  get totalM3(): number {
    if (!this._resumenEmisiones?.length) return 0;
    return this._resumenEmisiones[0]?.m3 ?? 0;
  }

  // ══════════════════════════════════════
  //   CONSTRUCTOR
  // ══════════════════════════════════════

  constructor(
    private s_emisiones: EmisionService,
    private s_abonados: AbonadosService,
    private s_rutas: RutasService,
    private coloresService: ColoresService,
    private convenioService: ConvenioService,
    private pdfService: PdfService,
    private clientesService: ClientesService,
    private categoriaService: CategoriaService,
    private facturaService: FacturaService,
    private authService: AutorizaService,
  ) {}

  // ══════════════════════════════════════
  //   CICLO DE VIDA
  // ══════════════════════════════════════

  ngOnInit(): void {
    sessionStorage.setItem('ventana', '/estados-convenios');
    const coloresJSON = sessionStorage.getItem('/estados-convenios');
    if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));
    else this.buscaColor();

    this.getResumenEmisiones(12);
    this.getDatosAbonados();
    this.getRutas();
    this.carteraVencidaFecha = this.toInputDate(this.hoy);
    void this.getCarteraVencidaResumen();
    this.inicializarFiltroConvenios();
    void this.cargarEstadisticasConvenios();
  }

  ngAfterViewInit(): void {
    this.drawAllCuentas();
  }

  // ══════════════════════════════════════
  //   COLORES
  // ══════════════════════════════════════

  colocaColor(colores: any) {
    document.documentElement.style.setProperty('--bgcolor1', colores[0]);
    const cabecera = document.querySelector('.cabecera');
    if (cabecera) cabecera.classList.add('nuevoBG1');
    document.documentElement.style.setProperty('--bgcolor2', colores[1]);
    const detalle = document.querySelector('.detalle');
    if (detalle) detalle.classList.add('nuevoBG2');
  }

  async buscaColor() {
    try {
      const datos = await this.coloresService.setcolor(this.authService.idusuario, 'cv-facturas');
      sessionStorage.setItem('/cv-facturas', JSON.stringify(datos));
      this.colocaColor(datos);
    } catch (error) {
      console.error(error);
    }
  }

  // ══════════════════════════════════════
  //   MAPA
  // ══════════════════════════════════════

  drawAllCuentas(): void {
    const cuenta: L.Marker[] = [];

    if (this._abonados.length > 0) {
      this._abonados.forEach((item: any) => {
        try {
          if (item.geolocalizacion != null) {
            const coordsArray: L.LatLngExpression = JSON.parse(item.geolocalizacion);
            const marker = L.marker(coordsArray).bindPopup(`Abonado ID: ${item.idabonado}`);
            cuenta.push(marker);
          }
        } catch (e) {
          console.error('Error al parsear coordenadas:', item.geolocalizacion);
        }
      });
    } else {
      const marker = L.marker(this.edificioMatriz).bindPopup('Edificio Epmapa-T');
      cuenta.push(marker);
    }

    const nuevaCitiesLayer = L.layerGroup(cuenta);

    const osm = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; EPMAPA-T',
    });

    const osmHOT = L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; EPMAPA-T',
    });

    const baseMaps   = { OpenStreetMap: osm, 'OpenStreetMap HOT': osmHOT };
    const overlayMaps = { Cuentas: nuevaCitiesLayer };

    if (this.map) {
      if (this.citiesLayer) this.map.removeLayer(this.citiesLayer);
      this.citiesLayer = nuevaCitiesLayer;
      this.citiesLayer.addTo(this.map);
      const mainView: L.LatLngExpression = JSON.parse(this._abonados[0].geolocalizacion);
      this.map.setView(mainView, 17);
    } else {
      this.map = L.map('map', {
        center: this.edificioMatriz,
        zoom: 19,
        layers: [osm, nuevaCitiesLayer],
      });
      this.citiesLayer = nuevaCitiesLayer;
      L.control.layers(baseMaps, overlayMaps).addTo(this.map);
    }
  }

  verUbicacion(ub: any) {
    if (!ub.coords || !this.map) return;
    this.map.setView(ub.coords, 17);
  }

  // ══════════════════════════════════════
  //   DATOS
  // ══════════════════════════════════════

  async getResumenEmisiones(limit: number) {
    this._resumenEmisiones = await this.s_emisiones.getResumenEmision(limit);
  }

  async getDatosAbonados() {
    this._ByCategorias = await this.s_abonados.getCuentasByCategoria();
    this._ByEstados    = await this.s_abonados.getCuentasByEstado();
    this.categoriasCatalogo = await firstValueFrom(this.categoriaService.getListCategoria());
  }

  async getCarteraVencidaResumen(): Promise<void> {
    this.carteraVencidaLoading = true;

    try {
      const fecha = this.carteraVencidaFecha || this.toInputDate(this.hoy);
      const [consumo, noConsumo] = await Promise.all([
        firstValueFrom(this.facturaService.getCarteraVencidaConsumo(fecha)),
        firstValueFrom(this.facturaService.getCarteraVencidaNoConsumo(fecha)),
      ]);
      this.carteraVencidaConsumo = Array.isArray(consumo) ? consumo.length : 0;
      this.carteraVencidaNoConsumo = Array.isArray(noConsumo) ? noConsumo.length : 0;
      const lista = [
        ...(Array.isArray(consumo) ? consumo : []),
        ...(Array.isArray(noConsumo) ? noConsumo : []),
      ];
      this.carteraVencidaDetalle = lista;

      this.carteraVencidaClientes = new Set(
        lista
          .map((item: any) => this.buildCarteraClienteKey(item))
          .filter((key: string) => !!key)
      ).size;
      this.carteraVencidaTotal = lista.reduce((acc: number, item: any) => {
        return acc + this.getCarteraValor(item);
      }, 0);
    } catch (error) {
      console.error('Error al cargar cartera vencida', error);
      this.carteraVencidaDetalle = [];
      this.carteraVencidaClientes = 0;
      this.carteraVencidaTotal = 0;
      this.carteraVencidaConsumo = 0;
      this.carteraVencidaNoConsumo = 0;
    } finally {
      this.carteraVencidaLoading = false;
    }
  }

  getRutas() {
    this.s_rutas.getNcuentasByRutas().subscribe({
      next: (datos: any) => (this._rutas = datos),
      error: (e: any) => console.error(e.error),
    });
  }

  async getAbonadosByRutas(idruta: number) {
    this._abonados = [];
    this._abonados = await this.s_abonados.getByIdrutaAsync(idruta);
    this.drawAllCuentas();
  }

  async findCuentasByEstado(estado: any): Promise<void> {
    this.txtModal = `Abonados por estado: ${estado?.descripcion ?? ''}`;
    this.abonadosDetalleFiltro = '';
    this.abonadosDetallePage = 0;
    this.abonadosDetalleLoading = true;

    try {
      const datos: any = await firstValueFrom(this.s_abonados.getByEstado(estado.estado));
      this.abonados = await this.enriquecerAbonadosDetalle(Array.isArray(datos) ? datos : []);
    } catch (e: any) {
      console.error(e);
      this.abonados = [];
    } finally {
      this.abonadosDetalleLoading = false;
    }
  }

  async findCuentasByCategoria(categoria: any): Promise<void> {
    this.txtModal = `Abonados por categoria: ${categoria?.descripcion ?? ''}`;
    this.abonadosDetalleFiltro = '';
    this.abonadosDetallePage = 0;
    this.abonadosDetalleLoading = true;

    try {
      const idcategoria = this.resolverIdCategoria(categoria);
      if (!idcategoria) {
        this.abonados = [];
        return;
      }

      const datos: any = await firstValueFrom(this.s_abonados.getResAbonadoByCategoria(idcategoria));
      this.abonados = await this.enriquecerAbonadosDetalle(Array.isArray(datos) ? datos : []);
    } catch (e: any) {
      console.error(e);
      this.abonados = [];
    } finally {
      this.abonadosDetalleLoading = false;
    }
  }

  // ══════════════════════════════════════
  //   UTILIDADES UI
  // ══════════════════════════════════════

  getCategoriaPct(ncuentas: number): number {
    if (!this._ByCategorias?.length) return 0;
    const max = Math.max(...this._ByCategorias.map((c: any) => c.ncuentas));
    return max > 0 ? (ncuentas / max) * 100 : 0;
  }

  inicializarFiltroConvenios(): void {
    const hoy = new Date();
    this.conveniosFechaDesde = '2000-01-01';
    this.conveniosFechaHasta = this.toInputDate(hoy);
  }

  async cargarEstadisticasConvenios(): Promise<void> {
    this.convenioStatsLoading = true;

    try {
      const preview = await firstValueFrom(this.convenioService.buscarConvenios({
        fechaDesde: this.conveniosFechaDesde || null,
        fechaHasta: this.conveniosFechaHasta || null,
        page: 0,
        size: 1,
      }));
      const total = Number(preview?.totalElements ?? 0);
      const size = total > 0 ? total : 2000;
      const respuesta = await firstValueFrom(this.convenioService.buscarConvenios({
        fechaDesde: this.conveniosFechaDesde || null,
        fechaHasta: this.conveniosFechaHasta || null,
        page: 0,
        size,
      }));
      const convenios = Array.isArray(respuesta?.content) ? respuesta.content : [];
      const filtrados = (Array.isArray(convenios) ? convenios : []).filter((convenio: any) =>
        this.cumpleFiltroFechaConvenio(convenio?.feccrea)
      );

      const resumen = {
        total: filtrados.length,
        cuotas0: 0,
        masDeUnaCuota: 0,
        eliminados: 0,
        anulados: 0,
        pagados: 0,
        totalConveniado: 0,
        totalRecaudado: 0,
        totalPendiente: 0,
      };

      const detalleConvenios = filtrados.map((convenio: any) => {
        const valores = this.calcularValoresConvenio(convenio);
        return { convenio, ...valores };
      });

      detalleConvenios.forEach(({ convenio, recaudado, pendiente }) => {
        const nroCuotas = Number(convenio?.cuotas ?? 0);
        const totalConvenio = Number(convenio?.totalconvenio ?? 0);
        const estadoConvenio = Number(convenio?.estado ?? -999);

        if (nroCuotas === 0) resumen.cuotas0 += 1;
        if (nroCuotas > 1) resumen.masDeUnaCuota += 1;
        if (estadoConvenio === 0) resumen.eliminados += 1;
        if (estadoConvenio === 2) resumen.anulados += 1;
        if (estadoConvenio === 3) resumen.pagados += 1;

        resumen.totalConveniado += totalConvenio;
        resumen.totalRecaudado += recaudado;
        resumen.totalPendiente += pendiente;
      });

      this.convenioStats = resumen;
      this.conveniosStatsDetalle = detalleConvenios.map(({ convenio, recaudado, pendiente }) => {
        return {
          nroconvenio: convenio?.nroconvenio ?? '',
          feccrea: convenio?.feccrea ?? '',
          cuenta: convenio?.idabonado?.idabonado ?? convenio?.idabonado ?? '',
          abonado: convenio?.nombre ?? convenio?.idabonado?.idcliente_clientes?.nombre ?? '',
          cuotas: Number(convenio?.cuotas ?? 0),
          totalConvenio: Number(convenio?.totalconvenio ?? 0),
          recaudado,
          pendiente,
          estado: convenio?.estado ?? '',
        };
      });
    } catch (error) {
      console.error('Error al cargar estadísticas de convenios', error);
      this.convenioStats = {
        total: 0,
        cuotas0: 0,
        masDeUnaCuota: 0,
        eliminados: 0,
        anulados: 0,
        pagados: 0,
        totalConveniado: 0,
        totalRecaudado: 0,
        totalPendiente: 0,
      };
      this.conveniosStatsDetalle = [];
    } finally {
      this.convenioStatsLoading = false;
    }
  }

  async exportarConveniosExcel(): Promise<void> {
    if (!this.conveniosStatsDetalle.length) return;

    const workbook = new ExcelJS.Workbook();
    const resumenSheet = workbook.addWorksheet('Resumen');
    const detalleSheet = workbook.addWorksheet('Detalle');
    const rango = this.getRangoConveniosTexto();

    resumenSheet.addRow(['Reporte de estadisticas de convenios']);
    resumenSheet.addRow(['Rango', rango]);
    resumenSheet.addRow([]);
    resumenSheet.addRow(['Indicador', 'Valor']);
    [
      ['Total convenios', this.convenioStats.total],
      ['Convenios con cuotas 0', this.convenioStats.cuotas0],
      ['Convenios con mas de 1 cuota', this.convenioStats.masDeUnaCuota],
      ['Convenios eliminados', this.convenioStats.eliminados],
      ['Convenios anulados', this.convenioStats.anulados],
      ['Convenios pagados', this.convenioStats.pagados],
      ['Monto total conveniado', this.convenioStats.totalConveniado],
      ['Monto recaudado', this.convenioStats.totalRecaudado],
      ['Monto pendiente', this.convenioStats.totalPendiente],
    ].forEach((row) => resumenSheet.addRow(row));

    resumenSheet.getRow(4).font = { bold: true };
    resumenSheet.columns = [{ width: 34 }, { width: 20 }];

    detalleSheet.addRow([
      'Nro convenio',
      'Fecha creacion',
      'Cuenta',
      'Abonado',
      'Cuotas',
      'Total convenio',
      'Recaudado',
      'Pendiente',
      'Estado',
    ]);

    this.conveniosStatsDetalle.forEach((item) => {
      detalleSheet.addRow([
        item.nroconvenio,
        this.formatFecha(item.feccrea),
        item.cuenta,
        item.abonado,
        item.cuotas,
        item.totalConvenio,
        item.recaudado,
        item.pendiente,
        this.getEstadoConvenioLabel(item.estado),
      ]);
    });

    detalleSheet.getRow(1).font = { bold: true };
    detalleSheet.columns = [
      { width: 14 },
      { width: 16 },
      { width: 12 },
      { width: 34 },
      { width: 10 },
      { width: 18 },
      { width: 18 },
      { width: 18 },
      { width: 14 },
    ];

    [6, 7, 8].forEach((col) => {
      detalleSheet.getColumn(col).numFmt = '$#,##0.00';
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = this.buildConveniosExportName('xlsx');
    a.click();
    window.URL.revokeObjectURL(url);
  }

  exportarConveniosPdf(): void {
    if (!this.conveniosStatsDetalle.length) return;

    const doc = new jsPDF('l', 'pt', 'a4');
    this.pdfService.header('Estadisticas de convenios de pago', doc);
    doc.setFontSize(10);
    doc.text(`Rango: ${this.getRangoConveniosTexto()}`, 40, 88);

    autoTable(doc, {
      startY: 100,
      theme: 'grid',
      head: [['Indicador', 'Valor']],
      body: [
        ['Total convenios', this.convenioStats.total],
        ['Convenios con cuotas 0', this.convenioStats.cuotas0],
        ['Convenios con mas de 1 cuota', this.convenioStats.masDeUnaCuota],
        ['Convenios eliminados', this.convenioStats.eliminados],
        ['Convenios anulados', this.convenioStats.anulados],
        ['Convenios pagados', this.convenioStats.pagados],
        ['Monto total conveniado', this.formatoMoneda(this.convenioStats.totalConveniado)],
        ['Monto recaudado', this.formatoMoneda(this.convenioStats.totalRecaudado)],
        ['Monto pendiente', this.formatoMoneda(this.convenioStats.totalPendiente)],
      ],
      margin: { left: 40, right: 40 },
      styles: { fontSize: 9 },
      headStyles: { fillColor: [41, 128, 185] },
    });

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 18,
      theme: 'grid',
      head: [[
        'Nro',
        'Fecha',
        'Cuenta',
        'Abonado',
        'Cuotas',
        'Total',
        'Recaudado',
        'Pendiente',
        'Estado',
      ]],
      body: this.conveniosStatsDetalle.map((item) => [
        item.nroconvenio,
        this.formatFecha(item.feccrea),
        item.cuenta,
        item.abonado,
        item.cuotas,
        this.formatoMoneda(item.totalConvenio),
        this.formatoMoneda(item.recaudado),
        this.formatoMoneda(item.pendiente),
        this.getEstadoConvenioLabel(item.estado),
      ]),
      margin: { left: 20, right: 20, bottom: 20 },
      styles: { fontSize: 7.5, cellPadding: 2 },
      headStyles: { fillColor: [23, 162, 184] },
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 55 },
        2: { cellWidth: 55 },
        3: { cellWidth: 150 },
        4: { cellWidth: 45 },
        5: { cellWidth: 70 },
        6: { cellWidth: 70 },
        7: { cellWidth: 70 },
        8: { cellWidth: 55 },
      },
    });

    this.pdfService.setfooter(doc);
    doc.save(this.buildConveniosExportName('pdf'));
  }

  exportarConveniosCsv(): void {
    if (!this.conveniosStatsDetalle.length) return;

    const encabezado = [
      'Rango',
      'Total convenios',
      'Convenios con cuotas 0',
      'Convenios con mas de 1 cuota',
      'Convenios eliminados',
      'Convenios anulados',
      'Convenios pagados',
      'Monto total conveniado',
      'Monto recaudado',
      'Monto pendiente',
    ];

    const resumen = [
      this.getRangoConveniosTexto(),
      this.convenioStats.total,
      this.convenioStats.cuotas0,
      this.convenioStats.masDeUnaCuota,
      this.convenioStats.eliminados,
      this.convenioStats.anulados,
      this.convenioStats.pagados,
      this.convenioStats.totalConveniado.toFixed(2),
      this.convenioStats.totalRecaudado.toFixed(2),
      this.convenioStats.totalPendiente.toFixed(2),
    ];

    const detalleHeaders = [
      'Nro convenio',
      'Fecha creacion',
      'Cuenta',
      'Abonado',
      'Cuotas',
      'Total convenio',
      'Recaudado',
      'Pendiente',
      'Estado',
    ];

    const detalleRows = this.conveniosStatsDetalle.map((item) => [
      item.nroconvenio,
      this.formatFecha(item.feccrea),
      item.cuenta,
      item.abonado,
      item.cuotas,
      item.totalConvenio.toFixed(2),
      item.recaudado.toFixed(2),
      item.pendiente.toFixed(2),
      this.getEstadoConvenioLabel(item.estado),
    ]);

    const csv = [
      encabezado,
      resumen,
      [],
      detalleHeaders,
      ...detalleRows,
    ]
      .map((row) => row.map((cell: any) => this.csvEscape(cell)).join(','))
      .join('\r\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = this.buildConveniosExportName('csv');
    a.click();
    window.URL.revokeObjectURL(url);
  }

  async exportarCarteraVencidaExcel(): Promise<void> {
    if (!this.carteraVencidaDetalle.length) return;

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Cartera vencida');

    sheet.addRow(['Reporte de cartera vencida']);
    sheet.addRow(['Fecha de corte', this.formatFecha(this.carteraVencidaFecha)]);
    sheet.addRow(['Clientes con deuda', this.carteraVencidaClientes]);
    sheet.addRow(['Total cartera vencida', this.carteraVencidaTotal]);
    sheet.addRow([]);
    sheet.addRow(['Cliente', 'Cuenta', 'Factura', 'Modulo', 'Identificacion', 'Direccion', 'Telefono', 'Email', 'Valor']);

    this.carteraVencidaDetalle.forEach((item: any) => {
      sheet.addRow([
        this.getCarteraClienteNombre(item),
        this.getCarteraClienteCuenta(item),
        this.getCarteraClienteFactura(item),
        this.getCarteraClienteModulo(item),
        this.getCarteraClienteCedula(item),
        this.getCarteraClienteDireccion(item),
        this.getCarteraClienteTelefono(item),
        this.getCarteraClienteEmail(item),
        this.getCarteraValor(item),
      ]);
    });

    sheet.getRow(6).font = { bold: true };
    sheet.columns = [
      { width: 32 },
      { width: 14 },
      { width: 14 },
      { width: 22 },
      { width: 18 },
      { width: 34 },
      { width: 18 },
      { width: 28 },
      { width: 16 },
    ];
    sheet.getColumn(9).numFmt = '$#,##0.00';

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = this.buildCarteraVencidaExportName('xlsx');
    a.click();
    window.URL.revokeObjectURL(url);
  }

  exportarCarteraVencidaPdf(): void {
    if (!this.carteraVencidaDetalle.length) return;

    const doc = new jsPDF('l', 'pt', 'a4');
    this.pdfService.header('Reporte de cartera vencida', doc);
    doc.setFontSize(10);
    doc.text(`Fecha de corte: ${this.formatFecha(this.carteraVencidaFecha)}`, 40, 88);
    doc.text(`Clientes con deuda: ${this.carteraVencidaClientes}`, 40, 104);
    doc.text(`Total cartera vencida: ${this.formatoMoneda(this.carteraVencidaTotal)}`, 40, 120);

    autoTable(doc, {
      startY: 136,
      theme: 'grid',
      head: [['Cliente', 'Cuenta', 'Factura', 'Modulo', 'Identificacion', 'Direccion', 'Telefono', 'Email', 'Valor']],
      body: this.carteraVencidaDetalle.map((item: any) => [
        this.getCarteraClienteNombre(item),
        this.getCarteraClienteCuenta(item),
        this.getCarteraClienteFactura(item),
        this.getCarteraClienteModulo(item),
        this.getCarteraClienteCedula(item),
        this.getCarteraClienteDireccion(item),
        this.getCarteraClienteTelefono(item),
        this.getCarteraClienteEmail(item),
        this.formatoMoneda(this.getCarteraValor(item)),
      ]),
      margin: { left: 20, right: 20, bottom: 20 },
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [180, 35, 24] },
      columnStyles: {
        0: { cellWidth: 135 },
        1: { cellWidth: 55 },
        2: { cellWidth: 60 },
        3: { cellWidth: 85 },
        4: { cellWidth: 80 },
        5: { cellWidth: 120 },
        6: { cellWidth: 75 },
        7: { cellWidth: 120 },
        8: { cellWidth: 65 },
      },
    });

    this.pdfService.setfooter(doc);
    doc.save(this.buildCarteraVencidaExportName('pdf'));
  }

  exportarCarteraVencidaCsv(): void {
    if (!this.carteraVencidaDetalle.length) return;

    const csv = [
      ['Reporte de cartera vencida'],
      ['Fecha de corte', this.formatFecha(this.carteraVencidaFecha)],
      ['Clientes con deuda', this.carteraVencidaClientes],
      ['Total cartera vencida', this.carteraVencidaTotal.toFixed(2)],
      [],
      ['Cliente', 'Cuenta', 'Factura', 'Modulo', 'Identificacion', 'Direccion', 'Telefono', 'Email', 'Valor'],
      ...this.carteraVencidaDetalle.map((item: any) => [
        this.getCarteraClienteNombre(item),
        this.getCarteraClienteCuenta(item),
        this.getCarteraClienteFactura(item),
        this.getCarteraClienteModulo(item),
        this.getCarteraClienteCedula(item),
        this.getCarteraClienteDireccion(item),
        this.getCarteraClienteTelefono(item),
        this.getCarteraClienteEmail(item),
        this.getCarteraValor(item).toFixed(2),
      ]),
    ]
      .map((row) => row.map((cell: any) => this.csvEscape(cell)).join(','))
      .join('\r\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = this.buildCarteraVencidaExportName('csv');
    a.click();
    window.URL.revokeObjectURL(url);
  }

  async exportarAbonadosModalExcel(): Promise<void> {
    if (!this.abonadosFiltrados.length) return;

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Abonados');

    sheet.addRow([this.txtModal]);
    sheet.addRow(['Filtro aplicado', this.abonadosDetalleFiltro || 'Sin filtro']);
    sheet.addRow([]);
    sheet.addRow(['Cuenta', 'Cliente', 'Cedula', 'Telefono', 'Direccion', 'Categoria']);

    this.abonadosFiltrados.forEach((abonado: any) => {
      sheet.addRow([
        abonado?.idabonado ?? '',
        this.getAbonadoNombre(abonado),
        this.getAbonadoCedula(abonado),
        this.getAbonadoTelefono(abonado),
        abonado?.direccionubicacion ?? '',
        this.getAbonadoCategoria(abonado),
      ]);
    });

    sheet.getRow(4).font = { bold: true };
    sheet.columns = [
      { width: 14 },
      { width: 32 },
      { width: 18 },
      { width: 18 },
      { width: 36 },
      { width: 22 },
    ];

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = this.buildAbonadosModalExportName('xlsx');
    a.click();
    window.URL.revokeObjectURL(url);
  }

  exportarAbonadosModalPdf(): void {
    if (!this.abonadosFiltrados.length) return;

    const doc = new jsPDF('l', 'pt', 'a4');
    this.pdfService.header(this.txtModal, doc);
    doc.setFontSize(10);
    doc.text(`Filtro: ${this.abonadosDetalleFiltro || 'Sin filtro'}`, 40, 88);

    autoTable(doc, {
      startY: 100,
      theme: 'grid',
      head: [['Cuenta', 'Cliente', 'Cedula', 'Telefono', 'Direccion', 'Categoria']],
      body: this.abonadosFiltrados.map((abonado: any) => [
        abonado?.idabonado ?? '',
        this.getAbonadoNombre(abonado),
        this.getAbonadoCedula(abonado),
        this.getAbonadoTelefono(abonado),
        abonado?.direccionubicacion ?? '',
        this.getAbonadoCategoria(abonado),
      ]),
      margin: { left: 20, right: 20, bottom: 20 },
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [41, 128, 185] },
      columnStyles: {
        0: { cellWidth: 55 },
        1: { cellWidth: 140 },
        2: { cellWidth: 85 },
        3: { cellWidth: 85 },
        4: { cellWidth: 150 },
        5: { cellWidth: 90 },
      },
    });

    this.pdfService.setfooter(doc);
    doc.save(this.buildAbonadosModalExportName('pdf'));
  }

  exportarAbonadosModalCsv(): void {
    if (!this.abonadosFiltrados.length) return;

    const csv = [
      [this.txtModal],
      ['Filtro aplicado', this.abonadosDetalleFiltro || 'Sin filtro'],
      [],
      ['Cuenta', 'Cliente', 'Cedula', 'Telefono', 'Direccion', 'Categoria'],
      ...this.abonadosFiltrados.map((abonado: any) => [
        abonado?.idabonado ?? '',
        this.getAbonadoNombre(abonado),
        this.getAbonadoCedula(abonado),
        this.getAbonadoTelefono(abonado),
        abonado?.direccionubicacion ?? '',
        this.getAbonadoCategoria(abonado),
      ]),
    ]
      .map((row) => row.map((cell: any) => this.csvEscape(cell)).join(','))
      .join('\r\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = this.buildAbonadosModalExportName('csv');
    a.click();
    window.URL.revokeObjectURL(url);
  }

  get abonadosFiltrados(): any[] {
    const lista = Array.isArray(this.abonados) ? this.abonados : [];
    const filtro = (this.abonadosDetalleFiltro ?? '').trim().toLowerCase();
    if (!filtro) return lista;

    return lista.filter((abonado: any) => {
      const valores = [
        abonado?.idabonado,
        abonado?.idresponsable?.nombre,
        abonado?.idcliente_clientes?.nombre,
        abonado?.idcategoria_categorias?.descripcion,
        abonado?.direccionubicacion,
        abonado?.email,
        abonado?.telefono,
        abonado?.idresponsable?.telefono,
        abonado?.idresponsable?.cedula,
      ];
      return valores.some((valor) => String(valor ?? '').toLowerCase().includes(filtro));
    });
  }

  get abonadosDetalleTotal(): number {
    return this.abonadosFiltrados.length;
  }

  get abonadosDetalleTotalPages(): number {
    return this.abonadosDetalleTotal > 0 ? Math.ceil(this.abonadosDetalleTotal / this.abonadosDetalleSize) : 1;
  }

  get abonadosDetallePageItems(): any[] {
    const inicio = this.abonadosDetallePage * this.abonadosDetalleSize;
    return this.abonadosFiltrados.slice(inicio, inicio + this.abonadosDetalleSize);
  }

  get abonadosDetalleDesde(): number {
    if (!this.abonadosDetalleTotal) return 0;
    return this.abonadosDetallePage * this.abonadosDetalleSize + 1;
  }

  get abonadosDetalleHasta(): number {
    if (!this.abonadosDetalleTotal) return 0;
    return Math.min((this.abonadosDetallePage + 1) * this.abonadosDetalleSize, this.abonadosDetalleTotal);
  }

  onAbonadosDetalleFiltroChange(): void {
    this.abonadosDetallePage = 0;
  }

  onAbonadosDetalleSizeChange(): void {
    this.abonadosDetallePage = 0;
  }

  onAbonadosDetallePrev(): void {
    if (this.abonadosDetallePage > 0) this.abonadosDetallePage -= 1;
  }

  onAbonadosDetalleNext(): void {
    if (this.abonadosDetallePage + 1 < this.abonadosDetalleTotalPages) {
      this.abonadosDetallePage += 1;
    }
  }

  private cumpleFiltroFechaConvenio(fecha: any): boolean {
    const fechaConvenio = this.toDate(fecha);
    const fechaDesde = this.normalizarFecha(this.conveniosFechaDesde);
    const fechaHasta = this.normalizarFecha(this.conveniosFechaHasta, true);

    if (!fechaDesde && !fechaHasta) return true;
    if (!fechaConvenio) return false;
    if (fechaDesde && fechaConvenio < fechaDesde) return false;
    if (fechaHasta && fechaConvenio > fechaHasta) return false;
    return true;
  }

  private toInputDate(fecha: Date): string {
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day = String(fecha.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private toDate(fecha: any): Date | null {
    if (!fecha) return null;
    if (fecha instanceof Date) return fecha;

    const date = new Date(fecha);
    if (!Number.isNaN(date.getTime())) return date;

    if (typeof fecha === 'string' && fecha.includes('/')) {
      const [dd, mm, yyyy] = fecha.split('/').map(Number);
      if (dd && mm && yyyy) return new Date(yyyy, mm - 1, dd);
    }

    return null;
  }

  private normalizarFecha(valor: any, finDelDia: boolean = false): Date | null {
    const fecha = this.toDate(valor);
    if (!fecha) return null;

    const normalizada = new Date(fecha);
    if (finDelDia) normalizada.setHours(23, 59, 59, 999);
    else normalizada.setHours(0, 0, 0, 0);
    return normalizada;
  }

  formatFecha(fecha: any): string {
    const value = this.toDate(fecha);
    return value ? value.toLocaleDateString('es-ES') : '';
  }

  private getRangoConveniosTexto(): string {
    const desde = this.conveniosFechaDesde ? this.formatFecha(this.conveniosFechaDesde) : 'sin límite';
    const hasta = this.conveniosFechaHasta ? this.formatFecha(this.conveniosFechaHasta) : 'sin límite';
    return `${desde} al ${hasta}`;
  }

  private buildConveniosExportName(extension: 'pdf' | 'xlsx' | 'csv'): string {
    const desde = this.conveniosFechaDesde || 'sin_desde';
    const hasta = this.conveniosFechaHasta || 'sin_hasta';
    return `estadisticas_convenios_${desde}_${hasta}.${extension}`;
  }

  private buildCarteraVencidaExportName(extension: 'pdf' | 'xlsx' | 'csv'): string {
    const fecha = this.carteraVencidaFecha || this.toInputDate(this.hoy);
    return `cartera_vencida_${fecha}.${extension}`;
  }

  private buildAbonadosModalExportName(extension: 'pdf' | 'xlsx' | 'csv'): string {
    const base = this.txtModal
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
    return `${base || 'abonados_detalle'}.${extension}`;
  }

  private getCarteraValor(item: any): number {
    return Number(item?.valor ?? item?.total ?? item?.totalFactura ?? 0);
  }

  private buildCarteraClienteKey(item: any): string {
    const idcliente = Number(item?.idcliente ?? 0);
    if (idcliente > 0) {
      return `cli:${idcliente}`;
    }

    const cuenta = Number(item?.cuenta ?? 0);
    if (cuenta > 0) {
      return `cta:${cuenta}`;
    }

    const cedula = String(item?.cedula ?? '').trim();
    if (cedula) {
      return `ced:${cedula}`;
    }

    const nombre = String(item?.nombre ?? '').trim().toLowerCase();
    return nombre ? `nom:${nombre}` : '';
  }

  formatoMoneda(valor: number): string {
    return `$${Number(valor || 0).toFixed(2)}`;
  }

  private calcularValoresConvenio(convenio: any): { recaudado: number; pendiente: number } {
    const totalConvenio = Number(convenio?.totalconvenio ?? 0);
    const estadoConvenio = Number(convenio?.estado ?? -1);
    const cuotas = Math.max(Number(convenio?.cuotas ?? 0), 0);
    const facPagadas = Math.max(Number(convenio?.facpagadas ?? 0), 0);

    if (totalConvenio <= 0) {
      return { recaudado: 0, pendiente: 0 };
    }

    if (estadoConvenio === 3) {
      return { recaudado: totalConvenio, pendiente: 0 };
    }

    const cuotainicial = Math.max(Number(convenio?.cuotainicial ?? 0), 0);
    const pagomensual = Math.max(Number(convenio?.pagomensual ?? 0), 0);
    const cuotafinal = Math.max(Number(convenio?.cuotafinal ?? 0), 0);

    const valoresCuotas: number[] = [];

    if (cuotainicial > 0) {
      valoresCuotas.push(cuotainicial);
    }

    if (cuotas > 0) {
      for (let i = 0; i < cuotas; i++) {
        const esUltima = i === cuotas - 1;
        valoresCuotas.push(esUltima ? (cuotafinal || pagomensual) : pagomensual);
      }
    }

    let recaudado = 0;
    for (let i = 0; i < Math.min(facPagadas, valoresCuotas.length); i++) {
      recaudado += Number(valoresCuotas[i] ?? 0);
    }

    if (recaudado <= 0 && facPagadas > 0) {
      recaudado = totalConvenio;
    }

    recaudado = Math.min(recaudado, totalConvenio);
    const pendiente = Math.max(totalConvenio - recaudado, 0);

    return { recaudado, pendiente };
  }

  getEstadoConvenioLabel(estado: any): string {
    switch (Number(estado)) {
      case 1:
        return 'Activo';
      case 2:
        return 'Anulado';
      case 3:
        return 'Pagado';
      case 0:
        return 'Eliminado';
      default:
        return String(estado ?? '');
    }
  }

  getAbonadoNombre(abonado: any): string {
    return abonado?.idresponsable?.nombre
      || abonado?.idcliente_clientes?.nombre
      || abonado?.nombre
      || abonado?.responsable
      || 'S/N';
  }

  getAbonadoCedula(abonado: any): string {
    return abonado?.idresponsable?.cedula
      || abonado?.idcliente_clientes?.cedula
      || abonado?.cedula
      || abonado?.identificacion
      || '-';
  }

  getAbonadoTelefono(abonado: any): string {
    return abonado?.idresponsable?.telefono
      || abonado?.idcliente_clientes?.telefono
      || abonado?.telefono
      || abonado?.celular
      || '-';
  }

  getAbonadoCategoria(abonado: any): string {
    return abonado?.idcategoria_categorias?.descripcion || abonado?.categoria || 'S/C';
  }

  private async enriquecerAbonadosDetalle(lista: any[]): Promise<any[]> {
    const detalle = await Promise.all(
      lista.map(async (abonado: any) => {
        const cuenta = Number(abonado?.idabonado ?? 0);
        if (!cuenta) return abonado;

        try {
          const completo = await firstValueFrom(this.s_abonados.getById(cuenta));
          return {
            ...abonado,
            ...completo,
            idabonado: completo?.idabonado ?? abonado?.idabonado,
            idresponsable: completo?.idresponsable ?? abonado?.idresponsable,
            idcliente_clientes: completo?.idcliente_clientes ?? abonado?.idcliente_clientes,
            idcategoria_categorias: completo?.idcategoria_categorias ?? abonado?.idcategoria_categorias,
            direccionubicacion: completo?.direccionubicacion ?? abonado?.direccionubicacion,
          };
        } catch (error) {
          console.error('No se pudo enriquecer abonado', cuenta, error);
          return abonado;
        }
      })
    );

    return detalle;
  }

  private getCarteraClienteNombre(cliente: any): string {
    return cliente?.nombre || cliente?.razonsocial || 'S/N';
  }

  private getCarteraClienteCuenta(cliente: any): string {
    return String(cliente?.cuenta ?? cliente?.idabonado ?? 'S/D');
  }

  private getCarteraClienteFactura(cliente: any): string {
    return String(cliente?.factura ?? cliente?.planilla ?? cliente?.idfactura ?? 'S/D');
  }

  private getCarteraClienteModulo(cliente: any): string {
    return String(cliente?.modulo ?? 'S/D');
  }

  private getCarteraClienteCedula(cliente: any): string {
    return cliente?.cedula || cliente?.identificacion || 'S/D';
  }

  private getCarteraClienteDireccion(cliente: any): string {
    return cliente?.direccion || cliente?.direccionubicacion || 'S/D';
  }

  private getCarteraClienteTelefono(cliente: any): string {
    return cliente?.telefono || cliente?.celular || 'S/D';
  }

  private getCarteraClienteEmail(cliente: any): string {
    return cliente?.email || 'S/D';
  }

  private resolverIdCategoria(categoria: any): number {
    const directo = Number(categoria?.idcategoria ?? categoria?.id_categoria ?? categoria?.categoria ?? 0);
    if (directo) return directo;

    const descripcion = String(categoria?.descripcion ?? '').trim().toLowerCase();
    if (!descripcion) return 0;

    const encontrada = (this.categoriasCatalogo || []).find((item: any) =>
      String(item?.descripcion ?? '').trim().toLowerCase() === descripcion
    );

    return Number(encontrada?.idcategoria ?? 0);
  }

  private csvEscape(value: any): string {
    const text = String(value ?? '');
    if (text.includes(',') || text.includes('"') || text.includes('\n')) {
      return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
  }
}
