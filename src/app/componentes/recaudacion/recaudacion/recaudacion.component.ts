import { Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { catchError, debounceTime, distinctUntilChanged, EMPTY, firstValueFrom, of, switchMap, tap } from 'rxjs';

import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { Usuarios } from 'src/app/modelos/administracion/usuarios.model';
import { Colores } from 'src/app/modelos/administracion/colores.model';
import { Cajas } from 'src/app/modelos/cajas.model';
import { Facturas } from 'src/app/modelos/facturas.model';
import { Formacobro } from 'src/app/modelos/formacobro.model';
import { Ptoemision } from 'src/app/modelos/ptoemision';
import { Recaudacion } from 'src/app/modelos/recaudacion.model';
import { Recaudaxcaja } from 'src/app/modelos/recaudaxcaja.model';
import { Abonados } from 'src/app/modelos/abonados';
import { Clientes } from 'src/app/modelos/clientes';
import { Rubroxfac } from 'src/app/modelos/rubroxfac.model';
import { Rubros } from 'src/app/modelos/rubros.model';
import { Facxnc } from 'src/app/modelos/facxnc';
import { Valoresnc } from 'src/app/modelos/valoresnc';

import { AbonadosService } from 'src/app/servicios/abonados.service';
import { ColorService } from 'src/app/servicios/administracion/color.service';
import { ClientesService } from 'src/app/servicios/clientes.service';
import { FacturaService } from 'src/app/servicios/factura.service';
import { FormacobroService } from 'src/app/servicios/formacobro.service';
import { LecturasService } from 'src/app/servicios/lecturas.service';
import { RubroxfacService } from 'src/app/servicios/rubroxfac.service';
import { InteresesService } from 'src/app/servicios/intereses.service';
import { CajaService } from 'src/app/servicios/caja.service';
import { RecaudacionService } from 'src/app/servicios/recaudacion.service';
import { FacxrecaudaService } from 'src/app/servicios/facxrecauda.service';
import { RecaudaxcajaService } from 'src/app/servicios/recaudaxcaja.service';
import { ModulosService } from 'src/app/servicios/modulos.service';
import { LoadingService } from 'src/app/servicios/loading.service';
import { NtacreditoService } from 'src/app/servicios/ntacredito.service';
import { ValoresncService } from 'src/app/servicios/valoresnc.service';
import { FacxncService } from 'src/app/servicios/facxnc.service';
import { JasperReportService, MergeItem } from 'src/app/servicios/jasper-report.service';
import { PtoemisionService } from 'src/app/servicios/ptoemision.service';
import { DefinirService } from 'src/app/servicios/administracion/definir.service';
import { FecfacturaService } from 'src/app/servicios/fecfactura.service';
import { RecaudacionCobroService } from 'src/app/servicios/recaudacion-cobro.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-recaudacion',
  templateUrl: './recaudacion.component.view.html',
  styleUrls: ['./recaudacion.component.css'],
})
export class RecaudacionComponent implements OnInit, OnDestroy {

  // ==== Formularios ====
  formBuscar: FormGroup;
  formCobrar: FormGroup;
  formBusClientes: FormGroup;
  formColores: FormGroup;

  // ==== Datos de cliente / búsqueda ====
  cliente = {} as Cliente;
  mensaje = {} as Mensaje;
  _cliente: any[] = [];
  _clientes: any[] = [];
  _cuentas: any;
  privez = true;

  // ==== Facturas / recaudación ====
  _sincobro: any[] = [];
  listaFiltrada: any[] = [];
  arrFacturas: any[] = [];
  arrCuenta: any[] = [];
  sumtotal = 0;
  acobrar = 0;
  acobrardec = '';
  swbusca = 0; // 0: sin búsqueda, 1: no existe, 2: sin planillas, 3: con planillas
  swcobrado = false;
  private pdfPreviewObjectUrl: string | null = null;
  disabledcobro = true;
  procesandoCobro = false;
  totfac = 0;
  idfactura: number;
  consumo = 0;
  totInteres: number = 0;
  factura: Facturas = new Facturas();
  valoriva: number;
  valorNtaCredito: number = 0;

  // ==== Formas de cobro / NC ====
  _formascobro: any[] = [];
  formaCobro: Formacobro = new Formacobro();
  formacobroNC = false;
  idformacobro: number;
  facturaReferenciaCobro: any = null;
  _nc: any[] = [];
  swNC = false;

  // ==== Caja / usuario / emisión ====
  _caja: Cajas = new Cajas();
  _establecimiento: Ptoemision = new Ptoemision();
  _usuario: Usuarios = new Usuarios();
  _ptoemision: any;
  _nroFactura: string;
  _codRecaudador: string;
  estadoCajaT = true;
  cajaActiva = false;
  recxcaja: Recaudaxcaja = new Recaudaxcaja();
  establecimientoAsignadoId: number | null = null;

  // ==== Colores ====
  _tonoscabecera: any;
  _colorescabecera: any;
  _tonosdetalle: any;
  _coloresdetalle: any;

  // ==== Intereses ====
  calInteres = {} as calcInteres;
  _intereses: any;

  // ==== Impresión / PDF ====
  otraPagina = false;
  facturasToPrint: any[] = [];

  // ==== Varios ====
  swvalido = 1;
  iva: number;
  cuenta: any;
  datoBusqueda = 0;
  $event: any;
  _rubrosxfac: any[] = [];
  filtro: string = ''; // para el modal de clientes
  private cajaEstadoEventSource: EventSource | null = null;
  private streamCajaActivo = true;
  private streamCajaReconnectTimeout: number | null = null;
  constructor(
    public fb: FormBuilder,
    public fb1: FormBuilder,
    private aboService: AbonadosService,
    private clieService: ClientesService,
    private facService: FacturaService,
    private rubxfacService: RubroxfacService,
    private lecService: LecturasService,
    private coloService: ColorService,
    private fcobroService: FormacobroService,
    private authService: AutorizaService,
    private interService: InteresesService,
    private s_cajas: CajaService,
    private recaService: RecaudacionService,
    private facxrService: FacxrecaudaService,
    private s_recaudaxcaja: RecaudaxcajaService,
    private recaCobroService: RecaudacionCobroService,
    private s_modulo: ModulosService,
    private loadingService: LoadingService,
    private s_ntacredito: NtacreditoService,
    private s_valorNc: ValoresncService,
    private s_facnc: FacxncService,
    private s_jasperReport: JasperReportService,
    private s_ptoemision: PtoemisionService,
    private s_definir: DefinirService,
    private s_fecfacturas: FecfacturaService,
    private router: Router,
    private ngZone: NgZone
  ) { }

  private get ultimoPtoEmisionStorageKey(): string {
    return `recaudacion.ultimoPtoEmision.${this.authService.idusuario}`;
  }

  // =====================
  //   CICLO DE VIDA
  // =====================

  ngOnInit(): void {
    // IVA
    this.s_definir.getByIddefinirAsync(1).then((item: any) => {
      this.iva = item.iva;
    });

    // Formulario principal de búsqueda
    this.formBuscar = this.fb.group({
      cuenta: '',
      identificacion: '',
      filtro: '',
    });

    // Filtro en vivo
    this.configurarFiltroEnVivo();

    // Formulario de búsqueda de clientes (modal)
    this.formBusClientes = this.fb1.group({
      nombre_identifica: [null, [Validators.required, Validators.minLength(5)]],
    });

    // Formulario de cobro
    this.formCobrar = this.fb.group({
      valorAcobrar: 0,
      idformacobro: this.formaCobro,
      acobrar: 0,
      ncvalor: ['', [Validators.required], this.valNC.bind(this)],
      dinero: ['', [Validators.required], this.valDinero.bind(this)],
      vuelto: '',
      saldo: ['', [Validators.required], this.SaldoNC.bind(this)],
    });

    // Listeners simples para limpiar campos
    const cuenta = document.getElementById('cuenta') as HTMLInputElement;
    if (cuenta) {
      cuenta.addEventListener('keyup', () => {
        this.swvalido = 1;
        this.formBuscar.controls['identificacion'].setValue('');
      });
    }

    const identificacion = document.getElementById('identificacion') as HTMLInputElement;
    if (identificacion) {
      identificacion.addEventListener('keyup', () => {
        this.swvalido = 1;
        this.formBuscar.controls['cuenta'].setValue('');
      });
    }

    // Colores
    const t: Colores = new Colores();
    const c: Colores = new Colores();
    this.formColores = this.fb.group({
      tonos0: t,
      colores0: c,
      tonos1: t,
      colores1: t,
    });

    this.listFormasCobro();
    this.listarIntereses();

    // Estado de caja desde sesión
    this.abrirCaja();
    this.iniciarStreamCaja();
    this.disabledcobro = this.estadoCajaT;
  }

  get f() {
    return this.formCobrar.controls;
  }

  ngOnDestroy(): void {
    this.streamCajaActivo = false;
    this.cancelarReconexionStreamCaja();
    this.cerrarStreamCaja();
  }

