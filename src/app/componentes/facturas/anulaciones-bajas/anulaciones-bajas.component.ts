import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { RecaudacionReportsService } from '../../recaudacion/recaudacion-reports.service';
import { LecturasService } from 'src/app/servicios/lecturas.service';
import { ColoresService } from 'src/app/compartida/colores.service';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { Router } from '@angular/router';
import { FacturaService } from 'src/app/servicios/factura.service';
import { Clientes } from 'src/app/modelos/clientes';
import { AbonadosService } from 'src/app/servicios/abonados.service';
import { Abonados } from 'src/app/modelos/abonados';
import { Facturas } from 'src/app/modelos/facturas.model';
import { FacturamodificacionesService } from '../../../servicios/facturamodificaciones.service';
import { Facturamodificaciones } from 'src/app/modelos/facturamodificaciones.model';
import { Lecturas } from 'src/app/modelos/lecturas.model';
import { PdfService } from 'src/app/servicios/pdf.service';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { RubroxfacService } from 'src/app/servicios/rubroxfac.service';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

declare const $: any;

@Component({
  selector: 'app-anulaciones-bajas',
  templateUrl: './anulaciones-bajas.component.html',
  styleUrls: ['./anulaciones-bajas.component.css'],
})
export class AnulacionesBajasComponent implements OnInit {
  formBuscar: FormGroup;
  formFiltrosHistorico: FormGroup;
  f_factura: FormGroup;
  f_reportes: FormGroup;
  today: number = Date.now();
  campo: number = 0; //0:Ninguno, 1:Planilla,  2:Abonado
  date: Date = new Date();
  swbuscando: boolean;
  swbusca: boolean;
  filtro: string;
  mfiltrar: string;
  txtbuscar: string = 'Buscar';
  _facturas: any;

  _fAnuladas: any;
  _fEliminadas: any;
  _fAnuladasBase: any[] = [];
  _fEliminadasBase: any[] = [];
  anuladasFiltradas: any[] = [];
  eliminadasFiltradas: any[] = [];
  c_limit: number = 10;
  pageSize: number = 10;
  readonly pageSizeOptions: number[] = [10, 20, 50];
  anuladasCurrentPage: number = 1;
  anuladasTotalPages: number = 1;
  anuladasTotalElements: number = 0;
  eliminadasCurrentPage: number = 1;
  eliminadasTotalPages: number = 1;
  eliminadasTotalElements: number = 0;
  sortAnuladasColumn: string = 'fechaanulacion';
  sortAnuladasDirection: 'asc' | 'desc' = 'desc';
  sortEliminadasColumn: string = 'fechaeliminacion';
  sortEliminadasDirection: 'asc' | 'desc' = 'desc';
  txttitulo: string = 'Anulacion';
  swtitulo: boolean = true;
  //detalles factura
  _rubrosxfac: any;
  totfac: number;
  idfactura: number = 0;
  /* buscar cliente */
  _cliente: Clientes = new Clientes();
  nombreCliente: String;
  option = '0';
  textodato: string;
  mensajeBusqueda: string = '';
  /* SELECCIONAR FACTURA */
  _factura: Facturas = new Facturas();
  _fac: any;
  /* SELECCIONAR LECTURA */
  _lectura: Lecturas = new Lecturas();
  detalleOperacion: any = null;
  procesandoAccion: boolean = false;
  sliceDate: string = new Date().toISOString().slice(0, 10);
  userAuth: number;
  selectedFragment: string = 'formNew';
  size: string = 'sm';
  private readonly historicoStateKey = 'anulaciones-bajas-historico-state';

  constructor(
    private facServicio: FacturaService,
    private router: Router,
    private fb: FormBuilder,
    public authService: AutorizaService,
    private coloresService: ColoresService,
    private lecService: LecturasService,
    private s_pdfRecaudacion: RecaudacionReportsService,
    private s_abonados: AbonadosService,
    private s_facmodificaciones: FacturamodificacionesService,
    private s_factura: FacturaService,
    private s_lectura: LecturasService,
    private s_pdf: PdfService,
    private s_rubroxfac: RubroxfacService
  ) {}

