import {
  Component,
  ElementRef,
  HostListener,
  inject,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { firstValueFrom, isEmpty } from 'rxjs';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { AbonadosService } from 'src/app/servicios/abonados.service';
import { Recaudacion } from 'src/app/modelos/recaudacion.model';
import { ClientesService } from 'src/app/servicios/clientes.service';
import { FormacobroService } from 'src/app/servicios/formacobro.service';
import { LoadingService } from 'src/app/servicios/loading.service';
import { NtacreditoService } from 'src/app/servicios/ntacredito.service';
import { RecaudacionCobroService } from 'src/app/servicios/recaudacion-cobro.service';
import { Colores } from 'src/app/modelos/administracion/colores.model';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ColoresService } from 'src/app/compartida/colores.service';
import { JasperReportService, MergeItem } from 'src/app/servicios/jasper-report.service';
import { PrintBridgeService, PrintProfile } from 'src/app/servicios/print-bridge.service';
declare var bootstrap: any; // 👈 para usar la librería de Bootstrap JS

@Component({
  selector: 'app-add-recauda',
  templateUrl: './add-recauda.component.html',
  styleUrls: ['./add-recauda.component.css'],
})
export class AddRecaudaComponent implements OnInit {
  private recaCobroService = inject(RecaudacionCobroService);
  private jasperReportService = inject(JasperReportService);
  private aboService = inject(AbonadosService);
  private qzTrayService = inject(PrintBridgeService);
  filtrar: string;
  _sincobro: any[] = [];
  _cliente: any;
  _formasCobro: any;
  f_buscar: FormGroup;
  f_cobrar: FormGroup;
  formColores: FormGroup;
  nombre: string;
  swBuscar: Boolean = false;
  swImprimir: Boolean = false;
  swNotFound: Boolean = false;
  swcaja: boolean = false;
  totalapagar: number = 0;
  fencola: any[] = [];
  ultimasFacturasCobro: any[] = [];
  clientesLoading: boolean = false;
  clienteBusquedaTexto: string = '';
  clientesEncontrados: number = 0;
  clientesSinResultados: boolean = false;
  consultandoCartera: boolean = false;
  consultandoCarteraTexto: string = '';
  modalReimpresionFacturaId: string = '';
  previewPdfUrl: SafeResourceUrl | null = null;
  private previewPdfObjectUrl: string | null = null;
  previewFactura: any = null;
  previewLoading: boolean = false;
  imprimiendoFacturaId: number | null = null;
  imprimiendoCobroUnificado: boolean = false;
  imprimiendoPruebaImpresora: boolean = false;
  qzPrinterMode: 'auto' | 'tm-t88v' | 'manual' = 'auto';
  qzPrinterName: string = '';
  qzDefaultCopies: number = 2;
  qzSilentPrinting: boolean = true;
  qzPrintersAvailable: string[] = [];
  qzSettingsLoading: boolean = false;
  qzSettingsError: string = '';
  saldoNotaCredito: number = 0;
  tieneNotaCredito: boolean = false;
  mensajeNotaCredito: string = '';
  abrirCaja: any = {
    usuario: '',
    password: '',
    establecimiento: '',
    nrofactura: '',
  };
  _estadoCaja: any;
  idfactura: any;
  detalleFac: Boolean = false;
  addRubro: any[] = [];
  _clientes: any[] = [];
  ordenColumna: keyof SinCobrarVisual = 'idabonado';
  ordenAscendente: boolean = true;
  @ViewChild('pdfViewer') pdfViewer!: ElementRef<HTMLIFrameElement>;
  @ViewChild('consultaModal') consultaModal!: ElementRef;
  //_mensaje: any;
  constructor(
    private fb: FormBuilder,
    private s_cliente: ClientesService,
    private loadingService: LoadingService,
    private s_formacobro: FormacobroService,
    private s_ntacredito: NtacreditoService,
    private authService: AutorizaService,
    private sanitizer: DomSanitizer,
    private router: Router,
    private coloresService: ColoresService
  ) {}