  // =====================
  //   FILTRO EN VIVO
  // =====================
  get filtroActivo(): boolean {
    return !!this.formBuscar?.get('filtro')?.value;
  }
  private configurarFiltroEnVivo(): void {
    this.formBuscar.get('filtro')?.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(valor => this.aplicarFiltro(valor));
  }
  aplicarFiltro(texto: any): void {
    const term = (texto || '').toString().toLowerCase().trim();
    if (!term) {
      this.listaFiltrada = [...(this._sincobro || [])];
      return;
    }

    this.listaFiltrada = (this._sincobro || []).filter((item: any) => {

      // Campos que se muestran en la tabla
      const valores = [
        item.idAbonado,                              // Cuenta
        item.responsablePago,                       // Responsable de pago
        item.idfactura,                             // Planilla
        item.direccion,                             // Dirección
        item.modulo,                                // Módulo
        item.fechaemision,                          // Fecha (sin formatear)
        item.total                                   // Total a cobrar
      ];

      // Buscar si el término aparece en alguno de esos campos
      return valores
        .filter(v => v !== undefined && v !== null)
        .some(v => v.toString().toLowerCase().includes(term));
    });
  }


  // =====================
  //   CAJA / ESTADO
  // =====================

  private isSameYMD(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear()
      && a.getMonth() === b.getMonth()
      && a.getDate() === b.getDate();
  }

  private notify(msg: string) {
    alert(msg);
  }

  abrirCaja(): void {
    this.getAllPtoEmision();

    this.s_cajas
      .getByIdUsuario(this.authService.idusuario)
      .pipe(
        tap((dcaja: any) => {
          if (!dcaja) {
            throw new Error('NO_CAJA');
          }

          this._caja = dcaja;
          this._usuario = dcaja.idusuario_usuarios;
          this._establecimiento = dcaja.idptoemision_ptoemision ?? null;
          this.establecimientoAsignadoId =
            Number(dcaja?.idptoemision_ptoemision?.idptoemision ?? 0) || null;

          const establecimiento = dcaja?.idptoemision_ptoemision?.establecimiento ?? '';
          this._codRecaudador = `${establecimiento}-${dcaja.codigo}`;
        }),
        switchMap((dcaja: any) =>
          this.recaCobroService.getCajaEstado(this.authService.idusuario).pipe(
            switchMap((estadoCaja: any) =>
              this.s_recaudaxcaja.getLastConexion(dcaja.idcaja).pipe(
                tap((drxc: any) => {
                  this.aplicarEstadoCaja(
                    estadoCaja,
                    dcaja?.ultimafact ?? drxc?.facfin ?? 0
                  );
                })
              )
            )
          )
        ),
        catchError((err) => {
          if (err?.message === 'NO_CAJA') {
            this.notify('ESTE USUARIO NO TIENE CAJA REGISTRADA');
            return EMPTY;
          }
          console.error('Error al abrir caja:', err);
          this.notify('Ocurrió un error al abrir la caja. Inténtalo nuevamente.');
          return EMPTY;
        })
      )
      .subscribe();
  }

  // Wrapper para compatibilidad con código antiguo
  __abrirCaja(): void {
    this.abrirCaja();
  }

  private iniciarStreamCaja(): void {
    if (!this.streamCajaActivo) {
      return;
    }
    this.cerrarStreamCaja();
    this.cajaEstadoEventSource = this.recaCobroService.streamCajaEstado(this.authService.idusuario);

    this.cajaEstadoEventSource.addEventListener('caja.estado', ((event: MessageEvent) => {
      this.ngZone.run(() => this.aplicarEstadoCaja(JSON.parse(event.data)));
    }) as EventListener);

    this.cajaEstadoEventSource.addEventListener('caja.secuencial', ((event: MessageEvent) => {
      this.ngZone.run(() => this.aplicarEstadoCaja(JSON.parse(event.data)));
    }) as EventListener);

    this.cajaEstadoEventSource.onerror = () => {
      this.cerrarStreamCaja();
      if (!this.streamCajaActivo) {
        return;
      }
      this.cancelarReconexionStreamCaja();
      this.streamCajaReconnectTimeout = window.setTimeout(() => this.iniciarStreamCaja(), 3000);
    };
  }

  private cerrarStreamCaja(): void {
    if (this.cajaEstadoEventSource) {
      this.cajaEstadoEventSource.close();
      this.cajaEstadoEventSource = null;
    }
  }

  private cancelarReconexionStreamCaja(): void {
    if (this.streamCajaReconnectTimeout !== null) {
      window.clearTimeout(this.streamCajaReconnectTimeout);
      this.streamCajaReconnectTimeout = null;
    }
  }

  private aplicarEstadoCaja(estadoCaja: any, fallbackSecuencial?: number): void {
    const estadoAbierto = Number(estadoCaja?.estado) === 1;
    this.cajaActiva = estadoAbierto;
    this.estadoCajaT = !estadoAbierto;
    this.disabledcobro = this.estadoCajaT;
    sessionStorage.setItem('estadoCaja', estadoAbierto ? '1' : '0');

    const establecimientoEstado = String(estadoCaja?.establecimiento ?? '');
    if (establecimientoEstado) {
      this.seleccionarEstablecimientoPorDefecto(establecimientoEstado);
    } else {
      this.aplicarUltimoPtoEmisionGuardado();
    }

    const nro = Number(
      estadoCaja?.secuencial ??
      estadoCaja?.siguienteSecuencial ??
      fallbackSecuencial ??
      0
    ) || 0;

    if (nro > 0) {
      this.formatNroFactura(nro);
    }
  }

  getAllPtoEmision() {
    this.s_ptoemision.getListaPtoEmision().subscribe({
      next: (datos: any) => {
        this._ptoemision = datos ?? [];
        this.aplicarUltimoPtoEmisionGuardado();
      },
      error: (e: any) => console.error(e),
    });
  }

  changeEstablecimiento(e: any) {
    this._caja.idptoemision_ptoemision = this._establecimiento;
    const establecimiento = this._establecimiento?.establecimiento ?? '';
    this._codRecaudador = `${establecimiento}-${this._caja?.codigo ?? ''}`;
    this.guardarUltimoPtoEmisionSeleccionado(
      Number(this._establecimiento?.idptoemision ?? 0) || null
    );
    const nroActual = Number(this._nroFactura?.split('-', 3)?.[2] ?? 0);
    if (nroActual > 0) {
      this.formatNroFactura(nroActual);
    }
  }

  formatNroFactura(nroFactura: number) {
    const nfactura = `${this._codRecaudador}-${nroFactura
      .toString()
      .padStart(9, '0')}`;
    this._nroFactura = nfactura;
    return nfactura;
  }

  validarCaja() {
    const fecha = new Date();
    const nrofac = this._nroFactura.split('-', 3);
    sessionStorage.setItem('ultfac', nrofac[2]);
    this.recxcaja.estado = 1;
    this.recxcaja.facinicio = +nrofac[2]!;
    this.recxcaja.facfin = +nrofac[2]!;
    this.recxcaja.fechainiciolabor = fecha;
    this.recxcaja.idcaja_cajas = this._caja;
    this.recxcaja.idusuario_usuarios = this._caja.idusuario_usuarios;

    this.s_recaudaxcaja.saveRecaudaxcaja(this.recxcaja).subscribe({
      next: (data: any) => {
        this.estadoCajaT = false;
        this.cajaActiva = true;
        sessionStorage.setItem('estadoCaja', '1');
        this.guardarUltimoPtoEmisionSeleccionado(
          Number(this._establecimiento?.idptoemision ?? 0) || null
        );

        this.s_cajas.updateCaja(this._caja).subscribe({
          next: (datos: any) => {/* window.location.reload() */
          },
        });
      },
      error: (e) => console.error(e),
    });
  }

  cerrarCaja() {
    sessionStorage.setItem('estadoCaja', '0');
    const nrofac = this._nroFactura.split('-', 3);

    this.s_recaudaxcaja.getLastConexion(this._caja.idcaja).subscribe({
      next: (datos) => {
        const c_fecha: Date = new Date();
        this.recxcaja = datos;
        this.recxcaja.estado = 0;
        this.recxcaja.fechafinlabor = c_fecha;
        this.estadoCajaT = true;
        this.cajaActiva = false;
        this.recxcaja.facfin = +nrofac[2]!;

        this.s_recaudaxcaja.updateRecaudaxcaja(this.recxcaja).subscribe({
          next: () => {
            sessionStorage.setItem('ultimafac', '0');
            this.router.navigate(['/inicio']);
          },
          error: (e) => console.error(e),
        });
      },
      error: (e) => console.error(e),
    });
  }

  private obtenerUltimoPtoEmisionGuardado(): number | null {
    const valor = localStorage.getItem(this.ultimoPtoEmisionStorageKey);
    const id = Number(valor);
    return Number.isFinite(id) && id > 0 ? id : null;
  }