  ngOnInit(): void {
    sessionStorage.setItem('ventana', '/anulaciones-bajas');
    let coloresJSON = sessionStorage.getItem('/anulaciones-bajas');
    if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));
    else this.buscaColor();
    const fecha = new Date();
    const anio = fecha.getFullYear();
    this.formBuscar = this.fb.group({
      idfactura: '',
      idabonado: '',
      fechaDesde: anio + '-01-01',
      fechaHasta: this.sliceDate,
    });
    this.formFiltrosHistorico = this.fb.group({
      cuenta: '',
      cliente: '',
      fechaDesde: anio + '-01-01',
      fechaHasta: this.sliceDate,
    });
    this.restaurarEstadoHistorico();
    this.userAuth = this.authService.idusuario;
    this.f_factura = this.fb.group({
      usuarioanulacion: '',
      razonanulacion: '',
      usuarioeliminacion: '',
      razoneliminacion: '',
    });
    this.f_reportes = this.fb.group({
      opt: '0',
      desde: this.sliceDate,
      hasta: this.sliceDate,
    });
    if (sessionStorage.getItem('idplanillas') != null) {
      this.formBuscar.controls['idfactura'].setValue(
        sessionStorage.getItem('idplanillas')
      );
      this.campo = 1;
      this.buscar();
    }
    if (sessionStorage.getItem('idabonadoPlanillas') != null) {
      this.formBuscar.patchValue({
        idabonado: sessionStorage.getItem('idabonadoPlanillas'),
        fechaDesde: sessionStorage.getItem('fechaDesdePlanillas'),
        fechaHasta: sessionStorage.getItem('fechaHastaPlanillas'),
      });
      this.campo = 2;
      this.buscar();
    }
    this.anuladasCurrentPage = 1;
    this.eliminadasCurrentPage = 1;
    this.cargarHistoricos();
  }
  setValor() {
    this.guardarEstadoHistorico();
    this.cargarHistoricos();
  }

  private restaurarEstadoHistorico(): void {
    const stateJson = sessionStorage.getItem(this.historicoStateKey);
    if (!stateJson) {
      return;
    }

    try {
      const state = JSON.parse(stateJson);
      this.formFiltrosHistorico.patchValue({
        cuenta: state?.cuenta ?? '',
        cliente: state?.cliente ?? '',
        fechaDesde: state?.fechaDesde ?? this.formFiltrosHistorico.value.fechaDesde,
        fechaHasta: state?.fechaHasta ?? this.formFiltrosHistorico.value.fechaHasta,
      });
      this.pageSize = this.pageSizeOptions.includes(state?.pageSize)
        ? state.pageSize
        : this.pageSize;
      this.anuladasCurrentPage = Number(state?.anuladasCurrentPage) || 1;
      this.eliminadasCurrentPage = Number(state?.eliminadasCurrentPage) || 1;
      this.sortAnuladasColumn = state?.sortAnuladasColumn || this.sortAnuladasColumn;
      this.sortAnuladasDirection =
        state?.sortAnuladasDirection === 'asc' || state?.sortAnuladasDirection === 'desc'
          ? state.sortAnuladasDirection
          : this.sortAnuladasDirection;
      this.sortEliminadasColumn =
        state?.sortEliminadasColumn || this.sortEliminadasColumn;
      this.sortEliminadasDirection =
        state?.sortEliminadasDirection === 'asc' ||
        state?.sortEliminadasDirection === 'desc'
          ? state.sortEliminadasDirection
          : this.sortEliminadasDirection;
    } catch (error) {
      sessionStorage.removeItem(this.historicoStateKey);
    }
  }

  private guardarEstadoHistorico(): void {
    const state = {
      ...this.formFiltrosHistorico.value,
      pageSize: this.pageSize,
      anuladasCurrentPage: this.anuladasCurrentPage,
      eliminadasCurrentPage: this.eliminadasCurrentPage,
      sortAnuladasColumn: this.sortAnuladasColumn,
      sortAnuladasDirection: this.sortAnuladasDirection,
      sortEliminadasColumn: this.sortEliminadasColumn,
      sortEliminadasDirection: this.sortEliminadasDirection,
    };
    sessionStorage.setItem(this.historicoStateKey, JSON.stringify(state));
  }

  getFragmentToShow(opt: string) {
    if (opt === 'cliente') {
      this.size = 'lg';
      this.txttitulo = 'BUSCAR CLIENTE';
    }
    if (opt === 'facturas') {
      this.size = 'xl';
      this.txttitulo = 'SELECCIONAR FACTURA';
    }
    if (opt === 'formNew') {
      this.size = this.textodato ? 'lg' : 'sm';
      if (this.option === '0') {
        this.txttitulo = 'Nueva Anulacion';
        this.swtitulo = true;
      }

      if (this.option === '1') {
        this.txttitulo = 'Nueva Eliminacion';
        this.swtitulo = false;
        //this.option = '1';
      }
    }
    this.selectedFragment = opt;
  }
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
      const datos = await this.coloresService.setcolor(
        this.authService.idusuario,
        'facturas'
      );
      const coloresJSON = JSON.stringify(datos);
      sessionStorage.setItem('/facturas', coloresJSON);
      this.colocaColor(datos);
    } catch (error) {
      console.error(error);
    }
  }
  buscar() {
    this.swbuscando = true;
    this.mensajeBusqueda = '';
    this._facturas = [];
    this.textodato = '';
    if (this.formBuscar.value.idfactura != '') {
      this.getFacCobrada();
    }
    if (this.formBuscar.value.idabonado != '') {
      this.getClienteByAbonado();
    }
    if (
      this.formBuscar.value.idabonado === '' &&
      this.formBuscar.value.idfactura === ''
    ) {
      if (!this._cliente?.idcliente) {
        this.swbuscando = false;
        this.mensajeBusqueda = 'Selecciona un cliente para consultar sus facturas.';
        return;
      }
      if (this.option === '0') {
        this.getFacCobradas();
      }
      if (this.option === '1') {
        this.getFacSinCobro();
      }
    }
    this.getFragmentToShow('facturas');
  }
  changeIdfactura() {
    this.formBuscar.controls['idabonado'].setValue('');
    if (!this.formBuscar.value.idfactura) this.campo = 0;
    else {
      this.campo = 1;
      this._facturas = null;
      this._cliente = new Clientes();
    }
  }

  changeIdabonado() {
    this.formBuscar.controls['idfactura'].setValue('');
    if (!this.formBuscar.value.idabonado) this.campo = 0;
    else {
      this.campo = 2;
      this._facturas = null;
      this._cliente = new Clientes();
    }
  }

  changeTitulo(e: any) {
    this.option = e.target.value;
    if (e.target.value === '0') {
      this.txttitulo = 'Nueva Anulacion';
      this.swtitulo = true;
      this.textodato = '';
    }

    if (e.target.value === '1') {
      this.txttitulo = 'Nueva Eliminacion';
      this.swtitulo = false;
      //this.option = '1';
      this.textodato = '';
    }
  }
  getAllFacAnuladas(limit: number) {
    this.facServicio.findAnulaciones(limit).subscribe({
      next: (datos: any) => {
        this._fAnuladas = datos;
      },
      error: (e) => console.error(e),
    });
  }
  getAllFacEliminadas(limit: number) {
    this.facServicio.findEliminadas(limit).subscribe({
      next: (datos: any) => {
        this._fEliminadas = datos;
      },
      error: (e) => console.error(e),
    });
  }
  cargarHistoricos(): void {
    const desde = this.formFiltrosHistorico?.value?.fechaDesde;
    const hasta = this.formFiltrosHistorico?.value?.fechaHasta;

    if (desde && hasta) {
      forkJoin({
        anuladas: this.facServicio.getByFecAnulaciones(desde, hasta),
        eliminadas: this.facServicio.getByFecEliminacion(desde, hasta),
      }).subscribe({
        next: ({ anuladas, eliminadas }: any) => {
          this._fAnuladasBase = Array.isArray(anuladas) ? anuladas : [];
          this._fEliminadasBase = Array.isArray(eliminadas) ? eliminadas : [];
          this.aplicarFiltrosHistoricoLocal();
        },
        error: (e) => console.error(e),
      });
      return;
    }

    forkJoin({
      anuladas: this.facServicio.findAnulaciones(this.c_limit),
      eliminadas: this.facServicio.findEliminadas(this.c_limit),
    }).subscribe({
      next: ({ anuladas, eliminadas }: any) => {
        this._fAnuladasBase = Array.isArray(anuladas) ? anuladas : [];
        this._fEliminadasBase = Array.isArray(eliminadas) ? eliminadas : [];
        this.aplicarFiltrosHistoricoLocal();
      },
      error: (e) => console.error(e),
    });
  }

  filtrarHistoricos(): void {
    this.anuladasCurrentPage = 1;
    this.eliminadasCurrentPage = 1;
    this.guardarEstadoHistorico();
    this.cargarHistoricos();
  }

  limpiarFiltrosHistorico(): void {
    const fecha = new Date();
    const anio = fecha.getFullYear();
    this.anuladasCurrentPage = 1;
    this.eliminadasCurrentPage = 1;
    this.formFiltrosHistorico.patchValue({
      cuenta: '',
      cliente: '',
      fechaDesde: `${anio}-01-01`,
      fechaHasta: this.sliceDate,
    });
    this.guardarEstadoHistorico();
    this.cargarHistoricos();
  }

  private aplicarFiltrosHistoricoLocal(): void {
    const cuenta = `${this.formFiltrosHistorico?.value?.cuenta ?? ''}`.trim().toLowerCase();
    const cliente = `${this.formFiltrosHistorico?.value?.cliente ?? ''}`.trim().toLowerCase();

    this.anuladasFiltradas = this._fAnuladasBase.filter((item: any) =>
      this.coincideHistorico(item, cuenta, cliente)
    );
    this.eliminadasFiltradas = this._fEliminadasBase.filter((item: any) =>
      this.coincideHistorico(item, cuenta, cliente)
    );
    this.recalcularHistoricos();
  }

  private coincideHistorico(item: any, cuenta: string, cliente: string): boolean {
    const cuentaItem = `${this.getCuentaHistorico(item) ?? ''}`.toLowerCase();
    const clienteItem = `${this.getNombreClienteHistorico(item) ?? ''}`.toLowerCase();

    const coincideCuenta = !cuenta || cuentaItem.includes(cuenta);
    const coincideCliente = !cliente || clienteItem.includes(cliente);
    return coincideCuenta && coincideCliente;
  }

  toggleSort(tabla: 'anuladas' | 'eliminadas', columna: string): void {
    if (tabla === 'anuladas') {
      if (this.sortAnuladasColumn === columna) {
        this.sortAnuladasDirection =
          this.sortAnuladasDirection === 'asc' ? 'desc' : 'asc';
      } else {
        this.sortAnuladasColumn = columna;
        this.sortAnuladasDirection = 'asc';
      }
    } else {
      if (this.sortEliminadasColumn === columna) {
        this.sortEliminadasDirection =
          this.sortEliminadasDirection === 'asc' ? 'desc' : 'asc';
      } else {
        this.sortEliminadasColumn = columna;
        this.sortEliminadasDirection = 'asc';
      }
    }
    this.guardarEstadoHistorico();
    this.recalcularHistoricos();
  }

  getSortIcon(tabla: 'anuladas' | 'eliminadas', columna: string): string {
    const columnaActual =
      tabla === 'anuladas' ? this.sortAnuladasColumn : this.sortEliminadasColumn;
    const direccionActual =
      tabla === 'anuladas'
        ? this.sortAnuladasDirection
        : this.sortEliminadasDirection;

    if (columnaActual !== columna) {
      return 'fa fa-sort text-muted';
    }

    return direccionActual === 'asc' ? 'fa fa-sort-up' : 'fa fa-sort-down';
  }

  cambiarPagina(tabla: 'anuladas' | 'eliminadas', delta: number): void {
    if (tabla === 'anuladas') {
      const nuevaPagina = this.anuladasCurrentPage + delta;
      if (nuevaPagina >= 1 && nuevaPagina <= this.anuladasTotalPages) {
        this.anuladasCurrentPage = nuevaPagina;
        this.guardarEstadoHistorico();
        this.paginarAnuladas();
      }
      return;
    }

    const nuevaPagina = this.eliminadasCurrentPage + delta;
    if (nuevaPagina >= 1 && nuevaPagina <= this.eliminadasTotalPages) {
      this.eliminadasCurrentPage = nuevaPagina;
      this.guardarEstadoHistorico();
      this.paginarEliminadas();
    }
  }

  irPagina(tabla: 'anuladas' | 'eliminadas', pagina: number): void {
    if (tabla === 'anuladas') {
      this.anuladasCurrentPage = pagina;
      this.guardarEstadoHistorico();
      this.paginarAnuladas();
      return;
    }

    this.eliminadasCurrentPage = pagina;
    this.guardarEstadoHistorico();
    this.paginarEliminadas();
  }

  cambiarTamanoPagina(): void {
    this.anuladasCurrentPage = 1;
    this.eliminadasCurrentPage = 1;
    this.guardarEstadoHistorico();
    this.recalcularHistoricos();
  }

  paginasVisibles(tabla: 'anuladas' | 'eliminadas'): number[] {
    const totalPages =
      tabla === 'anuladas' ? this.anuladasTotalPages : this.eliminadasTotalPages;
    const currentPage =
      tabla === 'anuladas'
        ? this.anuladasCurrentPage
        : this.eliminadasCurrentPage;
    const inicio = Math.max(1, currentPage - 2);
    const fin = Math.min(totalPages, inicio + 4);
    const paginas: number[] = [];

    for (let pagina = inicio; pagina <= fin; pagina++) {
      paginas.push(pagina);
    }

    return paginas;
  }

  private recalcularHistoricos(): void {
    this.ordenarAnuladas();
    this.ordenarEliminadas();
    this.paginarAnuladas();
    this.paginarEliminadas();
  }

  private ordenarAnuladas(): void {
    const ordenadas = [...this.anuladasFiltradas];
    ordenadas.sort((a: any, b: any) =>
      this.compararValores(
        this.obtenerValorOrden(a, this.sortAnuladasColumn),
        this.obtenerValorOrden(b, this.sortAnuladasColumn),
        this.sortAnuladasDirection
      )
    );
    this.anuladasFiltradas = ordenadas;
    this.anuladasTotalElements = ordenadas.length;
    this.anuladasTotalPages = Math.max(
      1,
      Math.ceil(this.anuladasTotalElements / this.pageSize)
    );
    if (this.anuladasCurrentPage > this.anuladasTotalPages) {
      this.anuladasCurrentPage = this.anuladasTotalPages;
    }
  }

  private ordenarEliminadas(): void {
    const ordenadas = [...this.eliminadasFiltradas];
    ordenadas.sort((a: any, b: any) =>
      this.compararValores(
        this.obtenerValorOrden(a, this.sortEliminadasColumn),
        this.obtenerValorOrden(b, this.sortEliminadasColumn),
        this.sortEliminadasDirection
      )
    );
    this.eliminadasFiltradas = ordenadas;
    this.eliminadasTotalElements = ordenadas.length;
    this.eliminadasTotalPages = Math.max(
      1,
      Math.ceil(this.eliminadasTotalElements / this.pageSize)
    );
    if (this.eliminadasCurrentPage > this.eliminadasTotalPages) {
      this.eliminadasCurrentPage = this.eliminadasTotalPages;
    }
  }

  private paginarAnuladas(): void {
    const inicio = (this.anuladasCurrentPage - 1) * this.pageSize;
    this._fAnuladas = this.anuladasFiltradas.slice(inicio, inicio + this.pageSize);
  }

  private paginarEliminadas(): void {
    const inicio = (this.eliminadasCurrentPage - 1) * this.pageSize;
    this._fEliminadas = this.eliminadasFiltradas.slice(inicio, inicio + this.pageSize);
  }

  private obtenerValorOrden(item: any, columna: string): any {
    switch (columna) {
      case 'idfactura':
        return item?.idfactura;
      case 'fechaanulacion':
        return item?.fechaanulacion;
      case 'fechaeliminacion':
        return item?.fechaeliminacion;
      case 'nrofactura':
        return item?.nrofactura;
      case 'cliente':
        return this.getNombreClienteHistorico(item);
      case 'modulo':
        return this.getModuloHistorico(item);
      case 'cuenta':
        return this.getCuentaHistorico(item);
      case 'razonanulacion':
        return item?.razonanulacion;
      case 'razoneliminacion':
        return item?.razoneliminacion;
      default:
        return item?.[columna];
    }
  }

  getNombreClienteHistorico(item: any): string {
    return (
      item?.idcliente?.nombre ||
      item?.idcliente_clientes?.nombre ||
      item?.idabonado_abonados?.idcliente_clientes?.nombre ||
      item?.idabonado_abonados?.idresponsable?.nombre ||
      item?.idresponsable?.nombre ||
      item?.abonado?.idcliente_clientes?.nombre ||
      item?.cliente?.nombre ||
      ''
    );
  }

  getModuloHistorico(item: any): string {
    return (
      item?.idmodulo?.descripcion ||
      item?.idmodulo_modulos?.descripcion ||
      item?.idfactura?.idmodulo?.descripcion ||
      item?.idfactura_facturas?.idmodulo?.descripcion ||
      item?.modulo ||
      ''
    );
  }

  getCuentaHistorico(item: any): string | number {
    return (
      item?.idabonado ??
      item?.idabonado_abonados?.idabonado ??
      item?.abonado?.idabonado ??
      item?.idfactura?.idabonado ??
      item?.idfactura_facturas?.idabonado ??
      item?.cuenta ??
      ''
    );
  }

  private compararValores(
    valorA: any,
    valorB: any,
    direccion: 'asc' | 'desc'
  ): number {
    const a = this.normalizarValorOrden(valorA);
    const b = this.normalizarValorOrden(valorB);
    let resultado = 0;

    if (a < b) {
      resultado = -1;
    } else if (a > b) {
      resultado = 1;
    }

    return direccion === 'asc' ? resultado : -resultado;
  }

  private normalizarValorOrden(valor: any): any {
    if (valor === null || valor === undefined || valor === '') {
      return '';
    }

    if (typeof valor === 'number') {
      return valor;
    }

    const fecha = new Date(valor);
    if (!Number.isNaN(fecha.getTime())) {
      return fecha.getTime();
    }

    const numero = Number(valor);
    if (!Number.isNaN(numero) && `${valor}`.trim() !== '') {
      return numero;
    }

    return `${valor}`.toLowerCase();
  }
  setCliente(e: any) {
    this.formBuscar.patchValue({
      idfactura: '',
      idabonado: '',
    });
    this.campo = 1;
    this.textodato = '';
    this.mensajeBusqueda = '';
    this._cliente = e;
    this.selectedFragment = 'facturas';
    this.size = 'xl';
    this.swbuscando = true;
    this._facturas = [];

    if (this.option === '0') {
      this.getFacCobradas();
    } else {
      this.getFacSinCobro();
    }
    /*    this.f_tramites.patchValue({
      idcliente_clientes: e,
    }); */
  }

  private facturaTieneRelacionesCompletas(factura: any): boolean {
    return !!factura?.idcliente?.nombre && !!factura?.idmodulo?.descripcion;
  }

  private normalizarFactura(factura: any, detalle?: any): any {
    const base = detalle || factura || {};
    return {
      ...factura,
      ...detalle,
      idcliente: base?.idcliente || factura?.idcliente || null,
      idmodulo: base?.idmodulo || factura?.idmodulo || null,
    };
  }

  private hidratarFacturasBusqueda(facturas: any[]): void {
    const lista = Array.isArray(facturas) ? facturas : [];
    if (!lista.length) {
      this._facturas = [];
      this.swbuscando = false;
      this.mensajeBusqueda =
        this.option === '0'
          ? 'El cliente no tiene facturas cobradas para anular.'
          : 'El cliente no tiene facturas pendientes de pago para eliminar.';
      return;
    }

    const solicitudes = lista.map((factura: any) => {
      if (this.facturaTieneRelacionesCompletas(factura)) {
        return of(this.normalizarFactura(factura));
      }

      return this.facServicio.getById(factura.idfactura).pipe(
        map((detalle: any) => this.normalizarFactura(factura, detalle)),
        catchError(() => of(this.normalizarFactura(factura)))
      );
    });

    forkJoin(solicitudes).subscribe({
      next: (facturasHidratadas: any[]) => {
        this._facturas = facturasHidratadas;
        this.swbuscando = false;
        this.mensajeBusqueda = '';
        this.getFragmentToShow('facturas');
      },
      error: (e) => {
        console.error(e);
        this._facturas = lista;
        this.swbuscando = false;
        this.mensajeBusqueda = 'Se recuperaron facturas con datos parciales.';
        this.getFragmentToShow('facturas');
      },
    });
  }

  getFacCobradas() {
    this.facServicio.findCobradas(this._cliente.idcliente).subscribe({
      next: (datos: any) => {
        this.hidratarFacturasBusqueda(datos);
      },
      error: (e) => {
        this.swbuscando = false;
        this.mensajeBusqueda = 'No fue posible consultar las facturas cobradas.';
        console.error(e);
      },
    });
  }
  getFacSinCobro() {
    this.facServicio.getSinCobro(this._cliente.idcliente).subscribe({
      next: (datos: any) => {
        this.hidratarFacturasBusqueda(datos);
      },
      error: (e) => {
        this.swbuscando = false;
        this.mensajeBusqueda =
          'No fue posible consultar las facturas pendientes de pago.';
        console.error(e);
      },
    });
  }
  getFacCobrada() {
    this.facServicio.getById(this.formBuscar.value.idfactura).subscribe({
      next: (datos: any) => {
        this._cliente = datos.idcliente;
        this.getFragmentToShow('facturas');
        if (this.option === '0') {
          if (datos.fechaeliminacion === null && datos.pagado === 1) {
            this.hidratarFacturasBusqueda([datos]);
            return;
          }
          this._facturas = [];
          this.swbuscando = false;
          this.mensajeBusqueda = 'La factura consultada no está cobrada o ya fue eliminada.';
        }
        if (this.option === '1') {
          if (datos.fechaeliminacion === null && datos.pagado === 0) {
            this.hidratarFacturasBusqueda([datos]);
            return;
          }
          this._facturas = [];
          this.swbuscando = false;
          this.mensajeBusqueda =
            'La factura consultada no está pendiente de pago o ya fue eliminada.';
        }
      },
      error: (e) => {
        this.swbuscando = false;
        this._facturas = [];
        this.mensajeBusqueda = 'No se encontró la factura consultada.';
        console.error(e);
      },
    });
  }
  getClienteByAbonado() {
    this.s_abonados.getByIdabonado(this.formBuscar.value.idabonado).subscribe({
      next: (datos: any) => {
        this._cliente = Array.isArray(datos) && datos.length ? datos[0].idcliente_clientes : null;
        if (!this._cliente?.idcliente) {
          this._facturas = [];
          this.swbuscando = false;
          this.mensajeBusqueda = 'No se encontró un cliente asociado al abonado consultado.';
          return;
        }
        if (this.option === '0') {
          this.getFacCobradas();
        }
        if (this.option === '1') {
          this.getFacSinCobro();
        }
      },
      error: (e) => {
        this.swbuscando = false;
        this._facturas = [];
        this.mensajeBusqueda = 'No se encontró el abonado consultado.';
        console.error(e);
      },
    });
  }
  setFactura(factura: any) {
    if (factura.nrofactura != null) {
      this.textodato = factura.nrofactura;
    } else {
      this.textodato = factura.idfactura;
    }
    this._fac = JSON.stringify(factura);
    this._factura = factura;
    this.detalleOperacion = null;
    this.facServicio.getDetalleAnulacionBaja(factura.idfactura).subscribe({
      next: (detalle: any) => {
        this.detalleOperacion = detalle;
        this._lectura =
          Array.isArray(detalle?.lecturas) && detalle.lecturas.length > 0
            ? detalle.lecturas[0]
            : new Lecturas();
        this.size = 'lg';
      },
      error: (e) => console.error(e),
    });
    this.getFragmentToShow('formNew');
  }
  buscarCliente() {}

  get motivoActual(): string {
    return this.option === '0'
      ? this.f_factura?.value?.razonanulacion ?? ''
      : this.f_factura?.value?.razoneliminacion ?? '';
  }

  abrirNuevoModal(): void {
    const fechaDesdeActual = this.formBuscar?.value?.fechaDesde ?? '';
    const fechaHastaActual = this.formBuscar?.value?.fechaHasta ?? this.sliceDate;

    this.f_factura.reset({
      usuarioanulacion: '',
      razonanulacion: '',
      usuarioeliminacion: '',
      razoneliminacion: '',
    });
    this.formBuscar.reset({
      idfactura: '',
      idabonado: '',
      fechaDesde: fechaDesdeActual,
      fechaHasta: fechaHastaActual,
    });
    this._facturas = [];
    this._cliente = new Clientes();
    this._factura = new Facturas();
    this._lectura = new Lecturas();
    this.detalleOperacion = null;
    this._fac = null;
    this.textodato = '';
    this.mensajeBusqueda = '';
    this.campo = 0;
    this.filtro = '';
    this.mfiltrar = '';
    this.swbuscando = false;
    this.getFragmentToShow('formNew');
  }

  get puedeGuardar(): boolean {
    return (
      this.campo !== 0 &&
      !!this.textodato &&
      !!this._factura?.idfactura &&
      this.motivoActual.trim().length >= 5 &&
      !this.procesandoAccion
    );
  }

  get estadoFecFacturaTexto(): string {
    const estado = this.detalleOperacion?.fecFactura?.estado;
    const estados: Record<string, string> = {
      I: 'Inicial',
      P: 'Proceso',
      G: 'Generado',
      L: 'Error al validar',
      M: 'Error al firmar',
      C: 'Devuelta',
      U: 'Error al autorizar',
      A: 'Autorizado / enviado',
      O: 'Autorizado / no enviado',
      E: 'Datos incompletos',
    };
    return estado ? `${estado} - ${estados[estado] || 'Estado no mapeado'}` : 'Sin registro';
  }

  private resetFormularioAccion(): void {
    this.f_factura.reset();
    this.formBuscar.reset();
    this._cliente = new Clientes();
    this._factura = new Facturas();
    this._lectura = new Lecturas();
    this.detalleOperacion = null;
    this.textodato = '';
    this.mensajeBusqueda = '';
    this.campo = 0;
    this.swbuscando = false;
  }

  actualizar() {
    if (!this.puedeGuardar) {
      return;
    }

    const accion = this.option === '0' ? 'ANULACION' : 'ELIMINACION';
    const motivo = this.motivoActual.trim();
    this.procesandoAccion = true;

    this.s_factura
      .ejecutarAnulacionBaja({
        idfactura: this._factura.idfactura,
        accion,
        motivo,
        idusuario: this.authService.idusuario,
      })
      .subscribe({
        next: () => {
          if (accion === 'ANULACION') {
            let fmodi: Facturamodificaciones = new Facturamodificaciones();
            fmodi.datosfactura = this._fac;
            fmodi.fechacrea = new Date();
            fmodi.detalle = motivo;
            fmodi.idfactura = this._factura.idfactura;
            this.s_facmodificaciones.saveFacturacionModificaciones(fmodi).subscribe({
              next: () => {
                this.resetFormularioAccion();
                this.cargarHistoricos();
                $('#newAnulBajas').modal('hide');
                this.procesandoAccion = false;
              },
              error: (e) => {
                this.procesandoAccion = false;
                console.error(e);
              },
            });
            return;
          }

          this.resetFormularioAccion();
          this.cargarHistoricos();
          $('#newAnulBajas').modal('hide');
          this.procesandoAccion = false;
        },
        error: (e) => {
          this.procesandoAccion = false;
          console.error(e);
        },
      });
  }

  /* REPORTES  */

  /* REPORTE ELIMINACION */
  generarReport(idfactura: number) {
    let factura = this.s_factura.getById(idfactura).subscribe({
      next: (fact: any) => {
        factura = fact;
        this.s_rubroxfac.getByIdfactura(idfactura).subscribe({
          next: async (rubros: any) => {
            let cabeceraAbonado: any = {};
            let _rubros: any = [];
            let sumaRubros: number = 0;
            let cabeceraCliente: any = {
              nombreCliente: fact.idcliente.nombre,
              identificacion: fact.idcliente.cedula,
              direccion: fact.idcliente.direccion,
              fechaeliminacion: fact.fechaeliminacion,
              razoneliminacion: fact.razoneliminacion,
              modulo: fact.idmodulo.descripcion,
              planilla: fact.idfactura,
            };
            if (fact.idabonado != 0) {
              let abonado: any = await this.s_abonados
                .getByIdabonado(fact.idabonado)
                .toPromise();
              cabeceraAbonado = {
                cuenta: abonado[0].idabonado,
                responsablepago: abonado[0].idresponsable.nombre,
                identificacion: abonado[0].idresponsable.cedula,
                categoria: abonado[0].idcategoria_categorias.descripcion,
                direccion: abonado[0].direccionubicacion,
              };
            } else {
              cabeceraAbonado = null;
            }
            rubros.forEach((item: any) => {
              _rubros.push([
                item.idrubro_rubros.idrubro,
                item.idrubro_rubros.descripcion,
                item.cantidad,
                item.valorunitario.toFixed(2),
                (item.cantidad * item.valorunitario).toFixed(2),
              ]);
              sumaRubros += item.cantidad * item.valorunitario;
            });
            _rubros.push(['', 'TOTAL: ', '', '', sumaRubros.toFixed(2)]);
            this.reporteeliminacion(cabeceraCliente, cabeceraAbonado, _rubros);
          },
          error: (e: any) => console.error(e),
        });
        //
      },
      error: (e: any) => console.error(e),
    });
  }
  /* REPORTE DE BAJAS */
  reporte() {
    let opt = this.f_reportes.value.opt;
    let desde = this.f_reportes.value.desde;
    let hasta = this.f_reportes.value.hasta;
    switch (opt) {
      case '0':
        this.facServicio.findByFecAnuladas(desde, hasta).subscribe({
          next: (anulaciones: any) => {
            if (anulaciones.length > 0) {
              this.reporteanulaciones(anulaciones);
            }
          },
        });
        break;
      case '1':
        this.facServicio.findByFecEliminacion(desde, hasta).subscribe({
          next: (eliminaciones: any) => {
            if (eliminaciones.length > 0) {
              this.reporteBajas(eliminaciones);
            }
          },
          error: (e) => console.error(e),
        });
        break;
    }
  }

  reporteBajas(lbajas: any) {
    let doc = new jsPDF('p', 'pt', 'a4');
    let bajas: any[] = [];
    this.s_pdf.header(
      `Reporte de facturas dadas de baja: ${this.f_reportes.value.desde} - ${this.f_reportes.value.hasta}`,
      doc
    );
    lbajas.forEach((item: any) => {
      bajas.push([
        item.idfactura,
        item.modulo,
        item.nomusu,
        item.razoneliminacion,
        +item.total.toFixed(2),
      ]);
    });
    autoTable(doc, {
      head: [['Nro planilla', 'Modulo', 'Usu elimina', 'Razon', 'Total']],
      body: bajas,
    });
    const blobUrl  = doc.output('datauri');
    const pdfViewer: any = document.getElementById(
      'pdfViewer'
    ) as HTMLIFrameElement;
    pdfViewer.src = blobUrl ;
  }
  reporteanulaciones(lanulaciones: any) {
    let doc = new jsPDF('p', 'pt', 'a4');
    let anuladas: any[] = [];
    this.s_pdf.header(
      `Reporte de facturas anuladas: ${this.f_reportes.value.desde} - ${this.f_reportes.value.hasta}`,
      doc
    );
    lanulaciones.forEach((item: any) => {
      anuladas.push([
        item.idfactura,
        item.modulo,
        item.nomusu,
        item.razoneliminacion,
        +item.total.toFixed(2),
      ]);
    });
    autoTable(doc, {
      head: [['Nro planilla', 'Modulo', 'Usu anula', 'Razon', 'Total']],
      body: anuladas,
    });
    /*     this.s_pdf.header(
      `Reporte de facturas dadas de anuladas: ${this.f_reportes.value.desde} - ${this.f_reportes.value.hasta}`,
      doc
    ); */
    const blobUrl  = doc.output('datauri');
    const pdfViewer: any = document.getElementById(
      'pdfViewer'
    ) as HTMLIFrameElement;
    pdfViewer.src = blobUrl ;
  }
  reporteeliminacion(bodyCliente: any, bodyAbonado: any, bodyRubros: any) {
    let doc = new jsPDF();
    this.s_pdf.header(`FACTURA ELIMINADA ${bodyCliente.planilla}`, doc);
    let headRubros = [['Cod.', 'Nombre', 'Cantidad', 'V. unitario', 'Total']];
    autoTable(doc, {
      body: [
        [
          `Nombre Cliente: ${bodyCliente.nombreCliente}`,
          `Identificacion: ${bodyCliente.identificacion}`,
          ``,
        ],
        [
          {
            content: `Direccion: ${bodyCliente.direccion}`,
            colSpan: 3,
          },
        ],
        [
          `Fec. Eliminacion: ${bodyCliente.fechaeliminacion}`,
          ``,
          `Modulo: ${bodyCliente.modulo}`,
        ],
        [
          {
            content: `Razon eliminacion: ${bodyCliente.razoneliminacion}`,
            colSpan: 3,
          },
        ],
      ],
    });
    if (bodyAbonado != null) {
      autoTable(doc, {
        body: [
          [
            `Cuenta: ${bodyAbonado.cuenta}`,
            `Responsable pago: ${bodyAbonado.responsablepago}`,
            `Identificacion: ${bodyAbonado.identificacion}`,
          ],
          [`Categoria: ${bodyAbonado.categoria}`, ` `, ``],
          [{ content: `Direccion: ${bodyAbonado.direccion}`, colSpan: 3 }],
        ],
      });
    } else {
    }
    autoTable(doc, {
      head: headRubros,
      body: bodyRubros,
    });
    //btener la hora actual
    const horaImpresion = getDateTime();
    doc.setFontSize(10);

    // Agregar el pie de pagina
    doc.text(
      `Fecha y hora de impresion: ${horaImpresion}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );

    const blobUrl  = doc.output('datauri');
    const pdfViewer: any = document.getElementById(
      'pdfViewer'
    ) as HTMLIFrameElement;

    return (pdfViewer.src = blobUrl );
  }
}
function getDateTime() {
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