  ngOnInit(): void {
    console.log(this.authService.sessionlog);
    /*     if (!this.authService.sessionlog) {
      this.router.navigate(['/inicio']);
    } */
    sessionStorage.setItem('ventana', '/abonados');
    let coloresJSON = sessionStorage.getItem('/abonados');
    if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));
    else this.buscaColor();
    this.f_buscar = this.fb.group({
      cuenta: '',
      identificacion: '',
    });
    this.f_cobrar = this.fb.group({
      idformacobro: 1,
      acobrar: this.totalapagar,
      ncvalor: '',
      dinero: '',
      vuelto: '',
    });
    var t: Colores = new Colores();
    var c: Colores = new Colores();
    this.formColores = this.fb.group({
      tonos0: t,
      colores0: c,
      tonos1: t,
      colores1: t,
    });
    this.getAllFormaCobro();
    this.getEstadoCaja();
    this.cargarConfiguracionImpresion();
  }

  ngOnDestroy(): void {
    this.limpiarPreviewPdf();
  }

  private limpiarPreviewPdf() {
    if (this.previewPdfObjectUrl) {
      URL.revokeObjectURL(this.previewPdfObjectUrl);
      this.previewPdfObjectUrl = null;
    }
    this.previewPdfUrl = null;
    this.previewFactura = null;
    this.previewLoading = false;
  }

  private obtenerPdfViewerElement(): HTMLIFrameElement | null {
    return this.pdfViewer?.nativeElement ?? document.getElementById('pdfViewer') as HTMLIFrameElement | null;
  }

  private limpiarEstadoNotaCredito() {
    this.saldoNotaCredito = 0;
    this.tieneNotaCredito = false;
    this.mensajeNotaCredito = '';
    this.f_cobrar.patchValue({
      ncvalor: '',
    });
    this.actualizarFormaCobroDesdeNotaCredito();
  }

  private cargarConfiguracionImpresion() {
    this.qzPrinterMode = this.qzTrayService.getSavedPrinterMode();
    this.qzPrinterName = this.qzTrayService.getSavedPrinterName();
    this.qzDefaultCopies = this.qzTrayService.getSavedCopies();
    this.qzSilentPrinting = this.qzTrayService.getSilentPrinting();
  }

  private obtenerCuentaFactura(factura: any): number {
    return Number(factura?.cuenta ?? factura?.idabonado ?? factura?.idAbonado ?? 0) || 0;
  }

  private obtenerFechaFactura(factura: any): number {
    const valor = factura?.feccrea ?? factura?.fecha ?? factura?.fechacobro ?? factura?.fectransferencia;
    const fecha = valor ? new Date(valor) : null;
    return fecha && !Number.isNaN(fecha.getTime()) ? fecha.getTime() : Number.MAX_SAFE_INTEGER;
  }

  private ordenarFacturasPendientes() {
    this._sincobro = [...this._sincobro].sort((a: any, b: any) => {
      const cuentaA = this.obtenerCuentaFactura(a);
      const cuentaB = this.obtenerCuentaFactura(b);
      if (cuentaA !== cuentaB) {
        return cuentaA - cuentaB;
      }

      const fechaA = this.obtenerFechaFactura(a);
      const fechaB = this.obtenerFechaFactura(b);
      if (fechaA !== fechaB) {
        return fechaA - fechaB;
      }

      return Number(a?.idfactura ?? 0) - Number(b?.idfactura ?? 0);
    });
  }

  private ordenarSeleccion(facturas: any[]) {
    return [...new Map(facturas.map((item) => [Number(item?.idfactura), item])).values()].sort((a: any, b: any) => {
      const cuentaA = this.obtenerCuentaFactura(a);
      const cuentaB = this.obtenerCuentaFactura(b);
      if (cuentaA !== cuentaB) {
        return cuentaA - cuentaB;
      }
      const fechaA = this.obtenerFechaFactura(a);
      const fechaB = this.obtenerFechaFactura(b);
      if (fechaA !== fechaB) {
        return fechaA - fechaB;
      }
      return Number(a?.idfactura ?? 0) - Number(b?.idfactura ?? 0);
    });
  }

  private recalcularTotalSeleccionado() {
    this.totalapagar = this.fencola.reduce((acc: number, f: any) => {
      const subtotal = Number(f?.total ?? 0);
      const interes = Number(f?.interes ?? 0);
      const iva = Number(f?.iva ?? 0);
      return acc + subtotal + interes + iva;
    }, 0);

    this.f_cobrar.patchValue({
      acobrar: Number(this.totalapagar.toFixed(2)),
    });
    this.actualizarFormaCobroDesdeNotaCredito();
  }

  private actualizarContextoNotaCredito() {
    const base = this.fencola.length > 0 ? this.fencola : this._sincobro;
    const cuentas = [...new Set(base.map((item) => this.obtenerCuentaFactura(item)).filter((cuenta) => cuenta > 0))];

    if (cuentas.length !== 1) {
      this.limpiarEstadoNotaCredito();
      return;
    }

    this.buscarNtaCredito(cuentas[0]);
  }

  private unirFacturasPendientes(base: any[], adicionales: any[]) {
    const mapa = new Map<number, any>();
    [...base, ...adicionales].forEach((item) => {
      const idfactura = Number(item?.idfactura ?? 0);
      if (Number.isFinite(idfactura) && idfactura > 0) {
        mapa.set(idfactura, item);
      }
    });
    return Array.from(mapa.values());
  }

  mostrarCheckboxCabecera(): boolean {
    const cuentas = new Set<number>();
    const clientes = new Set<number>();
    for (const item of this._sincobro) {
      const cuenta = this.obtenerCuentaFactura(item);
      const idcliente = Number(item?.idcliente ?? item?.idCliente ?? 0);
      if (cuenta > 0) {
        cuentas.add(cuenta);
      }
      if (idcliente > 0) {
        clientes.add(idcliente);
      }
    }
    return this._sincobro.length > 0 && cuentas.size === 1 && clientes.size <= 1;
  }

  cuentaActiva(): number | null {
    const base = this.fencola.length > 0 ? this.fencola : this._sincobro;
    const cuentas = [...new Set(base.map((item) => this.obtenerCuentaFactura(item)).filter((cuenta) => cuenta > 0))];
    return cuentas.length === 1 ? cuentas[0] : null;
  }

  textoCuentaActiva(): string {
    const cuenta = this.cuentaActiva();
    return cuenta != null ? `Cuenta activa: ${cuenta}` : 'Sin cuenta activa';
  }

  checkboxCabeceraMarcado(): boolean {
    if (!this.mostrarCheckboxCabecera()) {
      return false;
    }

    const pendientes = this._sincobro.filter((factura) => !this.esFacturaPagada(factura));
    if (!pendientes.length) {
      return false;
    }

    return pendientes.every((factura) => this.estaSeleccionada(factura));
  }

  toggleSeleccionTodasPendientes(checked: boolean) {
    if (!this.mostrarCheckboxCabecera()) {
      return;
    }

    if (checked) {
      const pendientes = this._sincobro.filter((factura) => !this.esFacturaPagada(factura));
      this.fencola = this.ordenarSeleccion(pendientes);
    } else {
      this.fencola = [];
    }

    this.recalcularTotalSeleccionado();
    this.actualizarContextoNotaCredito();
  }

  toggleSeleccionTodasPendientesEvento(evento: any) {
    this.toggleSeleccionTodasPendientes(!!evento?.target?.checked);
  }

  private seleccionarPrefixPorCuenta(factura: any, checked: boolean) {
    const cuenta = this.obtenerCuentaFactura(factura);
    if (!cuenta) {
      return;
    }

    const fechaSeleccionada = this.obtenerFechaFactura(factura);
    const seleccionCuenta = this._sincobro.filter((item) => this.obtenerCuentaFactura(item) === cuenta);
    const prefijo = seleccionCuenta.filter((item) => this.obtenerFechaFactura(item) <= fechaSeleccionada);

    if (checked) {
      this.fencola = this.ordenarSeleccion(prefijo);
    } else {
      this.fencola = this.ordenarSeleccion(
        this.fencola.filter((item) => this.obtenerCuentaFactura(item) !== cuenta)
      );
    }

    this.recalcularTotalSeleccionado();
    this.actualizarContextoNotaCredito();
  }

  estaSeleccionada(factura: any): boolean {
    const idfactura = Number(factura?.idfactura ?? 0);
    return this.fencola.some((item) => Number(item?.idfactura ?? 0) === idfactura);
  }

  esFacturaPagada(factura: any): boolean {
    return (
      Number(factura?.pagado ?? 0) === 1 ||
      Number(factura?.estado ?? 0) === 3 ||
      factura?.procesada === true
    );
  }

  formatPeriodoFactura(factura: any): string {
    const valor = factura?.feccrea ?? factura?.fecha ?? factura?.fechacobro ?? factura?.fectransferencia;
    if (!valor) {
      return '';
    }

    const fecha = new Date(valor);
    if (Number.isNaN(fecha.getTime())) {
      return '';
    }

    return new Intl.DateTimeFormat('es-EC', { month: 'long', year: 'numeric' }).format(fecha);
  }

  openModal(id: string) {
    const modal = document.getElementById(id);
    if (!modal) return;

    modal.classList.add('show');
    modal.setAttribute('aria-hidden', 'false');
    modal.setAttribute('aria-modal', 'true');
    modal.style.display = 'block';

    document.body.classList.add('modal-open');

    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop fade show';
    backdrop.setAttribute('data-backdrop-id', id);
    document.body.appendChild(backdrop);
  }

  closeModal(id: string) {
    const modal = document.getElementById(id);
    if (!modal) return;

    modal.classList.remove('show');
    modal.setAttribute('aria-hidden', 'true');
    modal.removeAttribute('aria-modal');
    modal.style.display = 'none';

    const backdrop = document.querySelector(`.modal-backdrop[data-backdrop-id="${id}"]`);
    if (backdrop && backdrop.parentNode) {
      backdrop.parentNode.removeChild(backdrop);
    }

    document.querySelectorAll('.modal-backdrop').forEach((el) => el.remove());

    document.body.classList.remove('modal-open');
    document.body.style.removeProperty('overflow');
    document.body.style.removeProperty('padding-right');
  }

  async buscaColor() {
    try {
      const datos = await this.coloresService.setcolor(1, 'abonados');
      const coloresJSON = JSON.stringify(datos);
      sessionStorage.setItem('/abonados', coloresJSON);
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

  getEstadoCaja() {
    this.recaCobroService.getCajaEstado(this.authService.idusuario).subscribe({
      next: async (item: any) => {
        this._estadoCaja = item;
        if (item.estado === 1) {
          this.swcaja = true;
          this.abrirCaja.usuario = item.username;
          this.abrirCaja.nrofactura = `${item.establecimiento}-${item.codigo}-${String(item.secuencial ?? 0).padStart(9, '0')}`;
          this.abrirCaja.establecimiento = item.establecimiento;
        } else {
          /* generar una consulta para traer user name de  */
          this.abrirCaja.usuario = this.authService.alias;
          this.swcaja = false;
        }
      },
      error: (e: any) => console.error(e),
    });
  }
  fnabrirCaja() {
    this.recaCobroService
      .abrirCaja(this.abrirCaja.usuario, this.abrirCaja.password)
      .subscribe({
        next: (item: any) => {
          this.swal('info', item.mensaje ?? 'Caja abierta correctamente.');
          this.getEstadoCaja();
        },
        error: (e: any) => console.error(e),
      });
  }
  swal(icon: any, mensaje: any) {
    Swal.fire({
      toast: true,
      icon: icon,
      title: mensaje,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
    });
  }
  fnCerrarCaja() {
    this.recaCobroService.cerrarCaja(this._estadoCaja.username).subscribe({
      next: (item: any) => {
        this.swal('info', item.mensaje ?? 'Caja cerrada correctamente.');
        this.getEstadoCaja();
      },
      error: (e: any) => console.error(e),
    });
  }
  getAllFormaCobro() {
    this.s_formacobro.getAll().subscribe({
      next: (formascobro: any) => {
        this._formasCobro = formascobro;
      },
      error: (e: any) => console.error(e),
    });
  }

  btn_buscar() {
    this.fencola = [];
    this.limpiarEstadoNotaCredito();
    let f = this.f_buscar.value;
    if (f.cuenta != '') {
      if (
        this.validarCampo(this.f_buscar.value.cuenta) ||
        this.f_buscar.value.cuenta != ''
      ) {
        this.getSinCobro(this.f_buscar.value.cuenta);
      }
      if (
        !this.validarCampo(this.f_buscar.value.cuenta) ||
        this.f_buscar.value.cuenta === ''
      ) {
        this.swBuscar = true;
      }
    } else {
      const identificacion = String(f.identificacion ?? '').trim();
      if (!identificacion) {
        this.swal('warning', 'Ingresa una cuenta o una identificación para buscar.');
        return;
      }

      this.clienteBusquedaTexto = identificacion;
      this.clientesLoading = true;
      this.clientesSinResultados = false;
      this.clientesEncontrados = 0;
      this._clientes = [];
      this.abrirConsultaModal();

      this.s_cliente.getByIdentificacion(identificacion).subscribe({
        next: (clientes: any) => {
          this._clientes = Array.isArray(clientes) ? clientes : [];
          this.clientesSinResultados = this._clientes.length === 0;
          this.clientesEncontrados = this._clientes.length;
        },
        error: (e: any) => {
          console.error(e.error);
          this.clientesSinResultados = true;
          this.clientesLoading = false;
          this.swal('error', 'No se pudo consultar el cliente.');
        },
        complete: () => {
          this.clientesLoading = false;
        },
      });
    }
  }
  txtCuenta(e: any) {
    this.swBuscar = false;
    this.f_buscar.patchValue({
      identificacion: '',
    });
  }
  txtIdentificacion(e: any) {
    this.swBuscar = false;
    this.f_buscar.patchValue({
      cuenta: '',
    });
  }
  buscarCuentasOfCliente(cliente: any) {
    this.cerrarConsultaModal();
    this.getCliente(cliente);
  }
  async getSinCobro(cuenta: number) {
    this.loadingService.showLoading();
    this.consultandoCartera = true;
    this.consultandoCarteraTexto = `Cuenta ${cuenta}`;
    this._sincobro = [];
    this.totalapagar = 0;
    this.limpiarEstadoNotaCredito();
    try {
      const abonados = await firstValueFrom(this.aboService.getByidabonado(cuenta));
      const abonado = Array.isArray(abonados) ? abonados[0] : null;
      const idcliente = Number(abonado?.idcliente_clientes?.idcliente ?? 0) || null;

      if (idcliente != null) {
        this.getClienteById(idcliente);
      }

      const sincobro = await this.recaCobroService.getSincobroByCuenta(cuenta);
      this._sincobro = Array.isArray(sincobro) ? sincobro : [];

      if (!this._sincobro.length) {
        this.swal('warning', 'No tiene valores pendientes');
        return;
      }

      this.ordenarFacturasPendientes();
      this.actualizarContextoNotaCredito();
    } catch (e) {
      console.error(e);
    } finally {
      this.loadingService.hideLoading();
      this.consultandoCartera = false;
      this.consultandoCarteraTexto = '';
    }
  }
  async getCliente(cliente: any) {
    this.loadingService.showLoading();
    this.f_buscar.reset();
    this._sincobro = [];
    this.totalapagar = 0;
    this.limpiarEstadoNotaCredito();
    this.consultandoCartera = true;
    const idcliente = this.obtenerIdCliente(cliente);
    if (idcliente == null) {
      this.loadingService.hideLoading();
      this.consultandoCartera = false;
      this.swal('warning', 'No se pudo identificar el cliente seleccionado.');
      return;
    }
    this.consultandoCarteraTexto = `${cliente?.nombre || 'Cliente'} - ${cliente?.cedula || cliente?.idcliente || ''}`;
    this.recaCobroService
      .getSincobroByCliente(idcliente)
      .then((sincobro: any) => {
        this._sincobro = [...sincobro];
        this.ordenarFacturasPendientes();
        this.getClienteById(idcliente);
        this.actualizarContextoNotaCredito();
        this.loadingService.hideLoading();
        this.consultandoCartera = false;
        this.consultandoCarteraTexto = '';
      })
      .catch((e: any) => {
        console.error(e);
        this.loadingService.hideLoading();
        this.consultandoCartera = false;
        this.consultandoCarteraTexto = '';
      });
  }
  swSincobro() {
    if (this._sincobro.length > 0) {
      return true;
    }
    return false;
  }
  validarCampo(campo: any) {
    const regex = /^\s+/;
    return !regex.test(campo);
  }
  sumaIndividual(subtotal: number, interes: number, impuesto: number) {
    return (subtotal + interes + impuesto).toFixed(2);
  }

  getClienteById(idcliente: number) {
    if (idcliente == null) {
      return;
    }
    this.s_cliente.getListaById(idcliente).subscribe((cliente: any) => {
      this._cliente = cliente;
    });
  }

  private obtenerIdCliente(origen: any): number | null {
    const candidato =
      origen?.idcliente ?? origen?.idCliente ?? origen?.cliente?.idcliente ?? null;
    const id = Number(candidato);
    return Number.isFinite(id) && id > 0 ? id : null;
  }
  private abrirConsultaModal() {
    const modalElement = this.consultaModal?.nativeElement;
    if (!modalElement || typeof bootstrap === 'undefined') {
      return;
    }
    const modal = bootstrap.Modal.getOrCreateInstance(modalElement);
    modal.show();
  }

  private cerrarConsultaModal() {
    const modalElement = this.consultaModal?.nativeElement;
    if (!modalElement || typeof bootstrap === 'undefined') {
      return;
    }
    const modal = bootstrap.Modal.getInstance(modalElement) || bootstrap.Modal.getOrCreateInstance(modalElement);
    modal.hide();
  }
  facturaDetalle(idfactura: any) {
    this.addRubro = [];
    this.idfactura = idfactura;
    this.detalleFac = true;
    let _fac = this._sincobro.find(
      (fact: { idfactura: any }) => fact.idfactura === idfactura
    );
    let iva: any = {
      cantidad: 1,
      idrubro_rubros: { descripcion: 'Iva' },
      valorunitario: 0.0,
      estado: 1,
    };
    let interes: any = {
      cantidad: 1,
      idrubro_rubros: { descripcion: 'Intereses' },
      valorunitario: 0.0,
      estado: 1,
    };
    if (_fac.interes > 0) {
      interes.valorunitario = _fac.interes;
      this.addRubro.push(interes);
    }
    if (_fac.iva > 0) {
      iva.valorunitario = _fac.iva;
      this.addRubro.push(iva);
    }
    // this.addRubro = [...interes, iva];
  }
  cancelarDetalle(e: any) {
    this.detalleFac = e;
  }
  calcular(e: any, factura: any) {
    const checked = !!e.target?.checked;
    this.seleccionarPrefixPorCuenta(factura, checked);
    return;

    // Asegurar que fencola es un array
    if (!Array.isArray(this.fencola)) {
      this.fencola = [];
    }

    if (checked) {
      // Evitar duplicados
      const exists = this.fencola.some(
        (f: any) => f.idfactura === factura.idfactura
      );
      if (!exists) {
        this.fencola.push(factura);
      }
    } else {
      // Buscar por igualdad (===), no por asignación
      const idx = this.fencola.findIndex(
        (f: any) => f.idfactura === factura.idfactura
      );
      if (idx !== -1) {
        this.fencola.splice(idx, 1);
      }
    }

    // Recalcular total una sola vez (asegurando conversión a Number)
    this.totalapagar = this.fencola.reduce((acc: number, f: any) => {
      const t = Number(f.total || 0);
      const inter = Number(f.interes || 0);
      const iva = Number(f.iva || 0);
      return acc + t + inter + iva;
    }, 0);

    // Patchear el formulario solo una vez
    this.f_cobrar.patchValue({
      acobrar: Number(this.totalapagar.toFixed(2)),
    });
  }

  cobrar() {
    let dinero: number = +this.f_cobrar.value.dinero!;
    let apagar: number = +this.totalapagar!.toFixed(2);
    let facturas: any[] = [];
    let facturasSeleccionadas: any[] = [];
    let autentification = 1;
    let recaudacion: any = {};
    this.fencola.forEach((item: any) => {
      facturas.push(item.idfactura);
      facturasSeleccionadas.push({ ...item });
    });
    recaudacion.totalpagar = this.totalapagar;
    recaudacion.recaudador = autentification;
    recaudacion.valor = this.totalapagar;
    recaudacion.recibo = dinero;
    recaudacion.cambio = dinero - apagar;
    recaudacion.ncvalor = Number(this.f_cobrar.value.ncvalor) || 0;
    recaudacion.usucrea = autentification;
    recaudacion.formapago = +this.f_cobrar.value.idformacobro || 1;
    let obj: any = {
      facturas: facturas,
      autentification: autentification,
      recaudacion: recaudacion,
      idcaja: this._estadoCaja?.idcaja,
    };
    this.recaCobroService.cobrarFacturas(obj).subscribe({
      next: (_cobrado: any) => {
        this.ultimasFacturasCobro = [...facturasSeleccionadas];
        this.fencola = [];
        this.totalapagar = 0;
        this.f_cobrar.patchValue({
          acobrar: 0,
          dinero: '',
          vuelto: '',
        });
        this.limpiarEstadoNotaCredito();
        this.swal('success', 'Cobro realizado. Puedes reimprimir el comprobante desde el menú.');
        this.getEstadoCaja();
      },
      error: (e: any) => {
        console.error(e);
        this.fencola = [];
      },
    });
  }

  async imprimirCobroDirecto(factura: any) {
    const idfactura = Number(factura?.idfactura ?? 0);
    if (!Number.isFinite(idfactura) || idfactura <= 0) {
      this.swal('warning', 'No se encontró un número de factura válido.');
      return;
    }

    this.imprimiendoFacturaId = idfactura;
    try {
      const profile = this.obtenerPerfilImpresionFactura(factura);
      const pdf = await this.jasperReportService.getComprobantePago(idfactura, profile);
      const blob = pdf instanceof Blob ? pdf : new Blob([pdf], { type: 'application/pdf' });
      try {
        await this.qzTrayService.printPdf(
          blob,
          `Factura ${idfactura}`,
          this.obtenerImpresoraDirecta(profile),
          profile,
        );
        this.swal('success', 'Comprobante enviado a la impresora.');
        return;
      } catch (qzError) {
        console.error(qzError);
        this.swal('error', 'No se pudo imprimir con el puente local.');
      }
    } catch (e) {
      console.error(e);
      this.swal('error', 'No se pudo generar el comprobante.');
    } finally {
      this.imprimiendoFacturaId = null;
    }
  }

  async probarImpresoraQz() {
    this.imprimiendoPruebaImpresora = true;
    try {
      await this.qzTrayService.printTestTicket('PRUEBA DE IMPRESION');
      this.swal('success', 'Se envio una prueba al puente de impresion.');
    } catch (e) {
      console.error(e);
      this.swal('error', 'No se pudo enviar la prueba de impresion. Verifica el puente local y la impresora.');
    } finally {
      this.imprimiendoPruebaImpresora = false;
    }
  }

  async abrirConfiguracionImpresion() {
    this.cargarConfiguracionImpresion();
    this.qzSettingsError = '';
    this.qzPrintersAvailable = [];

    this.openModal('modalImpresion');
  }

  async cargarImpresorasQz() {
    this.qzSettingsLoading = true;
    this.qzSettingsError = '';

    try {
      this.qzPrintersAvailable = await this.qzTrayService.listPrinters();
      if (this.qzPrinterMode === 'manual' && !this.qzPrinterName && this.qzPrintersAvailable.length) {
        this.qzPrinterName = this.qzPrintersAvailable[0];
      }
    } catch (e) {
      console.error(e);
      this.qzSettingsError = 'No se pudo cargar la lista de impresoras. Verifica que el puente local este abierto.';
    } finally {
      this.qzSettingsLoading = false;
    }
  }

  onPrinterModeChange() {
    this.qzSettingsError = '';
    if (this.qzPrinterMode === 'tm-t88v') {
      this.qzPrinterName = '';
    }
  }

  guardarConfiguracionImpresion() {
    if (this.qzPrinterMode === 'manual' && !this.qzPrinterName.trim()) {
      this.swal('warning', 'Selecciona una impresora para el modo manual.');
      return;
    }

    const copies = this.qzTrayService.setDefaultCopies(this.qzDefaultCopies);
    this.qzTrayService.setSilentPrinting(this.qzSilentPrinting);
    this.qzTrayService.setPrinterPreference(this.qzPrinterMode, this.qzPrinterName);
    this.qzDefaultCopies = copies;
    this.swal('success', 'Configuracion de impresion guardada.');
    this.closeModal('modalImpresion');
  }

  private armarItemsMerge(facturas: any[]): MergeItem[] {
    return facturas
      .map((item: any) => Number(item?.idfactura))
      .filter((idfactura) => Number.isFinite(idfactura) && idfactura > 0)
      .map((idfactura) => ({ idfactura }));
  }

  abrirModalReimpresion(factura?: any) {
    this.limpiarPreviewPdf();
    this.modalReimpresionFacturaId = factura?.idfactura ? String(factura.idfactura) : '';
    this.previewFactura = factura ?? null;
    this.openModal('modalReimpresion');
  }

  cerrarModalReimpresion() {
    this.limpiarPreviewPdf();
    this.closeModal('modalReimpresion');
  }

  async buscarComprobanteReimpresion() {
    const idfactura = Number(this.modalReimpresionFacturaId);
    if (!Number.isFinite(idfactura) || idfactura <= 0) {
      this.swal('warning', 'Ingresa un número de factura válido.');
      return;
    }

    this.previewLoading = true;
    this.limpiarPreviewPdf();
    this.previewLoading = true;

    try {
      const pdf = await this.jasperReportService.getComprobantePago(idfactura, this.obtenerPerfilImpresionFactura(this.previewFactura ?? { idfactura }));
      const blob = pdf instanceof Blob ? pdf : new Blob([pdf], { type: 'application/pdf' });
      const viewer = this.obtenerPdfViewerElement();
      if (!viewer) {
        throw new Error('No se encontró el visor PDF para mostrar el comprobante.');
      }
      this.previewPdfObjectUrl = this.jasperReportService.openPdfInViewer(blob, viewer);
      this.previewPdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.previewPdfObjectUrl);
      this.previewFactura = this.ultimasFacturasCobro.find((f: any) => Number(f?.idfactura) === idfactura) ?? { idfactura };
    } catch (e) {
      console.error(e);
      this.swal('error', 'No se pudo cargar el comprobante.');
    } finally {
      this.previewLoading = false;
    }
  }

  imprimirVistaPrevia() {
    const iframe = this.pdfViewer?.nativeElement;
    const win = iframe?.contentWindow;
    if (!win) {
      this.swal('warning', 'Primero busca un comprobante para visualizarlo.');
      return;
    }
    win.focus();
    win.print();
  }

  async reimprimirUltimoCobro() {
    if (!this.ultimasFacturasCobro.length) {
      this.swal('info', 'No hay un cobro reciente para reimprimir.');
      return;
    }
    await this.imprimirUltimoCobroUnificado();
  }

  async imprimirUltimoCobroUnificado() {
    if (!this.ultimasFacturasCobro.length) {
      this.swal('info', 'No hay un cobro reciente para imprimir.');
      return;
    }

    const items = this.armarItemsMerge(this.ultimasFacturasCobro);
    if (!items.length) {
      this.swal('warning', 'No se encontraron facturas válidas para imprimir.');
      return;
    }

    this.imprimiendoCobroUnificado = true;
    try {
      const pdf = await this.jasperReportService.mergeComprobantes({ items });
      const blob = pdf instanceof Blob ? pdf : new Blob([pdf], { type: 'application/pdf' });
      try {
        const profile = this.obtenerPerfilImpresionLote(this.ultimasFacturasCobro);
        await this.qzTrayService.printPdf(
          blob,
          'Cobro unificado',
          this.obtenerImpresoraDirecta(profile),
          profile,
        );
        this.swal('success', 'Cobro enviado a la impresora.');
        return;
      } catch (qzError) {
        console.error(qzError);
        this.swal('error', 'No se pudo imprimir el cobro unificado con el puente local.');
      }
    } catch (e) {
      console.error(e);
      this.swal('error', 'No se pudo generar el comprobante unificado.');
    } finally {
      this.imprimiendoCobroUnificado = false;
    }
  }

  estaImprimiendoFactura(factura: any): boolean {
    return this.imprimiendoFacturaId === Number(factura?.idfactura ?? 0);
  }

  private obtenerImpresoraDirecta(profile: PrintProfile = 'default'): string {
    const modo = this.qzTrayService.getSavedPrinterMode(profile);
    const nombre = this.qzTrayService.getSavedPrinterName(profile);

    if (modo === 'manual' && nombre) {
      return nombre;
    }

    return '';
  }

  private obtenerPerfilImpresionFactura(factura: any): PrintProfile {
    console.log('Obteniendo perfil de impresión para factura:', factura);
    const modulo = Number(factura?.idmodulo?.idmodulo ?? factura?.idmodulo ?? 0);
    const convenio = Number(factura?.conveniopago ?? 0);

    if (convenio > 0 || modulo === 27) {
      return 'convenio';
    }

    if (modulo === 4) {
      return 'servicios';
    }

    return 'consumo';
  }

  private obtenerPerfilImpresionLote(facturas: any[]): PrintProfile {
    const primera = Array.isArray(facturas) && facturas.length ? facturas[0] : null;
    return this.obtenerPerfilImpresionFactura(primera);
  }

  private abrirPdfDirectoParaImpresion(pdf: Blob, titulo: string): boolean {
    const tab = window.open('', '_blank');
    if (!tab) {
      return false;
    }

    const fileURL = URL.createObjectURL(pdf);
    const html = `
      <html>
        <head>
          <title>${titulo}</title>
          <style>
            html, body { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background: #fff; }
            iframe { border: 0; width: 100%; height: 100vh; display: block; }
          </style>
        </head>
        <body>
          <iframe id="pdfFrame"></iframe>
          <script>
            const frame = document.getElementById('pdfFrame');
            frame.src = '${fileURL}';
            frame.onload = () => {
              try {
                window.focus();
                frame.contentWindow.focus();
                frame.contentWindow.print();
              } catch (error) {
                console.error(error);
              }
            };
            window.addEventListener('afterprint', () => {
              setTimeout(() => URL.revokeObjectURL('${fileURL}'), 1000);
            });
          </script>
        </body>
      </html>`;

    tab.document.open();
    tab.document.write(html);
    tab.document.close();
    setTimeout(() => URL.revokeObjectURL(fileURL), 15000);
    return true;
  }

  buscarNtaCredito(cuenta: number) {
    if (!cuenta) {
      this.limpiarEstadoNotaCredito();
      return;
    }

    this.s_ntacredito.getSaldosNC(cuenta).subscribe({
      next: (datos: any) => {
        const lista = Array.isArray(datos) ? datos : [];
        const primero = lista[0];
        const saldo = Number(primero?.saldo ?? 0);
        this.tieneNotaCredito = lista.length > 0 && saldo > 0;
        this.saldoNotaCredito = this.tieneNotaCredito ? saldo : 0;
        this.mensajeNotaCredito = this.tieneNotaCredito
          ? `La cuenta tiene nota de crédito disponible por ${this.saldoNotaCredito.toFixed(2)}.`
          : 'La cuenta no tiene notas de crédito disponibles.';

        if (this.tieneNotaCredito && !this.f_cobrar.value.ncvalor) {
          this.f_cobrar.patchValue({
            ncvalor: this.saldoNotaCredito.toFixed(2),
          });
        }
        this.actualizarFormaCobroDesdeNotaCredito();
      },
      error: (e: any) => {
        console.error(e);
        this.limpiarEstadoNotaCredito();
      },
    });
  }

  private actualizarFormaCobroDesdeNotaCredito() {
    const total = Number(this.totalapagar ?? 0);
    const saldoNc = Number(this.saldoNotaCredito ?? 0);

    if (!this.tieneNotaCredito || total <= 0 || saldoNc <= 0) {
      if (+this.f_cobrar.value.idformacobro === 6) {
        this.f_cobrar.patchValue({ idformacobro: 1 });
      }
      return;
    }

    if (saldoNc >= total) {
      this.f_cobrar.patchValue({
        idformacobro: 6,
        ncvalor: total.toFixed(2),
        dinero: total.toFixed(2),
        vuelto: 0,
      });
      return;
    }

    this.f_cobrar.patchValue({
      idformacobro: 1,
      ncvalor: saldoNc.toFixed(2),
      dinero: (total - saldoNc).toFixed(2),
      vuelto: 0,
    });
  }

  async reimprimirUltimoCobroUnaPorUna() {
    if (!this.ultimasFacturasCobro.length) {
      this.swal('info', 'No hay un cobro reciente para reimprimir.');
      return;
    }

    const tabs: Window[] = [];
    for (let i = 0; i < this.ultimasFacturasCobro.length; i++) {
      const tab = window.open('', '_blank');
      if (!tab) {
        this.swal('warning', 'Permite ventanas emergentes para abrir todos los comprobantes.');
        tabs.forEach((x) => x.close());
        return;
      }
      tabs.push(tab);
    }

    try {
      for (let i = 0; i < this.ultimasFacturasCobro.length; i++) {
        const idfactura = this.ultimasFacturasCobro[i];
        const pdf = await this.jasperReportService.getComprobantePago(
          idfactura,
          this.obtenerPerfilImpresionLote(this.ultimasFacturasCobro),
        );
        const blob = pdf instanceof Blob ? pdf : new Blob([pdf], { type: 'application/pdf' });
        const fileURL = URL.createObjectURL(blob);
        tabs[i].location.href = fileURL;
        setTimeout(() => URL.revokeObjectURL(fileURL), 10000);
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
    } catch (e) {
      console.error(e);
      this.swal('error', 'No se pudieron abrir los comprobantes individuales.');
      tabs.forEach((x) => x.close());
    }
  }

  async imprimirFacturaIndividual(factura: any) {
    const idfactura = Number(factura?.idfactura);
    if (!Number.isFinite(idfactura) || idfactura <= 0) {
      this.swal('warning', 'No se encontró un número de factura válido.');
      return;
    }

    try {
      this.abrirModalReimpresion(factura);
      this.modalReimpresionFacturaId = String(idfactura);
      await this.buscarComprobanteReimpresion();
    } catch (e) {
      console.error(e);
      this.swal('error', 'No se pudo generar el comprobante individual.');
    }
  }
  vuelto(e: any) {
    const dinero: number = +this.f_cobrar.value.dinero!;
    const apagar: number = +this.totalapagar!.toFixed(2);
    const vuelto = dinero - apagar;
    this.f_cobrar.patchValue({
      vuelto: +Math.max(vuelto, 0).toFixed(2),
    });
  }

  usarMontoACobrar() {
    const apagar: number = +this.totalapagar!.toFixed(2);
    const saldoNc = Number(this.saldoNotaCredito ?? 0);

    if (this.tieneNotaCredito && saldoNc > 0) {
      const ncAplicada = Math.min(saldoNc, apagar);
      const resto = Math.max(apagar - ncAplicada, 0);
      this.f_cobrar.patchValue({
        ncvalor: ncAplicada.toFixed(2),
        idformacobro: resto === 0 ? 6 : 1,
        dinero: resto.toFixed(2),
        vuelto: 0,
      });
      return;
    }

    this.f_cobrar.patchValue({
      dinero: +apagar.toFixed(2),
      vuelto: 0,
      ncvalor: '',
      idformacobro: 1,
    });
  }
  ordenarPor(campo: keyof SinCobrarVisual): void {
    if (campo === 'idabonado') {
      this.ordenColumna = campo;
      this.ordenAscendente = true;
      this.ordenarFacturasPendientes();
      return;
    }

    if (this.ordenColumna === campo) {
      this.ordenAscendente = !this.ordenAscendente;
    } else {
      this.ordenColumna = campo;
      this.ordenAscendente = true;
    }

    this._sincobro.sort((a: any, b: any) => {
      const valorA = a[campo];
      const valorB = b[campo];

      if (valorA == null && valorB == null) return 0;
      if (valorA == null) return 1;
      if (valorB == null) return -1;

      const esNumero = typeof valorA === 'number' && typeof valorB === 'number';

      if (esNumero) {
        return this.ordenAscendente ? valorA - valorB : valorB - valorA;
      } else {
        return this.ordenAscendente
          ? String(valorA).localeCompare(String(valorB))
          : String(valorB).localeCompare(String(valorA));
      }
    });
  }

  /* CONTROLAR LA FOMRA DE COBRO PARA VALIDAR LAS NOTAS DE CREDITO */

  formaDeCobro(e: any) {
    console.log(e.target.value);
    const idformacobro = +this.f_cobrar.value.idformacobro!;
    if (idformacobro === 3) {
      this.actualizarFormaCobroDesdeNotaCredito();
      return;
    }

    if (idformacobro === 6) {
      const total = Number(this.totalapagar ?? 0);
      this.f_cobrar.patchValue({
        ncvalor: total.toFixed(2),
        dinero: total.toFixed(2),
        vuelto: 0,
      });
      return;
    }

    if (idformacobro === 1) {
      const total = Number(this.totalapagar ?? 0);
      const saldoNc = Number(this.saldoNotaCredito ?? 0);

      if (this.tieneNotaCredito && saldoNc > 0) {
        const ncAplicada = Math.min(saldoNc, total);
        const resto = Math.max(total - ncAplicada, 0);
        this.f_cobrar.patchValue({
          ncvalor: ncAplicada.toFixed(2),
          dinero: resto.toFixed(2),
          vuelto: 0,
        });
        if (resto === 0) {
          this.f_cobrar.patchValue({
            idformacobro: 6,
          });
        }
      } else {
        this.f_cobrar.patchValue({
          ncvalor: '',
          dinero: total.toFixed(2),
          vuelto: 0,
        });
      }
      return;
    }

    if (this.tieneNotaCredito && this.saldoNotaCredito > 0 && this.saldoNotaCredito < this.totalapagar) {
      this.f_cobrar.patchValue({
        ncvalor: this.saldoNotaCredito.toFixed(2),
        dinero: +(this.totalapagar - this.saldoNotaCredito).toFixed(2),
        vuelto: 0,
      });
    }
  }
}
interface SinCobrarVisual {
  idabonado: number;
}