  private guardarUltimoPtoEmisionSeleccionado(idptoemision: number | null) {
    const id = Number(idptoemision);
    if (Number.isFinite(id) && id > 0) {
      localStorage.setItem(this.ultimoPtoEmisionStorageKey, String(id));
    }
  }

  private aplicarUltimoPtoEmisionGuardado() {
    if (!Array.isArray(this._ptoemision) || !this._ptoemision.length) {
      return;
    }

    const idGuardado = this.obtenerUltimoPtoEmisionGuardado();
    const seleccionado =
      this._ptoemision.find(
        (item: any) => Number(item?.idptoemision) === Number(idGuardado)
      ) ??
      this._ptoemision.find(
        (item: any) =>
          Number(item?.idptoemision) === Number(this.establecimientoAsignadoId)
      ) ??
      this._ptoemision[0];

    if (!seleccionado) {
      return;
    }

    this._establecimiento = seleccionado;
    this._caja.idptoemision_ptoemision = seleccionado;
    const establecimiento = seleccionado?.establecimiento ?? '';
    this._codRecaudador = `${establecimiento}-${this._caja?.codigo ?? ''}`;
  }

  private seleccionarEstablecimientoPorDefecto(codigo: string) {
    if (!Array.isArray(this._ptoemision) || !this._ptoemision.length) {
      return;
    }

    const seleccionado = this._ptoemision.find(
      (item: any) => String(item?.establecimiento ?? '') === String(codigo ?? '')
    );

    if (!seleccionado) {
      return;
    }

    this._establecimiento = seleccionado;
    this._caja.idptoemision_ptoemision = seleccionado;
    this.guardarUltimoPtoEmisionSeleccionado(
      Number(seleccionado?.idptoemision ?? 0) || null
    );
    const establecimiento = seleccionado?.establecimiento ?? '';
    this._codRecaudador = `${establecimiento}-${this._caja?.codigo ?? ''}`;
  }

  // =====================
  //   FORMAS DE COBRO
  // =====================

  listFormasCobro() {
    this.fcobroService.getAll().subscribe({
      next: (datos) => {
        this._formascobro = datos;
        this.idformacobro = this._formascobro[0].idformacobro;
      },
      error: (err) => console.error(err.error),
    });
  }

  changeFormacobro() {
    const formacobro = this.formCobrar.get('idformacobro')!.value;
    const idformacobro = this.obtenerIdFormaCobro(formacobro);
    this.idformacobro = idformacobro;
    this.formacobroNC = (idformacobro === 3);
  }

  private obtenerIdFormaCobro(formacobro: any): number {
    const id = Number(
      formacobro?.idformacobro ??
      formacobro?.idFormaCobro ??
      formacobro?.id ??
      formacobro
    );
    return Number.isFinite(id) ? id : 0;
  }

  private obtenerFormaCobroPorFactura(factura: any): any {
    const idformacobro = this.obtenerIdFormaCobroFactura(factura);

    return (
      this._formascobro.find(
        (formacobro: any) => Number(formacobro?.idformacobro) === idformacobro
      ) ??
      this._formascobro[0]
    );
  }

  private obtenerIdFormaCobroFactura(factura: any): number {
    const candidatos = [
      factura?.formacobro,
      factura?.formapago,
      factura?.['forma de pago'],
      factura?.formaPago,
      factura?.forma_de_pago,
      factura?.idformacobro,
      factura?.idFormaCobro,
      factura?.idformacobro_formacobro,
      factura?.factura?.formacobro,
      factura?.factura?.formapago,
      factura?.factura?.['forma de pago'],
      factura?.factura?.formaPago,
      factura?.factura?.forma_de_pago,
      factura?.facturas?.formacobro,
      factura?.facturas?.formapago,
      factura?.facturas?.['forma de pago'],
      factura?.facturas?.formaPago,
      factura?.facturas?.forma_de_pago,
      factura?.idfactura?.formacobro,
      factura?.idfactura?.formapago,
      factura?.idfactura?.['forma de pago'],
      factura?.idfactura?.formaPago,
      factura?.idfactura?.forma_de_pago,
      factura?.idfactura_facturas?.formacobro,
      factura?.idfactura_facturas?.formapago,
      factura?.idfactura_facturas?.['forma de pago'],
      factura?.idfactura_facturas?.formaPago,
      factura?.idfactura_facturas?.forma_de_pago,
    ];

    for (const candidato of candidatos) {
      const id = this.obtenerIdFormaCobro(candidato);
      if (id > 0) {
        return id;
      }
    }

    return 0;
  }

  private aplicarFormaCobroFormulario(formacobro: any): void {
    this.idformacobro = this.obtenerIdFormaCobro(formacobro);
    this.formacobroNC = this.idformacobro === 3;
    this.formCobrar.patchValue({ idformacobro: formacobro });
  }

  // =====================
  //   BÚSQUEDA PRINCIPAL
  // =====================

  onSubmit() {
    this.arrCuenta = [];
    this.swcobrado = false;
    this.acobrar = 0;
    this.sumtotal = 0;
    this._cliente = [];
    this.arrFacturas = [];
    this.reset();

    const { cuenta, identificacion, nombre } = this.formBuscar.value;

    if (
      (!cuenta && !identificacion && !nombre)
    ) {
      this.swvalido = 0;
      return;
    }

    this.swvalido = 1;

    if (cuenta) {
      this.aboService.getByIdabonado(cuenta).subscribe({
        next: (datos: any) => {
          this._cliente = datos;
          if (this._cliente.length > 0) {
            this.datosCliente('cuenta');
          } else {
            this.swbusca = 1;
            this.mensaje.campo = 'Cuenta: ';
            this.mensaje.texto = cuenta;
          }
        },
        error: (err) => console.error('Al obtener idabonado: ', err.error),
      });
      return;
    }

    if (identificacion) {
      this.clieService.getByIdentificacion(identificacion).subscribe({
        next: (datos: any[]) => {
          if (!Array.isArray(datos) || datos.length === 0) {
            this._clientes = [];
            alert('⚠️ No se encontraron clientes.');
            return;
          }

          if (datos.length === 1) {
            this._clientes = datos;
            this.selecCliente(datos[0]);
            return;
          }

          this._clientes = datos;
          this.openModal('clientesModal');
          this.formBusClientes.patchValue({ nombre_identifica: datos[0].nombre });
        },
        error: () => alert('❌ Error al buscar clientes.'),
      });
    }
  }

  buscaIdentificacion(identificacion: any) {
    this.acobrar = 0;
    this.clieService.getListaById(identificacion).subscribe({
      next: (datos) => {
        this._cliente = [datos];
        if (this._cliente.length > 0) {
          this.datosCliente('identificacion');
        } else {
          this.swbusca = 1;
          this.mensaje.campo = 'Identificación: ';
          this.mensaje.texto = identificacion;
        }
      },
      error: (err) => console.error('Al buscar la Identificación: ', err.error),
    });
  }

  datosCliente(campo: string) {
    if (campo === 'cuenta') {
      this.cliente.nombre = this._cliente[0].idcliente_clientes.nombre;
      this.cliente.cedula = this._cliente[0].idcliente_clientes.cedula;
      this.cliente.direccion = this._cliente[0].idcliente_clientes.direccion;
      this.cliente.telefono = this._cliente[0].idcliente_clientes.telefono;
      this.cliente.email = this._cliente[0].idcliente_clientes.email;
      this.cliente.porcexonera = this._cliente[0].idcliente_clientes.porcexonera / 100;
      this.cliente.porcdiscapacidad = this._cliente[0].idcliente_clientes.porcdiscapacidad / 100;
      this.sinCobro(this._cliente[0].idcliente_clientes.idcliente);
    }

    if (campo === 'identificacion') {
      this.cliente.nombre = this._cliente[0].nombre;
      this.cliente.cedula = this._cliente[0].cedula;
      this.cliente.direccion = this._cliente[0].direccion;
      this.cliente.telefono = this._cliente[0].telefono;
      this.cliente.email = this._cliente[0].email;
      this.cliente.porcexonera = this._cliente[0].porcexonera / 100;
      this.cliente.porcdiscapacidad = this._cliente[0].porcdiscapacidad / 100;
      this.sinCobro(this._cliente[0].idcliente);
    }
  }

  reiniciar() {
    this.swcobrado = false;
    this.swbusca = 0;
    this.acobrar = 0;
    this.sumtotal = 0;
    this.formBuscar.patchValue({
      cuenta: '',
      identificacion: '',
      filtrar: '',
    });
    this.formCobrar.patchValue({ saldo: 0 });
    this.listaFiltrada = [...(this._sincobro || [])];
  }

  // =====================
  //   PLANILLAS SIN COBRO
  // =====================

