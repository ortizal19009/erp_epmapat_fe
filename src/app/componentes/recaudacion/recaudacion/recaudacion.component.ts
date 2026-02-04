import { Component, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { catchError, debounceTime, distinctUntilChanged, EMPTY, of, switchMap, tap } from 'rxjs';

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

import Swal from 'sweetalert2';

@Component({
  selector: 'app-recaudacion',
  templateUrl: './recaudacion.component.html',
  styleUrls: ['./recaudacion.component.css'],
})
export class RecaudacionComponent implements OnInit {

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
  disabledcobro = true;
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
    private s_modulo: ModulosService,
    private loadingService: LoadingService,
    private s_ntacredito: NtacreditoService,
    private s_valorNc: ValoresncService,
    private s_facnc: FacxncService,
    private s_jasperReport: JasperReportService,
    private s_ptoemision: PtoemisionService,
    private s_definir: DefinirService,
    private s_fecfacturas: FecfacturaService,
    private router: Router
  ) { }

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
    const getEstadoCaja = sessionStorage.getItem('estadoCaja');
    if (getEstadoCaja !== '0') {
      this.abrirCaja();
    }
    this.disabledcobro = this.estadoCajaT;
  }

  get f() {
    return this.formCobrar.controls;
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
    //console.log('Aplicando filtro con término:', term);

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
        (item.total + item.interes + item.iva)      // Total a cobrar
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

          const establecimiento = dcaja?.idptoemision_ptoemision?.establecimiento ?? '';
          this._codRecaudador = `${establecimiento}-${dcaja.codigo}`;
        }),
        switchMap((dcaja: any) =>
          this.s_recaudaxcaja.getLastConexion(dcaja.idcaja).pipe(
            tap((drxc: any) => {
              if (!drxc) {
                this.cajaActiva = false;
                this.estadoCajaT = true;
                if (dcaja?.ultimafact) {
                  this.formatNroFactura(dcaja.ultimafact);
                }
                return;
              }

              const hoy = new Date();
              const inicio = new Date(drxc.fechainiciolabor);
              const estadoCaja = sessionStorage.getItem('estadoCaja');

              const mismaFecha = this.isSameYMD(hoy, inicio);
              this.cajaActiva = (mismaFecha && estadoCaja !== '0');
              this.estadoCajaT = !this.cajaActiva;

              const nro = dcaja?.ultimafact ?? drxc?.facfin;
              if (nro) {
                this.formatNroFactura(nro);
              }
            })
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

  getAllPtoEmision() {
    this.s_ptoemision.getListaPtoEmision().subscribe({
      next: (datos: any) => (this._ptoemision = datos),
      error: (e: any) => console.error(e),
    });
  }

  changeEstablecimiento(e: any) {
    this._caja.idptoemision_ptoemision = this._establecimiento;
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
      next: () => {
        this.estadoCajaT = false;
        sessionStorage.setItem('estadoCaja', '1');
        this.s_cajas.updateCaja(this._caja).subscribe({
          next: () => window.location.reload(),
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
    this.idformacobro = formacobro.idformacobro;
    this.formacobroNC = (formacobro.idformacobro === 3);
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
      next: (sincobrar: any[]) => {
        if (!sincobrar.length) {
          this.swbusca = 2;
          this.loadingService.hideLoading();
        }

        sincobrar.map(async (item: any, i: number) => {
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

          if (i + 1 === sincobrar.length) {
            this.loadingService.hideLoading();
            this.swbusca = 3;
          }
        });

        this._sincobro = sincobrar;
        this.listaFiltrada = [...sincobrar];
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
      this.sumtotal += f.total + f.iva + f.interes;
      this.acobrar += f.total + f.iva + f.interes;
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
    const valor = event.target.checked ? 1 : 0;
    this._sincobro.forEach((s, i) => {
      this._sincobro[i].pagado = valor;
    });
    this.totalAcobrar();
  }

  marcarAnteriores(e: any, index: number, cuenta: number) {
    this.ntaCredito(cuenta, e.target.checked);

    if (this._sincobro[index].idmodulo === 3 || this._sincobro[index].idmodulo === 4) {
      if (this._sincobro[index].pagado) {
        let antCuenta = this._sincobro[index].idAbonado;
        let i = index - 1;
        while (i >= 0) {
          if (antCuenta !== this._sincobro[i].idAbonado) break;
          this._sincobro[i].pagado = 1;
          antCuenta = this._sincobro[i].idAbonado;
          i--;
        }
      } else {
        let antCuenta = this._sincobro[index].idAbonado;
        let i = index;
        while (i <= this._sincobro.length - 1) {
          if (antCuenta !== this._sincobro[i].idAbonado) break;
          this._sincobro[i].pagado = 0;
          antCuenta = this._sincobro[i].idAbonado;
          i++;
        }
      }
    } else {
      this._sincobro[index].pagado = this._sincobro[index].pagado ? 1 : 0;
    }

    this.totalAcobrar();
  }

  valCheckBox(cuenta: number, swcobrado: any) {
    if (swcobrado === true) {
      return swcobrado;
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
        suma += item.total + item.iva + item.interes;
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

    const primerPagado = this._sincobro.find(
      (registro: { pagado: number }) => registro.pagado == 1
    );

    let fcobro: any = 0;
    if (primerPagado?.estado === 3) {
      fcobro = this._formascobro[1];
    } else {
      fcobro = this._formascobro[0];
    }

    this.formCobrar.patchValue({
      idformacobro: fcobro,
      valorAcobrar: acobrar,
      acobrar: entero,
      dinero: '',
      vuelto: '',
      ncvalor: '',
    });
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


  cobrar() {
    const fecha = new Date();
    const r = {} as iRecaudacion;

    r.fechacobro = fecha;
    r.recaudador = this.authService.idusuario;
    r.totalpagar = +this.formCobrar.value.valorAcobrar;
    r.recibo = +this.formCobrar.value.dinero;
    r.cambio = +this.formCobrar.value.vuelto;
    r.formapago = this.idformacobro;
    r.valor = +this.formCobrar.value.valorAcobrar;
    r.estado = 1;
    r.ncvalor = +this.formCobrar.value.ncvalor;
    r.usucrea = this.authService.idusuario;
    r.feccrea = fecha;

    this.recaService.saveRecaudacion(r).subscribe({
      next: async (resp) => {
        const recaCreada = resp as Recaudacion;
        try {
          await this.facxrecauda(recaCreada, 0);
          this.swal("success", "Recaudación cobrada con éxito.");
        } catch (err) {
          console.error('Error en facxrecauda:', err);
          this.swal("error", "Ocurrió un problema al procesar las facturas.");
        }
      },
      error: (err) => console.error('Al crear la Recaudación: ', err?.error ?? err),
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

      const avanzar = (idx: number) => {
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
        const valfactura: number = item.total + item.interes;
        const fechacobro: Date = new Date();
        const horaActual: string =
          `${new Date().getHours()}:${new Date().getMinutes()}:${new Date().getSeconds()}`;

        const rubro: Rubros = new Rubros();
        rubro.idrubro = 5;

        this.facService.getById(idfactura).subscribe({
          next: (fac: any) => {
            fac.valornotacredito = this.calcularNCByFactura(valfactura, this.valorNtaCredito);

            const facxr = {} as iFacxrecauda;
            facxr.idrecaudacion = recaCreada;
            facxr.idfactura = fac;
            facxr.estado = 1;

            this.facxrService.save(facxr).subscribe({
              next: () => {
                this.rubxfacService.getIva(this.iva, fac.idfactura).subscribe({
                  next: (iva: any) => {
                    fac.swiva = (iva && iva[0]) ? iva[0][1] : 0;
                    fac.fechacobro = fechacobro;
                    fac.horacobro = horaActual;

                    if (this.swNC === true) {
                      fac.formapago = 3;
                    }

                    fac.usuariocobro = this.authService.idusuario;
                    fac.interescobrado = item.interes;
                    fac.pagado = 1;
                    fac.estado = (fac.estado === 2) ? 2 : 1;

                    if (fac.nrofactura === null) {
                      const nrofac = this._nroFactura.split('-', 3);
                      const nrofac_f = +nrofac[2]! + 1;
                      sessionStorage.setItem('ultfac', nrofac_f.toString().padStart(9, '0'));
                      this.formatNroFactura(nrofac_f);
                      fac.nrofactura =
                        `${this._codRecaudador}-${nrofac_f.toString().padStart(9, '0')}`;

                      this.s_recaudaxcaja.getLastConexion(this._caja.idcaja).subscribe({
                        next: (datos) => {
                          this.recxcaja = datos;
                          this.recxcaja.facfin = nrofac_f;
                          this.s_recaudaxcaja.updateRecaudaxcaja(this.recxcaja).subscribe({
                            next: () => { },
                            error: (e) => console.error(e),
                          });
                        },
                        error: (e) => console.error(e),
                      });
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
                          await this.saveRubxFac(fac, rubro, item.interes);
                        }
                        if (fac.formapago !== 4) {
                          this.s_fecfacturas.generateXmlOfPago(fac.idfactura);
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

  getRubroxfacReimpresion(idfactura: number) {
    this.rubxfacService.getByIdfactura(+idfactura!).subscribe({
      next: (detalle: any) => {
        this._rubrosxfac = detalle;
        this._subtotal();
      },
      error: (err) => console.error(err),
    });
  }
  getRubroxfac(idfactura: number, idmodulo?: any, sincobro?: any) {
    this.idfactura = idfactura;
    this.valoriva = sincobro?.iva ?? 0;
    this.totInteres = sincobro?.interes ?? 0;
    this.consumo = sincobro?.consumo ?? 0;

    this.getRubroxfacReimpresion(idfactura);
  }
  reImpComprobante(datos: any) {
    this.impComprobante(datos);
  }

  _subtotal() {
    let suma12 = 0;
    let suma0 = 0;
    let i = 0;
    this._rubrosxfac.forEach(() => {
      if (this._rubrosxfac[i].idrubro_rubros.swiva === 1) {
        suma12 +=
          this._rubrosxfac[i].cantidad * this._rubrosxfac[i].valorunitario;
      } else {
        if (this._rubrosxfac[i].idrubro_rubros.esiva === 0) {
          suma0 +=
            this._rubrosxfac[i].cantidad * this._rubrosxfac[i].valorunitario;
        }
      }
      i++;
    });
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
    let body: any;

    if (datos.idAbonado > 0 && (datos.idmodulo === 4 || datos.idmodulo === 3)) {
      body = { reportName: 'CompPagoConsumoAgua', parameters: { idfactura: datos.idfactura }, extencion: '.pdf' };
    } else if (datos.idmodulo === 27) {
      body = { reportName: 'CompPagoConvenios', parameters: { idfactura: datos.idfactura }, extencion: '.pdf' };
    } else {
      body = { reportName: 'CompPagoServicios', parameters: { idfactura: datos.idfactura }, extencion: '.pdf' };
    }

    const reporte = await this.s_jasperReport.getReporte(body);
    return new Blob([reporte], { type: 'application/pdf' });
  }

  async impComprobante(datos: any) {
    const newTab = window.open('', '_blank');
    if (!newTab) {
      alert('Tu navegador bloqueó la apertura del PDF. Permite ventanas emergentes.');
      return;
    }

    const body = this.buildJasperBodyPorFactura(datos);
    try {
      const reporte = await this.s_jasperReport.getReporte(body);
      const fileURL = URL.createObjectURL(reporte);
      newTab.location.href = fileURL;

      setTimeout(() => URL.revokeObjectURL(fileURL), 3000);
    } catch (e) {
      console.error(e);
      this.swal('error', 'No se pudo generar el comprobante.');
      newTab.close();
    }
  }

  // versión vieja -> delega
  async _impComprobante(datos: any) {
    await this.impComprobante(datos);
  }

  private buildJasperBodyPorFactura(datos: any) {
    let reportName: string;
    if (datos.idAbonado > 0 && (datos.idmodulo === 4 || datos.idmodulo === 3)) {
      reportName = 'CompPagoConsumoAgua';
    } else if (datos.idmodulo === 27) {
      reportName = 'CompPagoConvenios';
    } else {
      reportName = 'CompPagoServicios';
    }
    return {
      reportName,
      parameters: { idfactura: datos.idfactura },
      extencion: '.pdf',
    };
  }

  async imprimirTodasEnUno() {
    try {
      const newTab = window.open('', '_blank');
      if (!newTab) {
        alert('Tu navegador bloqueó la apertura del PDF. Permite ventanas emergentes.');
        return;
      }
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

      const fileURL = URL.createObjectURL(reporte);
      newTab.location.href = fileURL;

      this.swal('success', 'PDF unificado generado.');
      setTimeout(() => URL.revokeObjectURL(fileURL), 10000);
    } catch (e) {
      console.error(e);
      this.swal('error', 'No se pudo generar el PDF unificado.');
    }
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
