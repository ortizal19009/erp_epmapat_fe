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
import { forkJoin } from 'rxjs';

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
  txttitulo: string = 'Anulación';
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
  /* SELECCIONAR FACTURA */
  _factura: Facturas = new Facturas();
  _fac: any;
  /* SELECCIONAR LECTURA */
  _lectura: Lecturas = new Lecturas();
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
    const año = fecha.getFullYear();
    this.formBuscar = this.fb.group({
      idfactura: '',
      idabonado: '',
      fechaDesde: año + '-01-01',
      fechaHasta: this.sliceDate,
    });
    this.formFiltrosHistorico = this.fb.group({
      cuenta: '',
      cliente: '',
      fechaDesde: año + '-01-01',
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
      this.size = 'sm';
      if (this.option === '0') {
        this.txttitulo = 'Nueva Anulación';
        this.swtitulo = true;
      }

      if (this.option === '1') {
        this.txttitulo = 'Nueva Eliminación';
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
      this.txttitulo = 'Nueva Anulación';
      this.swtitulo = true;
      this.textodato = '';
    }

    if (e.target.value === '1') {
      this.txttitulo = 'Nueva Eliminación';
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
    const año = fecha.getFullYear();
    this.anuladasCurrentPage = 1;
    this.eliminadasCurrentPage = 1;
    this.formFiltrosHistorico.patchValue({
      cuenta: '',
      cliente: '',
      fechaDesde: `${año}-01-01`,
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
    const cuentaItem = `${item?.idabonado ?? ''}`.toLowerCase();
    const clienteItem = `${item?.idcliente?.nombre ?? ''}`.toLowerCase();

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
        return item?.idcliente?.nombre;
      case 'modulo':
        return item?.idmodulo?.descripcion;
      case 'cuenta':
        return item?.idabonado;
      case 'razonanulacion':
        return item?.razonanulacion;
      case 'razoneliminacion':
        return item?.razoneliminacion;
      default:
        return item?.[columna];
    }
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
    this._cliente = e;
    this.selectedFragment = 'formNew';
    this.size = 'sm';
    /*    this.f_tramites.patchValue({
      idcliente_clientes: e,
    }); */
  }
  getFacCobradas() {
    this.facServicio.findCobradas(this._cliente.idcliente).subscribe({
      next: (datos: any) => {
        this._facturas = datos;
      },
      error: (e) => {
        console.error(e);
      },
    });
  }
  getFacSinCobro() {
    this.facServicio.getSinCobro(this._cliente.idcliente).subscribe({
      next: (datos: any) => {
        this._facturas = datos;
      },
      error: (e) => console.error(e),
    });
  }
  getFacCobrada() {
    this.facServicio.getById(this.formBuscar.value.idfactura).subscribe({
      next: (datos: any) => {
        this._cliente = datos.idcliente;
        if (this.option === '0') {
          if (datos.fechaeliminacion === null && datos.pagado === 1) {
            this._facturas = [datos];
          }
        }
        if (this.option === '1') {
          if (datos.fechaeliminacion === null && datos.pagado === 0) {
            this._facturas = [datos];
          }
        }
      },
      error: (e) => console.error(e),
    });
  }
  getClienteByAbonado() {
    this.s_abonados.getByIdabonado(this.formBuscar.value.idabonado).subscribe({
      next: (datos: any) => {
        this._cliente = datos[0].idcliente_clientes;
        if (this.option === '0') {
          this.getFacCobradas();
        }
        if (this.option === '1') {
          this.getFacSinCobro();
        }
      },
      error: (e) => console.error(e),
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
    if (
      this.option === '1' &&
      (factura.idmodulo.idmodulo === 3 || factura.idmodulo.idmodulo === 4) &&
      factura.idabonado > 0
    ) {
      this.s_lectura.getByIdfactura(factura.idfactura).subscribe({
        next: (d_lectura: any) => {
          this._lectura = d_lectura[0];
        },
      });
    }
    this.getFragmentToShow('formNew');
  }
  buscarCliente() {}

  actualizar() {
    let factura: any = this._factura;
    let formFactura = this.f_factura.value;
    let date: Date = new Date();
    switch (this.option) {
      case '0':
        factura.fechaanulacion = date;
        factura.nrofactura = null;
        factura.razonanulacion = formFactura.razonanulacion;
        factura.fechacobro = '';
        factura.pagado = 0;
        factura.usuariocobro = null;
        factura.usuarioanulacion = this.authService.idusuario;
        if (factura.formapago === 4) {
          factura.estado = 1;
          factura.formapago = 1;
        }
        if (factura.estadoconvenio === 1) {
          factura.estado = 2;
        }
        this.s_factura.updateFacturas(factura).subscribe({
          next: (facDato) => {
            let date: Date = new Date();
            let fmodi: Facturamodificaciones = new Facturamodificaciones();
            fmodi.datosfactura = this._fac;
            fmodi.fechacrea = date;
            fmodi.detalle = formFactura.razonanulacion;
            fmodi.idfactura = factura.idfactura;
            this.s_facmodificaciones
              .saveFacturacionModificaciones(fmodi)
                .subscribe({
                  next: (modiDatos) => {
                    this.f_factura.reset();
                    this.formBuscar.reset();
                    this._cliente = new Clientes();
                    this.cargarHistoricos();
                  },
                error: (e) => console.error(e),
              });
          },
          error: (e) => console.error(e),
        });
        break;
      case '1':
        factura.fechaeliminacion = date;
        factura.razoneliminacion = formFactura.razoneliminacion;
        factura.estado = 0;
        factura.usuarioeliminacion = this.authService.idusuario;
        this.s_factura.updateFacturas(factura).subscribe({
          next: (facDato) => {
            if (
              (factura.idmodulo.idmodulo === 3 ||
                factura.idmodulo.idmodulo === 4) &&
              factura.idabonado > 0
            ) {
              this._lectura.estado = 0;
              this._lectura.observaciones = formFactura.razoneliminacion;
              this.s_lectura
                .updateLectura(this._lectura.idlectura, this._lectura)
                .subscribe({
                  next: (d_lectura: any) => {
                    this.f_factura.reset();
                    this.formBuscar.reset();
                    this._cliente = new Clientes();
                    this.cargarHistoricos();
                  },
                });
            } else {
              this.f_factura.reset();
              this.formBuscar.reset();
              this._cliente = new Clientes();
              this.cargarHistoricos();
            }
          },
          error: (e) => console.error(e),
        });
        break;
    }
    this.textodato = '';
    //this.facServicio.updateFacturas()
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
      head: [['Nro planilla', 'Modulo', 'Usu elimina', 'Razón', 'Total']],
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
      head: [['Nro planilla', 'Modulo', 'Usu anula', 'Razón', 'Total']],
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
          `Identificación: ${bodyCliente.identificacion}`,
          ``,
        ],
        [
          {
            content: `Dirección: ${bodyCliente.direccion}`,
            colSpan: 3,
          },
        ],
        [
          `Fec. Eliminacion: ${bodyCliente.fechaeliminacion}`,
          ``,
          `Módulo: ${bodyCliente.modulo}`,
        ],
        [
          {
            content: `Razón eliminación: ${bodyCliente.razoneliminacion}`,
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
            `Identificación: ${bodyAbonado.identificacion}`,
          ],
          [`Categoria: ${bodyAbonado.categoria}`, ` `, ``],
          [{ content: `Dirección: ${bodyAbonado.direccion}`, colSpan: 3 }],
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

    // Agregar el pie de página
    doc.text(
      `Fecha y hora de impresión: ${horaImpresion}`,
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