  sinCobro(idcliente: number) {
    this.loadingService.showLoading();
    this.swbusca = 0;

    this.facService.getFacSincobro(idcliente).subscribe({
      next: async (sincobrar: any[]) => {
        if (!sincobrar.length) {
          this.swbusca = 2;
          this.loadingService.hideLoading();
          return;
        }

        // Procesar todos los items en paralelo
        await Promise.all(
          sincobrar.map(async (item: any, i: number) => {
            item.interes = Number(await this.cInteres(item)) || 0;
            if (item.idAbonado !== 0 && item.idmodulo !== 27) {
              const abonado: Abonados = await this.getAbonado(item.idAbonado);
              item.direccion = abonado.direccionubicacion;
              item.responsablePago = abonado.idresponsable.nombre;
              const emision: any = await this.getEmision(item.idfactura);
              item.fechaemision = emision;
              item.iva = 0;
            } else {
              const cliente: Clientes = await this.getCliente(item.idCliente);
              item.direccion = cliente.direccion;
              item.responsablePago = cliente.nombre;
              item.fechaemision = item.feccrea;
              const iva: any = await this.calIva(item.idfactura);
              item.iva = (iva.length ? iva[0][1] : 0);
            }
            item.total = Number(item.total) + Number(item.interes) + Number(item.iva);

            this.normalizarSeleccionInicial(item);
          })
        );

        // Ordenar: primero por idAbonado (agrupando), luego por fechaemision dentro de cada grupo
        const listaOrdenada = [...sincobrar].sort((a, b) => {
          // Items sin abonado (idAbonado === 0 o idmodulo === 27) van al final
          const aEsAbonado = a.idAbonado !== 0 && a.idmodulo !== 27;
          const bEsAbonado = b.idAbonado !== 0 && b.idmodulo !== 27;

          if (aEsAbonado && !bEsAbonado) return -1; // a va primero
          if (!aEsAbonado && bEsAbonado) return 1;  // b va primero

          // Ambos son abonados: agrupar por idAbonado
          if (aEsAbonado && bEsAbonado) {
            if (a.idAbonado !== b.idAbonado) {
              return a.idAbonado - b.idAbonado; // Ordenar por idAbonado
            }
            // Mismo abonado: ordenar por fechaemision
            return this.resolveFechaOrdenCobro(a) - this.resolveFechaOrdenCobro(b);
          }

          // Ambos sin abonado: ordenar por fechaemision
          return this.resolveFechaOrdenCobro(a) - this.resolveFechaOrdenCobro(b);
        });

        this._sincobro = listaOrdenada;
        this.listaFiltrada = [...listaOrdenada];

        this.swbusca = 3;
        this.loadingService.hideLoading();
      },
      error: (e) => console.error(e),
    });
  }

  calcular(e: any, factura: any) {
    this.acobrar = 0;
    this.sumtotal = 0;

    if (e.target.checked) {
      this.arrFacturas.push(factura);
    } else {
      const query = this.arrFacturas.find((fact: { idfactura: number }) => fact.idfactura === factura.idfactura);
      const i = this.arrFacturas.indexOf(query);
      if (i >= 0) this.arrFacturas.splice(i, 1);
    }

    this.arrFacturas.forEach((f: any) => {
      this.sumtotal += Number(f.total || 0);
      this.acobrar += Number(f.total || 0);
    });
  }

  async getAbonado(idabonado: number): Promise<any> {
    return this.aboService.getById(idabonado).toPromise();
  }

  async getCliente(idcliente: number): Promise<Clientes> {
    return this.clieService.getListaById(idcliente).toPromise();
  }

  async getEmision(idfactura: number) {
    return this.lecService.findDateByIdfactura(idfactura).toPromise();
  }

  reset() {
    this.cliente.nombre = '';
    this.cliente.cedula = '';
    this.cliente.direccion = '';
    this.cliente.telefono = '';
    this.cliente.email = '';
    this.cliente.porcexonera = null;
    this.cliente.porcdiscapacidad = null;
    this.totInteres = 0;
    this.facturaReferenciaCobro = null;
    this.formCobrar.reset();
    this.formBuscar.patchValue({ filtrar: '' });
    if (this._sincobro) {
      this.listaFiltrada = [...this._sincobro];
    }
  }

  // =====================
  //   BÚSQUEDA CLIENTES (MODAL)
  // =====================

  buscarClientes() {
    const { nombre_identifica } = this.formBusClientes.value;
    if (!nombre_identifica) return;

    this.clieService.getByNombreIdentifi(nombre_identifica).subscribe({
      next: (datos) => (this._clientes = datos),
      error: (err) => console.error(err),
    });
  }

  selecCliente(cliente: Clientes) {
    this.formBuscar.controls['cuenta'].setValue('');
    this.formBuscar.controls['identificacion'].setValue(
      cliente.cedula.toString()
    );
    this.buscaIdentificacion(cliente.idcliente);
    this.closeModal('clientesModal');
  }

  clientesModal() {
    this.swvalido = 1;
    if (this.privez) {
      this.privez = false;
    } else {
      this.formBusClientes.reset();
      this._clientes = [];
    }
  }

  // =====================
  //   MARCAR FACTURAS
  // =====================

  marcarTodas(event: any) {
    const checked = !!event.target.checked;
    const idFormaReferencia = checked
      ? this.obtenerIdFormaCobroSeleccionada() || this.obtenerIdFormaCobroFactura(this._sincobro[0])
      : 0;

    this._sincobro.forEach((item) => {
      item.pagado = checked && this.obtenerIdFormaCobroFactura(item) === idFormaReferencia ? 1 : 0;
    });
    this.facturaReferenciaCobro = checked
      ? this._sincobro.find((item: any) => item.pagado === 1 || item.pagado === true) ?? null
      : null;
    this.totalAcobrar();
  }
  marcarAnteriores(e: any, factura: any) {
    const seleccionada = this._sincobro.find(
      (item: any) => Number(item?.idfactura) === Number(factura?.idfactura)
    ) ?? factura;
    const checked = !!e.target.checked;

    if (checked && !this.esFormaCobroCompatible(seleccionada, seleccionada?.idfactura)) {
      seleccionada.pagado = 0;
      factura.pagado = 0;
      e.target.checked = false;
      this.swal('warning', 'No puedes combinar facturas con diferente forma de pago.');
      this.totalAcobrar();
      return;
    }

    this.ntaCredito(seleccionada.idAbonado, checked);
    const moduloId = this.resolveModuloId(seleccionada);
    const aplicaMarcadoEncadenado =
      ((moduloId === 3 && Number(seleccionada?.idAbonado) > 0) || moduloId === 4);

    if (aplicaMarcadoEncadenado) {
      const idAbonado = Number(seleccionada?.idAbonado);
      const fechaSeleccionada = this.resolveFechaOrdenCobro(seleccionada);
      const idFacturaSeleccionada = Number(seleccionada?.idfactura ?? 0);

      if (seleccionada?.pagado) {
        // Al marcar: incluir solo facturas anteriores o de la misma fecha con menor id.
        this._sincobro.forEach((item: any) => {
          if (Number(item?.idAbonado) !== idAbonado) {
            return;
          }

          const fechaItem = this.resolveFechaOrdenCobro(item);
          const idFacturaItem = Number(item?.idfactura ?? 0);
          const esAnterior =
            fechaItem < fechaSeleccionada ||
            (fechaItem === fechaSeleccionada && idFacturaItem <= idFacturaSeleccionada);

          if (esAnterior) {
            if (this.obtenerIdFormaCobroFactura(item) !== this.obtenerIdFormaCobroFactura(seleccionada)) {
              return;
            }
            item.pagado = 1;
          }
        });
      } else {
        // Al desmarcar: quitar la actual y cualquier factura posterior del mismo abonado.
        this._sincobro.forEach((item: any) => {
          if (Number(item?.idAbonado) !== idAbonado) {
            return;
          }

          const fechaItem = this.resolveFechaOrdenCobro(item);
          const idFacturaItem = Number(item?.idfactura ?? 0);
          const esPosteriorOActual =
            fechaItem > fechaSeleccionada ||
            (fechaItem === fechaSeleccionada && idFacturaItem >= idFacturaSeleccionada);

          if (esPosteriorOActual) {
            item.pagado = 0;
          }
        });
      }
    } else {
      seleccionada.pagado = seleccionada.pagado ? 1 : 0;
    }

    this.totalAcobrar();
    this.facturaReferenciaCobro = checked
      ? seleccionada
      : (this._sincobro || []).find((item: any) => item.pagado === 1 || item.pagado === true) ?? null;
  }

  private normalizarSeleccionInicial(item: any): void {
    if (Number(item?.pagado) === 1 && this.obtenerIdFormaCobroFactura(item) === 4) {
      item.pagado = 0;
    }
  }

  private obtenerIdFormaCobroSeleccionada(idfacturaExcluir?: number): number {
    const seleccionada = (this._sincobro || []).find(
      (item: any) =>
        (item.pagado === 1 || item.pagado === true) &&
        Number(item?.idfactura) !== Number(idfacturaExcluir ?? 0)
    );
    return this.obtenerIdFormaCobroFactura(seleccionada);
  }

  private esFormaCobroCompatible(factura: any, idfacturaExcluir?: number): boolean {
    const idFormaSeleccionada = this.obtenerIdFormaCobroSeleccionada(idfacturaExcluir);
    const idFormaFactura = this.obtenerIdFormaCobroFactura(factura);
    return !idFormaSeleccionada || !idFormaFactura || idFormaSeleccionada === idFormaFactura;
  }

  private resolveModuloId(item: any): number {
    return Number(item?.idmodulo?.idmodulo ?? item?.idmodulo ?? 0);
  }

  private resolveFechaOrdenCobro(item: any): number {
    const fechaBase = item?.fechaemision ?? null;
    const fecha = fechaBase ? new Date(fechaBase) : null;
    const time = fecha?.getTime?.() ?? Number.NaN;
    return Number.isNaN(time) ? 0 : time;
  }

  valCheckBox(sincobro: any, swcobrado: any) {
    const cuenta = Number(sincobro?.idAbonado ?? sincobro?.idabonado ?? 0);
    if (swcobrado === true) {
      return swcobrado;
    } else if (!this.esFormaCobroCompatible(sincobro)) {
      return true;
    } else if (
      cuenta !== this.arrCuenta[0] &&
      this.arrCuenta.length > 0 &&
      cuenta > 0
    ) {
      return true;
    } else {
      return false;
    }
  }

  ntaCredito(cuenta: number, sw: boolean) {
    if (cuenta !== 0 && sw) {
      const find = this.arrCuenta.find((item: number) => item === cuenta);
      if (!find) {
        this.arrCuenta.push(cuenta);
        this.buscarNtaCredito(this.arrCuenta[0]);
      }
    } else if (cuenta !== 0 && !sw) {
      const find = this.arrCuenta.find((item: number) => item === cuenta);
      const i = this.arrCuenta.indexOf(find);
      if (i >= 0) this.arrCuenta.splice(i, 1);

      if (this.arrCuenta.length > 0) {
        this.buscarNtaCredito(this.arrCuenta[0]);
      }
    }
  }

  buscarNtaCredito(cuenta: number) {
    this.s_ntacredito.getSaldosNC(cuenta).subscribe({
      next: (datos: any) => {
        this._nc = datos;
        if (datos.length > 0) {
          this.formCobrar.patchValue({ saldo: datos[0].saldo });
        } else {
          this.formCobrar.patchValue({ saldo: '' });
        }
      },
      error: (e: any) => console.error(e),
    });
  }

  guardarValoresNc(valorNc: any, factura: any): void {
    const notaCredito = this._nc[0];
    const ncvalor = this.formCobrar.value.ncvalor;

    if (!notaCredito || ncvalor == null) {
      console.warn('Datos incompletos para guardar Nota de Crédito');
      return;
    }

    this.s_valorNc
      .saveValoresnc(valorNc)
      .pipe(
        switchMap((valoresNcGuardado: any) => {
          const facxnotacredito = new Facxnc();
          facxnotacredito.idfactura_facturas = factura;
          facxnotacredito.idvaloresnc_valoresnc = valoresNcGuardado;
          return this.s_facnc.saveFacxnc(facxnotacredito);
        }),
        switchMap(() => {
          const nc: NtacreditoUpdate = {
            idntacredito: notaCredito.idntacredito,
            devengado: +notaCredito.devengado! + +ncvalor!,
          };
          return this.s_ntacredito.updateNotaCredito(nc);
        }),
        tap(() => { })
      )
      .subscribe({
        error: (e: any) =>
          console.error(
            'Error en el proceso de guardado de Nota de Crédito:',
            e
          ),
      });
  }

  totalAcobrar() {
    let suma = 0;
    this._sincobro.forEach((item) => {
      if (item.pagado === true || item.pagado === 1) {
        suma += Number(item.total || 0);
      }
    });
    this.acobrar = +suma.toFixed(2)!;
  }

  // =====================
  //   COBRO
  // =====================

  valorAcobrar(acobrar: number) {
    this.disabledcobro = true;
    const entero = Math.trunc(acobrar);
    const decimal = (acobrar - entero).toFixed(2);
    this.acobrardec = decimal.toString().slice(1);


    const referenciaSeleccionada =
      this.facturaReferenciaCobro &&
      (this.facturaReferenciaCobro.pagado === 1 || this.facturaReferenciaCobro.pagado === true)
        ? this.facturaReferenciaCobro
        : this._sincobro.find((registro: any) => registro.pagado === 1 || registro.pagado === true);

    const fcobro = this.obtenerFormaCobroPorFactura(referenciaSeleccionada);
    this.formCobrar.patchValue({
      valorAcobrar: acobrar,
      acobrar: entero,
      dinero: '',
      vuelto: '',
      ncvalor: '',
    });
    this.aplicarFormaCobroFormulario(fcobro);
  }

  valorDinero() {
    this.formacobroNC = false;
    this.formCobrar.controls['ncvalor'].setValue('');
    this.formCobrar.controls['dinero'].setValue(
      this.acobrar.toFixed(2).toString()
    );
    this.formCobrar.controls['vuelto'].setValue('');
    this.disabledcobro = false;
  }

  private limpiarFormularioCobro(): void {
    const formaCobroActual =
      this.formCobrar.get('idformacobro')?.value ??
      this._formascobro.find(
        (formacobro: any) =>
          Number(formacobro?.idformacobro) === Number(this.idformacobro)
      ) ??
      this._formascobro[0] ??
      this.formaCobro;

    this.formCobrar.reset();
    this.formCobrar.patchValue({
      idformacobro: formaCobroActual,
      valorAcobrar: 0,
      acobrar: 0,
      dinero: '',
      vuelto: '',
      ncvalor: '',
      saldo: '',
    });

    this.aplicarFormaCobroFormulario(formaCobroActual);
    this.disabledcobro = true;
  }


  async cobrar() {
    if (this.procesandoCobro) {
      return;
    }

    const fecha = new Date();
    const seleccionadas = (this._sincobro || []).filter(
      (item: any) => item.pagado === 1 || item.pagado === true
    );

    if (!seleccionadas.length) {
      this.swal('warning', 'Selecciona al menos una factura para cobrar.');
      return;
    }

    const recaudacion = {} as iRecaudacion;
    recaudacion.fechacobro = fecha;
    recaudacion.recaudador = this.authService.idusuario;
    recaudacion.totalpagar = +this.formCobrar.value.valorAcobrar;
    recaudacion.recibo = +this.formCobrar.value.dinero;
    recaudacion.cambio = +this.formCobrar.value.vuelto;
    const idformacobro = this.obtenerIdFormaCobro(
      this.formCobrar.get('idformacobro')!.value
    ) || this.idformacobro;
    this.idformacobro = idformacobro;
    recaudacion.formapago = idformacobro;
    recaudacion.valor = +this.formCobrar.value.valorAcobrar;
    recaudacion.estado = 1;
    recaudacion.ncvalor = +this.formCobrar.value.ncvalor;
    recaudacion.usucrea = this.authService.idusuario;
    recaudacion.feccrea = fecha;

    this.procesandoCobro = true;
    seleccionadas.forEach((item: any) => {
      item.procesando = true;
      item.procesada = false;
    });

    this.recaCobroService
      .cobrarFacturas({
        facturas: seleccionadas.map((item: any) => item.idfactura),
        autentification: this.authService.idusuario,
        recaudacion,
        idcaja: this._caja?.idcaja,
      })
      .subscribe({
        next: (resp: any) => {
          const facturasResp = Array.isArray(resp?.facturas) ? resp.facturas : [];
          const porId = new Map<number, any>(
            facturasResp.map((item: any) => [Number(item?.idfactura), item] as [number, any])
          );

          seleccionadas.forEach((item: any) => {
            const actualizada = porId.get(Number(item.idfactura));
            if (actualizada) {
              item.nrofactura = actualizada.nrofactura ?? item.nrofactura;
              item.fechacobro = actualizada.feccrea ?? item.fechacobro;
              if (actualizada.interescobrado != null) {
                item.interes = this.normalizarValorMonetario(actualizada.interescobrado);
              }
            }
            item.procesando = false;
            item.procesada = true;
          });

          if (resp?.numeroFacturaSiguiente) {
            this._nroFactura = resp.numeroFacturaSiguiente;
          }

          if (resp?.caja) {
            this.recxcaja = { ...this.recxcaja, ...resp.caja };
          }

          this.procesandoCobro = false;
          this.swcobrado = true;
          this.limpiarFormularioCobro();
          this.closeModal('modalCobrar');
          this.swal('success', 'Recaudación cobrada y factura electrónica generada con éxito.');
        },
        error: (err) => {
          seleccionadas.forEach((item: any) => {
            item.procesando = false;
          });
          this.procesandoCobro = false;
          console.error('Error al cobrar facturas:', err?.error ?? err);
          this.swal('error', 'Ocurrió un problema al procesar las facturas.');
        },
      });
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

  // =====================
  //   FACxRECAUDA
  // =====================

  facxrecauda(recaCreada: Recaudacion, i: number): Promise<void> {
    return new Promise((resolve, reject) => {

      const avanzar = async (idx: number) => {
        if (idx >= this._sincobro.length) {
          resolve();
          return;
        }

        const item = this._sincobro[idx];

        if (item.pagado !== 1 && item.pagado !== true) {
          item.procesando = false;
          avanzar(idx + 1);
          return;
        }

        item.procesando = true;

        const idfactura: number = item.idfactura;
        const valfactura: number = Number(item.total || 0);
        const fechacobro: Date = new Date();
        const horaActual: string =
          `${new Date().getHours()}:${new Date().getMinutes()}:${new Date().getSeconds()}`;

        this.facService.getById(idfactura).subscribe({
          next: async (fac: any) => {
            fac.valornotacredito = this.calcularNCByFactura(valfactura, this.valorNtaCredito);

            const facxr = {} as iFacxrecauda;
            facxr.idrecaudacion = recaCreada;
            facxr.idfactura = fac;
            facxr.estado = 1;

            this.facxrService.save(facxr).subscribe({
              next: () => {
                this.rubxfacService.getIva(this.iva, fac.idfactura).subscribe({
                  next: async (iva: any) => {
                    fac.swiva = (iva && iva[0]) ? iva[0][1] : 0;
                    fac.fechacobro = fechacobro;
                    fac.horacobro = horaActual;

                    const idFormaCobroFactura = this.obtenerIdFormaCobroFactura(item);
                    if (this.swNC === true) {
                      fac.formapago = 3;
                    } else if (idFormaCobroFactura > 0) {
                      fac.formapago = idFormaCobroFactura;
                    }

                    fac.usuariocobro = this.authService.idusuario;
                    fac.interescobrado = item.interes;
                    fac.pagado = 1;
                    fac.estado = (fac.estado === 2) ? 2 : 1;

                    // =====================
                    // ASIGNACIÓN SEGURA DEL NÚMERO DE FACTURA
                    // =====================
                    if (fac.nrofactura === null) {
                      try {
                        // 1. Leer el último número desde recaudaxcaja (fuente de verdad)
                        const rxcActual: any = await this.s_recaudaxcaja
                          .getLastConexion(this._caja.idcaja)
                          .toPromise();

                        // 2. Incrementar secuencialmente desde la fuente de verdad
                        const nrofac_f = rxcActual.facfin + 1;

                        // 3. Actualizar recaudaxcaja ANTES de continuar (await garantiza secuencia)
                        rxcActual.facfin = nrofac_f;
                        await this.s_recaudaxcaja
                          .updateRecaudaxcaja(rxcActual)
                          .toPromise();

                        // 4. Actualizar el estado local y formatear el número
                        this.recxcaja = rxcActual;
                        this.formatNroFactura(nrofac_f);

                        // 5. Asignar el número a la factura
                        fac.nrofactura =
                          `${this._codRecaudador}-${nrofac_f.toString().padStart(9, '0')}`;

                        sessionStorage.setItem(
                          'ultfac',
                          nrofac_f.toString().padStart(9, '0')
                        );
                      } catch (err) {
                        item.procesando = false;
                        reject(err);
                        return;
                      }
                    }

                    this.facService.updateFacturas(fac).subscribe({
                      next: async (nex: any) => {
                        if (this._nc.length > 0 && fac.valornotacredito > 0) {
                          const valoresnc: Valoresnc = new Valoresnc();
                          valoresnc.estado = 1;
                          valoresnc.idntacredito_ntacredito = this._nc[0];
                          valoresnc.valor = this.formCobrar.value.ncvalor;
                          valoresnc.fechaaplicado = new Date();
                          valoresnc.saldo =
                            this._nc[0].saldo - this.formCobrar.value.ncvalor;
                          this.guardarValoresNc(valoresnc, nex);
                        }

                        this.swcobrado = true;

                        if (nex.idmodulo.idmodulo !== 27 || nex.interescobrado > 0) {
                          await this.guardarRubroInteres(fac.idfactura, item.interes);
                        }
                        item.procesando = false;
                        item.procesada = true;

                        avanzar(idx + 1);
                      },
                      error: (err) => {
                        item.procesando = false;
                        reject(err?.error ?? err);
                      },
                    });
                  },
                  error: (e) => {
                    item.procesando = false;
                    reject(e);
                  },
                });
              },
              error: (err) => {
                item.procesando = false;
                reject(err?.error ?? err);
              },
            });
          },
          error: (err) => {
            item.procesando = false;
            reject(err?.error ?? err);
          },
        });
      };

      avanzar(i);
    });
  }

  // Versiones antiguas delegando
  _facxrecauda(recaCreada: Recaudacion, i: number): Promise<void> {
    return this.facxrecauda(recaCreada, i);
  }

  __facxrecauda(recaCreada: Recaudacion, i: number): Promise<void> {
    return this.facxrecauda(recaCreada, i);
  }

  async saveRubxFac(idfactura: any, idrubro: any, valorunitario: any) {
    const rubrosxfac: Rubroxfac = new Rubroxfac();
    rubrosxfac.idfactura_facturas = idfactura;
    rubrosxfac.idrubro_rubros = idrubro;
    rubrosxfac.valorunitario = valorunitario;
    rubrosxfac.cantidad = 1;
    rubrosxfac.estado = 1;
    await this.rubxfacService.saveRubroxfacAsync(rubrosxfac);
  }

  private async obtenerInteresesTemporales(seleccionadas: any[]): Promise<Map<number, number>> {
    const intereses = new Map<number, number>();

    for (const item of seleccionadas) {
      const idfactura = Number(item?.idfactura ?? 0);
      if (!Number.isFinite(idfactura) || idfactura <= 0) {
        continue;
      }

      const interesTmp = this.normalizarValorMonetario(
        await this.interService.getInteresFactura(idfactura)
      );
      intereses.set(idfactura, interesTmp);
      item.interes = interesTmp;
    }

    return intereses;
  }

  private async persistirInteresesRecaudacion(
    seleccionadas: any[],
    interesesPorFactura: Map<number, number>
  ): Promise<void> {
    for (const item of seleccionadas) {
      const idfactura = Number(item?.idfactura ?? 0);
      if (!Number.isFinite(idfactura) || idfactura <= 0) {
        continue;
      }

      const interesTmp = this.normalizarValorMonetario(
        interesesPorFactura.get(idfactura) ?? item?.interes ?? 0
      );
      const interesCobrado = await this.obtenerInteresCobradoFactura(
        idfactura,
        interesTmp
      );
      item.interes = interesCobrado;

      await this.actualizarFacturaConInteres(idfactura, interesCobrado, item);
      await this.guardarRubroInteres(idfactura, interesTmp);
    }
  }

  private async actualizarFacturaConInteres(idfactura: number, interes: number, item: any): Promise<void> {
    const factura = await firstValueFrom(this.facService.getById(idfactura));
    const idFormaCobroFormulario = this.obtenerIdFormaCobro(
      this.formCobrar.get('idformacobro')!.value
    );
    const idFormaCobroFactura = this.obtenerIdFormaCobroFactura(item);

    factura.interescobrado = this.normalizarValorMonetario(interes);

    if (idFormaCobroFormulario === 3 || this.swNC === true) {
      factura.formapago = 3;
    } else if (idFormaCobroFactura > 0) {
      factura.formapago = idFormaCobroFactura;
    }

    await firstValueFrom(this.facService.updateFacturas(factura));
  }

  private async guardarRubroInteres(idfactura: number, interes: number): Promise<void> {
    const rubroInteresId = 5;
    const interesNormalizado = this.normalizarValorMonetario(interes);
    const detalle = await this.rubxfacService.getByIdfacturaAsync(idfactura);
    const rubrosInteres = (detalle || []).filter(
      (rubro: any) =>
        Number(rubro?.idrubro_rubros?.idrubro ?? rubro?.idrubro_rubros) === rubroInteresId
    );
    const rubroInteresExistente =
      rubrosInteres.find((rubro: any) => Number(rubro?.estado ?? 1) !== 0) ??
      rubrosInteres[0];

    if (rubroInteresExistente) {
      rubroInteresExistente.valorunitario = interesNormalizado;
      rubroInteresExistente.cantidad = 1;
      rubroInteresExistente.estado = interesNormalizado > 0 ? 1 : 0;
      await firstValueFrom(
        this.rubxfacService.updateRubroxfac(
          rubroInteresExistente.idrubroxfac,
          rubroInteresExistente
        )
      );

      const duplicados = rubrosInteres.filter(
        (rubro: any) => rubro?.idrubroxfac !== rubroInteresExistente.idrubroxfac
      );
      for (const duplicado of duplicados) {
        duplicado.valorunitario = 0;
        duplicado.cantidad = 1;
        duplicado.estado = 0;
        await firstValueFrom(
          this.rubxfacService.updateRubroxfac(duplicado.idrubroxfac, duplicado)
        );
      }
      return;
    }

    if (interesNormalizado <= 0) {
      return;
    }

    const factura = await firstValueFrom(this.facService.getById(idfactura));
    const rubro = new Rubros();
    rubro.idrubro = rubroInteresId;
    await this.saveRubxFac(factura, rubro, interesNormalizado);
  }

  private async obtenerInteresCobradoFactura(
    idfactura: number,
    interesCalculado: number
  ): Promise<number> {
    const rubroInteresId = 5;
    const detalle = await this.rubxfacService.getByIdfacturaAsync(idfactura);
    const rubroInteresExistente = (detalle || [])
      .filter(
        (rubro: any) =>
          Number(rubro?.estado ?? 1) !== 0 &&
          Number(rubro?.idrubro_rubros?.idrubro ?? rubro?.idrubro_rubros) ===
            rubroInteresId
      )
      .reduce((acumulado: number, rubro: any) => {
        const cantidad = this.obtenerNumeroDetalle(rubro?.cantidad ?? 1);
        const valor = this.obtenerNumeroDetalle(rubro?.valorunitario ?? 0);
        return acumulado + cantidad * valor;
      }, 0);

    return this.normalizarValorMonetario(
      this.normalizarValorMonetario(interesCalculado) + rubroInteresExistente
    );
  }

  private normalizarValorMonetario(value: any): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return 0;
    }
    return Math.round(parsed * 100) / 100;
  }

  // =====================
  //   COLORES (UI)
  // =====================

  tonos() {
    setTimeout(() => {
      this.coloService.getTonos().subscribe({
        next: (datos) => {
          this._tonoscabecera = datos;
          this._tonosdetalle = datos;
          const defaultValue0 = this._tonoscabecera.find(
            (tono: { idcolor: number }) => tono.idcolor === 143
          );
          const defaultValue2 = this._tonosdetalle.find(
            (tono2: { idcolor: number }) => tono2.idcolor === 125
          );
          this.formColores = this.fb.group({
            tonos0: defaultValue0,
            colores0: new Colores(),
            tonos1: defaultValue2,
            colores1: new Colores(),
          });
          this.coloService
            .getByTono(this.formColores.value.tonos0.codigo)
            .subscribe({
              next: (resp) => {
                this._colorescabecera = resp;
                const defaultValue1 = this._colorescabecera.find(
                  (color: { idcolor: number }) => color.idcolor === 152
                );
                this.coloService
                  .getByTono(this.formColores.value.tonos1.codigo)
                  .subscribe({
                    next: (resp1) => {
                      this._coloresdetalle = resp1;
                      const defaultValue3 = this._coloresdetalle.find(
                        (color1: { idcolor: number }) => color1.idcolor === 131
                      );
                      this.formColores = this.fb.group({
                        tonos0: defaultValue0,
                        colores: defaultValue1,
                        tonos1: defaultValue2,
                        colores1: defaultValue3,
                      });
                    },
                    error: (err) =>
                      console.error(
                        'Al recuperar los Colores por Tono',
                        err.error
                      ),
                  });
              },
              error: (err) =>
                console.error('Al recuperar los Colores por Tono', err.error),
            });
        },
        error: (err) => console.error('Al recuperar los Tonos', err.error),
      });
    }, 500);

    const tonocabecera = document.getElementById(
      'tonocabecera'
    ) as HTMLSelectElement;
    tonocabecera.addEventListener('change', () => {
      this._colorescabecera = [];
      this.coloService
        .getByTono(this.formColores.value.tonos0.codigo)
        .subscribe({
          next: (datos) => (this._colorescabecera = datos),
          error: (err) =>
            console.error('Al recuperar los Colores por Tono', err.error),
        });
    });

    const tono1 = document.getElementById('tonodetalle') as HTMLSelectElement;
    tono1.addEventListener('change', () => {
      this._coloresdetalle = [];
      this.coloService
        .getByTono(this.formColores.value.tonos1.codigo)
        .subscribe({
          next: (datos) => (this._coloresdetalle = datos),
          error: (err) =>
            console.error('Al recuperar los Colores por Tono', err.error),
        });
    });
  }

  // =====================
  //   VALIDACIONES
  // =====================

  valDinero(control: AbstractControl) {
    const ncvalor = +this.formCobrar.controls['ncvalor'].value || 0;
    const valorAcobrar = +this.formCobrar.value.valorAcobrar || 0;
    const valorActual = +control.value || 0;
    if (valorAcobrar - ncvalor > valorActual) {
      return of({ invalido: true });
    }
    return of(null);
  }

  listarIntereses() {
    this.interService.getListaIntereses().subscribe({
      next: (datos) => {
        this._intereses = datos;
      },
      error: (err) => console.error(err.error),
    });
  }

  get hayProcesando(): boolean {
    return !!this._sincobro?.some((s: any) => !!s.procesando);
  }

  get hayProcesadas(): boolean {
    return !!this._sincobro?.some((s: any) => !!s.procesada);
  }

  get deshabilitarImprimirTodo(): boolean {
    return !this.swcobrado || this.hayProcesando || !this.hayProcesadas;
  }

  get dataTargetPdf(): string | null {
    return this.otraPagina ? null : '#pdf';
  }

  cInteres(factura: any) {
    return this.interService.getInteresFactura(factura.idfactura);
  }

  async calIva(idfactura: any) {
    return this.rubxfacService.getIva(0.15, idfactura).toPromise();
  }

  valorTarifas(
    tarifa: number,
    cons: number,
    interes: number,
    multa: number,
    modulo: number,
    valorbase: number,
    sincobro: any
  ) {
    if (modulo === 8) {
      return valorbase;
    } else if (
      sincobro.idmodulo.idmodulo === 3 &&
      (sincobro.idabonado === 0 || sincobro.idabonado == null)
    ) {
      return valorbase;
    } else {
      const t = tarifa || 0;
      const c = cons || 0;
      const i = interes || 0;
      const m = multa || 0;
      return t + c + i + m;
    }
  }

  changeNCvalor(e: any) {
    this.valorNtaCredito = +e.target.value!;
    let dinero: number;
    if (+this.formCobrar.controls['dinero'].value > 0)
      dinero = +this.formCobrar.controls['dinero'].value;
    else dinero = 0;
    const vuelto = (
      +this.formCobrar.controls['ncvalor'].value +
      dinero -
      this.acobrar
    ).toFixed(2);
    this.formCobrar.controls['vuelto'].setValue(vuelto.toString());
    this.disabledcobro = this.formCobrar.controls['vuelto'].value != 0;
  }

  calcularNCByFactura(vfactura: number, vnc: number): number {
    if (vnc > 0) {
      if (vfactura === vnc) {
        this.valorNtaCredito = vnc - vfactura;
        return vnc;
      } else if (vfactura < vnc) {
        this.valorNtaCredito = vnc - vfactura;
        return vfactura;
      } else if (vfactura > vnc) {
        this.valorNtaCredito = 0;
        return vnc;
      } else {
        return 0;
      }
    } else {
      return 0;
    }
  }

  valNC(control: AbstractControl) {
    if (
      this.formCobrar.value.valorAcobrar < control.value ||
      control.value > +this.formCobrar.value.saldo!
    ) {
      this.swNC = false;
      return of({ invalido: true });
    } else {
      this.swNC = true;
      return of(null);
    }
  }

  SaldoNC(control: AbstractControl) {
    if (this.formCobrar.value.saldo <= 0) return of({ invalido: true });
    else return of(null);
  }

  changeDinero() {
    let ncvalor: number;
    if (+this.formCobrar.controls['ncvalor'].value > 0)
      ncvalor = +this.formCobrar.controls['ncvalor'].value;
    else ncvalor = 0;
    const vuelto = (
      +this.formCobrar.controls['dinero'].value +
      ncvalor -
      this.acobrar
    ).toFixed(2);
    this.formCobrar.controls['vuelto'].setValue(vuelto.toString());
    this.disabledcobro = this.formCobrar.controls['vuelto'].value < 0;
  }

  private filtrarRubrosActivos(rubros: any[]): any[] {
    return (rubros || []).filter((item: any) => item?.estado !== 0);
  }

  getRubroxfacReimpresion(idfactura: number, interes: number) {
    this.totfac = 0;
    this.rubxfacService.getDetalleByIdfactura(+idfactura!).subscribe({
      next: (detalle: any) => {
        this._rubrosxfac = this.filtrarRubrosActivos(detalle);
        this._subtotal(interes);
      },
      error: (err) => console.error(err),
    });
  }
  getRubroxfac(idfactura: number, idmodulo?: any, sincobro?: any) {
    this.idfactura = idfactura;
    this.valoriva = this.obtenerNumeroDetalle(sincobro?.iva);
    this.totInteres = this.obtenerNumeroDetalle(sincobro?.interes);
    let interes = this.totInteres;
    this.consumo = this.obtenerNumeroDetalle(sincobro?.consumo);
    this.getRubroxfacReimpresion(idfactura, interes);
  }
  reImpComprobante(datos: any) {
    this.impComprobante(datos);
  }

  _subtotal(interes: any) {
    const totalRubros = (this._rubrosxfac || []).reduce(
      (total: number, rubro: any) => total + this.getTotalRubroDetalle(rubro),
      0
    );
    this.totfac =
      totalRubros +
      this.obtenerNumeroDetalle(this.valoriva) +
      this.obtenerNumeroDetalle(interes);
  }

  getCantidadRubroDetalle(rubro: any): number {
    const cantidad = this.obtenerNumeroDetalle(
      rubro?.cantidad ??
        rubro?.cant ??
        rubro?.qty ??
        rubro?.cantidadrubro ??
        rubro?.cantidad_rubro
    );
    return cantidad > 0 ? cantidad : 1;
  }

  getValorUnitarioRubroDetalle(rubro: any): number {
    const valor = this.obtenerNumeroDetalle(
      rubro?.valorunitario ??
        rubro?.valorUnitario ??
        rubro?.preciounitario ??
        rubro?.precioUnitario ??
        rubro?.valor ??
        rubro?.monto
    );
    if (valor > 0) {
      return valor;
    }

    const total = this.obtenerNumeroDetalle(
      rubro?.totalRubro ??
        rubro?.totalrubro ??
        rubro?.subtotal ??
        rubro?.total ??
        rubro?.importe
    );
    return total > 0 ? total / this.getCantidadRubroDetalle(rubro) : 0;
  }

  getTotalRubroDetalle(rubro: any): number {
    const totalGuardado = this.obtenerNumeroDetalle(rubro?.totalRubro ?? rubro?.totalrubro);
    if (totalGuardado > 0) {
      return totalGuardado;
    }

    return this.getCantidadRubroDetalle(rubro) * this.getValorUnitarioRubroDetalle(rubro);
  }

  getDescripcionRubroDetalle(rubro: any): string {
    return (
      rubro?.idrubro_rubros?.descripcion ||
      rubro?.idrubro_rubros?.nombre ||
      (typeof rubro?.idrubro_rubros === 'string' ? rubro.idrubro_rubros : '') ||
      rubro?.descripcion ||
      rubro?.rubro ||
      rubro?.nombre ||
      'Rubro'
    );
  }

  private obtenerNumeroDetalle(value: any): number {
    if (typeof value === 'string') {
      const cleanValue = value.trim();
      if (!cleanValue) {
        return 0;
      }

      let normalized = cleanValue.replace(/[^0-9,.-]/g, '');
      const lastComma = normalized.lastIndexOf(',');
      const lastDot = normalized.lastIndexOf('.');

      if (lastComma >= 0 && lastDot >= 0) {
        normalized =
          lastComma > lastDot
            ? normalized.replace(/\./g, '').replace(',', '.')
            : normalized.replace(/,/g, '');
      } else if (lastComma >= 0) {
        normalized = normalized.replace(',', '.');
      }

      const parsed = Number(normalized);
      return Number.isFinite(parsed) ? parsed : 0;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  // =====================
  //   IMPRESIÓN
  // =====================

  private delay(ms: number) {
    return new Promise(res => setTimeout(res, ms));
  }

  async imprimirTodasProcesadas() {
    try {
      const lista = (this._sincobro || []).filter((s: any) => s.procesada && s.pagado);

      if (!lista.length) {
        this.swal('info', 'No hay facturas procesadas para imprimir.');
        return;
      }

      for (const item of lista) {
        const blob = await this.generarComprobanteBlob(item);
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `Comprobante_${item.idfactura}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();

        URL.revokeObjectURL(url);
        await this.delay(250);
      }

      this.swal('success', 'Se generaron los comprobantes procesados.');
    } catch (e) {
      console.error('Error en impresión masiva:', e);
      this.swal('error', 'Ocurrió un problema al imprimir los comprobantes.');
    }
  }

  private async generarComprobanteBlob(datos: any): Promise<Blob> {
    return this.s_jasperReport.getComprobantePago(datos.idfactura);
  }

  private limpiarVistaPdf() {
    if (this.pdfPreviewObjectUrl) {
      URL.revokeObjectURL(this.pdfPreviewObjectUrl);
      this.pdfPreviewObjectUrl = null;
    }

    const iframe = document.getElementById('pdfViewerRecaudacion') as HTMLIFrameElement | null;
    if (iframe) {
      iframe.src = '';
    }
  }

  private abrirVistaPdf(pdf: Blob) {
    this.limpiarVistaPdf();
    this.pdfPreviewObjectUrl = this.s_jasperReport.openPdfInViewer(pdf, 'pdfViewerRecaudacion');
    this.openModal('modalVistaPdf');
  }

  async impComprobante(datos: any) {
    try {
      const reporte = await this.s_jasperReport.getComprobantePago(datos.idfactura);
      const file = reporte instanceof Blob ? reporte : new Blob([reporte], { type: 'application/pdf' });
      this.abrirVistaPdf(file);
    } catch (e) {
      console.error(e);
      this.swal('error', 'No se pudo generar el comprobante.');
    }
  }

  // versión vieja -> delega
  async _impComprobante(datos: any) {
    await this.impComprobante(datos);
  }

  async imprimirTodasEnUno() {
    try {
      const items: MergeItem[] = (this._sincobro || [])
        .filter((s: any) => s.procesada && s.pagado)
        .map((s: any) => ({
          idfactura: s.idfactura,
          idmodulo: s.idmodulo,
          idAbonado: s.idAbonado,
        }));

      if (!items.length) {
        this.swal('info', 'No hay facturas procesadas para unificar.');
        return;
      }

      const reporte = await this.s_jasperReport.mergeComprobantes({ items });
      const blob = reporte instanceof Blob ? reporte : new Blob([reporte], { type: 'application/pdf' });
      this.abrirVistaPdf(blob);
      this.swal('success', 'PDF unificado generado.');
    } catch (e) {
      console.error(e);
      this.swal('error', 'No se pudo generar el PDF unificado.');
    }
  }

  imprimirVistaPdf() {
    const iframe = document.getElementById('pdfViewerRecaudacion') as HTMLIFrameElement | null;
    const win = iframe?.contentWindow;
    if (!win) {
      this.swal('warning', 'Primero genera un comprobante para visualizarlo.');
      return;
    }

    win.focus();
    win.print();
  }

  cerrarVistaPdf() {
    this.closeModal('modalVistaPdf');
    this.limpiarVistaPdf();
  }

  // =====================
  //   MODALES
  // =====================

  openModal(id: string) {
    const modal = document.getElementById(id);
    if (!modal) return;

    modal.classList.add('show');
    modal.setAttribute('aria-hidden', 'false');
    modal.setAttribute('aria-modal', 'true');
    modal.style.display = 'block';

    document.body.classList.add('modal-open');

    const bd = document.createElement('div');
    bd.className = 'modal-backdrop fade show';
    bd.setAttribute('data-backdrop-id', id);
    document.body.appendChild(bd);
  }

  closeModal(id: string) {
    const modal = document.getElementById(id);
    if (!modal) return;

    modal.classList.remove('show');
    modal.setAttribute('aria-hidden', 'true');
    modal.removeAttribute('aria-modal');
    modal.style.display = 'none';

    const bd = document.querySelector(`.modal-backdrop[data-backdrop-id="${id}"]`);
    if (bd && bd.parentNode) bd.parentNode.removeChild(bd);

    document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());

    document.body.classList.remove('modal-open');
    document.body.style.removeProperty('overflow');
    document.body.style.removeProperty('padding-right');
  }

}


// =====================
//   INTERFACES
// =====================

interface Cliente {
  idcliente: number;
  nombre: string;
  cedula: string;
  direccion: string;
  telefono: string;
  email: string;
  porcexonera: number | null;
  porcdiscapacidad: number | null;
}

interface Mensaje {
  campo: string;
  texto: string;
}

interface calcInteres {
  anio: number;
  mes: number;
  interes: number;
  valor: number;
}

interface iRecaudacion {
  idrecaudacion: number;
  fechacobro: Date;
  recaudador: number;
  totalpagar: number;
  recibo: number;
  cambio: number;
  formapago: number;
  valor: number;
  estado: number;
  fechaeliminacion: Date;
  usuarioeliminacion: number;
  observaciones: string;
  ncnumero: number;
  ncvalor: number;
  usucrea: number;
  feccrea: Date;
}

interface iFacxrecauda {
  idfacxrecauda: number;
  idrecaudacion: Recaudacion;
  idfactura: Facturas;
  estado: number;
  fechaeliminacion: Date;
  usuarioeliminacion: number;
}

interface NtacreditoUpdate {
  idntacredito: number;
  devengado: number;
}

interface SincobroItem {
  idfactura: number;
  total: number;
  interes: number;
  pagado: boolean | number;
  estado?: number;
  procesando?: boolean;
}
