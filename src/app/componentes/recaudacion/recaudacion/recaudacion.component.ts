import { Component, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { Usuarios } from 'src/app/modelos/administracion/usuarios.model';
import { Cajas } from 'src/app/modelos/cajas.model';
import { Facturas } from 'src/app/modelos/facturas.model';
import { Formacobro } from 'src/app/modelos/formacobro.model';
import { Ptoemision } from 'src/app/modelos/ptoemision';
import { Recaudacion } from 'src/app/modelos/recaudacion.model';
import { Recaudaxcaja } from 'src/app/modelos/recaudaxcaja.model';
import { AbonadosService } from 'src/app/servicios/abonados.service';
import { ColorService } from 'src/app/servicios/administracion/color.service';
import { ClientesService } from 'src/app/servicios/clientes.service';
import { FacturaService } from 'src/app/servicios/factura.service';
import { FormacobroService } from 'src/app/servicios/formacobro.service';
import { LecturasService } from 'src/app/servicios/lecturas.service';
import { RubroxfacService } from 'src/app/servicios/rubroxfac.service';
import { RecaudacionReportsService } from '../recaudacion-reports.service';
import { InteresesService } from 'src/app/servicios/intereses.service';
import { CajaService } from 'src/app/servicios/caja.service';
import { RecaudacionService } from 'src/app/servicios/recaudacion.service';
import { FacxrecaudaService } from 'src/app/servicios/facxrecauda.service';
import { RecaudaxcajaService } from 'src/app/servicios/recaudaxcaja.service';
import { Colores } from 'src/app/modelos/administracion/colores.model';
import { Abonados } from 'src/app/modelos/abonados';
import { Clientes } from 'src/app/modelos/clientes';
import { Rubroxfac } from 'src/app/modelos/rubroxfac.model';
import { Rubros } from 'src/app/modelos/rubros.model';
import { of, switchMap, tap } from 'rxjs';
import { ModulosService } from 'src/app/servicios/modulos.service';
import { Modulos } from 'src/app/modelos/modulos.model';
import { LoadingService } from 'src/app/servicios/loading.service';
import { NtacreditoService } from 'src/app/servicios/ntacredito.service';
import { ValoresncService } from 'src/app/servicios/valoresnc.service';
import { FacxncService } from 'src/app/servicios/facxnc.service';
import { Facxnc } from 'src/app/modelos/facxnc';
import { Valoresnc } from 'src/app/modelos/valoresnc';
import { Ntacredito } from 'src/app/modelos/ntacredito';

@Component({
  selector: 'app-recaudacion',
  templateUrl: './recaudacion.component.html',
  styleUrls: ['./recaudacion.component.css'],
})
export class RecaudacionComponent implements OnInit {
  formBuscar: FormGroup;
  formCobrar: FormGroup;
  cliente = {} as Cliente; //Interface para los datos del Cliente
  mensaje = {} as Mensaje; //Interface para los mensajes
  swvalido = 1; //Ups
  _cliente: any; //Datos del Cliente
  formBusClientes: FormGroup; //Buscar Clientes del Modal
  _cuentas: any; //Cuentas del Cliente
  _clientes: any; //Clientes del Modal de Búsqueda de Clientes
  filtro: string;
  filtrar: string;
  privez = true; //Para resetear los datos de Búsqueda de Clientes
  _formascobro: any;
  _sincobro: any;
  sumtotal: number;
  acobrar: number;
  swbusca = 0; //0: Sin búsqueda, 1:No existe, 2:No tiene Planillas sinCobro, 3:Tiene Planillas sinCobro
  acobrardec: string;
  disabledcobro = true;
  _rubrosxfac: any;
  totfac: number;
  idfactura: number; //Id de la Planilla a mostrar en el detalle
  consumo: number;
  formColores: FormGroup; //Colores
  _tonoscabecera: any;
  _colorescabecera: any;
  _tonosdetalle: any;
  _coloresdetalle: any;
  swcobrado: boolean;
  formaCobro: Formacobro = new Formacobro();
  formacobroNC: boolean;
  idformacobro: number;
  _caja: Cajas = new Cajas();
  _establecimiento: Ptoemision = new Ptoemision();
  _usuario: Usuarios = new Usuarios();
  _nroFactura: any;
  _codRecaudador: any;
  estadoCajaT: boolean = true;
  caja: Cajas = new Cajas();
  cajaActiva: boolean = false;
  recxcaja: Recaudaxcaja = new Recaudaxcaja();
  /* IMPRESION */
  otraPagina: boolean = false;
  cuenta: any;
  datoBusqueda: number = 0;
  /* Intereses */
  calInteres = {} as calcInteres;
  totInteres: any = 0;
  arrCalculoInteres: any = [];
  factura: Facturas = new Facturas();
  _intereses: any;
  $event: any;
  valoriva: number;
  _codigo: string;
  /*  */
  arrFacturas: any = [];
  arrCuenta: any = [];
  _nc: any = [];
  swNC: boolean = false
  facturasToPrint: any[] = []
  valorNtaCredito: number;
  constructor(
    public fb: FormBuilder,
    private aboService: AbonadosService,
    private clieService: ClientesService,
    public fb1: FormBuilder,
    private facService: FacturaService,
    private rubxfacService: RubroxfacService,
    private lecService: LecturasService,
    private coloService: ColorService,
    private fcobroService: FormacobroService,
    private authService: AutorizaService,
    private s_pdfRecaudacion: RecaudacionReportsService,
    private interService: InteresesService,
    private s_cajas: CajaService,
    private recaService: RecaudacionService,
    private facxrService: FacxrecaudaService,
    private s_recaudaxcaja: RecaudaxcajaService,
    private s_modulo: ModulosService,
    private loadingService: LoadingService,
    private s_ntacredito: NtacreditoService,
    private s_valorNc: ValoresncService,
    private s_facnc: FacxncService
  ) { }

  ngOnInit(): void {
    this.formBuscar = this.fb.group({
      cuenta: '',
      identificacion: '',
    });
    //Formulario de Busqueda de Clientes (Modal)
    this.formBusClientes = this.fb1.group({
      nombre_identifica: [null, [Validators.required, Validators.minLength(5)]],
    });

    this.formCobrar = this.fb.group({
      valorAcobrar: 0, //Valor original con decimales para poder validar el dinero recibido
      idformacobro: this.formaCobro,
      acobrar: 0,
      ncvalor: ['', [Validators.required], this.valNC.bind(this)],
      dinero: ['', [Validators.required], this.valDinero.bind(this)],
      vuelto: '',
      saldo: ['', [Validators.required], this.SaldoNC.bind(this)],
    });
    //Al digitar quita alerta
    let cuenta = document.getElementById('cuenta') as HTMLInputElement;
    if (cuenta != null) {
      cuenta.addEventListener('keyup', () => {
        this.swvalido = 1;
        this.formBuscar.controls['identificacion'].setValue('');
      });
    }

    let identificacion = document.getElementById(
      'identificacion'
    ) as HTMLInputElement;
    if (identificacion != null) {
      identificacion.addEventListener('keyup', () => {
        this.swvalido = 1;
        this.formBuscar.controls['cuenta'].setValue('');
      });
    }

    var t: Colores = new Colores();
    var c: Colores = new Colores();
    this.formColores = this.fb.group({
      tonos0: t,
      colores0: c,
      tonos1: t,
      colores1: t,
    });
    this.listFormasCobro();
    this.listarIntereses();
    let getEstadoCaja = sessionStorage.getItem('estadoCaja');
    if (getEstadoCaja != '0') {
      this.abrirCaja();
    }
    this.disabledcobro = this.estadoCajaT;
  }
  get f() {
    return this.formCobrar.controls;
  }
  abrirCaja() {
    this.s_cajas.getByIdUsuario(this.authService.idusuario).subscribe({
      next: (dcaja) => {
        this._caja = dcaja;
        this._establecimiento = dcaja.idptoemision_ptoemision;
        this._usuario = dcaja.idusuario_usuarios;
        this._codRecaudador = `${dcaja.idptoemision_ptoemision.establecimiento}-${dcaja.codigo}`;
        /* VALIDAR SI LA CAJA ESTA ABIERTA O CERRADA */
        this.s_recaudaxcaja.getLastConexion(this._caja.idcaja).subscribe({
          next: (drxc: any) => {
            let c_fecha: Date = new Date();
            let l_fecha: Date = new Date(drxc.fechainiciolabor);
            let estadoCaja = sessionStorage.getItem('estadoCaja');
            if (
              (c_fecha.getDate() != l_fecha.getDate() &&
                c_fecha.getMonth() != l_fecha.getMonth() &&
                c_fecha.getFullYear() == l_fecha.getFullYear()) ||
              estadoCaja === '0'
            ) {
              this.cajaActiva = false;
              this.estadoCajaT = true;
            } else {
              this.cajaActiva = true;
              this.estadoCajaT = false;
            }
            if (dcaja.ultimafact === null) {
              this.formatNroFactura(drxc.facfin);
            } else {
              //this.formatNroFactura(dcaja.ultimafact)};
            }
          },
          error: (e) => console.error(e),
        });
      },
    });
  }
  formatNroFactura(nroFactura: number) {
    let nfactura = `${this._codRecaudador}-${nroFactura
      .toString()
      .padStart(9, '0')}`;
    this._nroFactura = nfactura;
    return nfactura;
  }
  getLastFactura() {
    this.facService.valLastFac(this._codigo).subscribe({
      next: (dato: any) => {
        let nrofac = dato.nrofactura.split('-', 3);
        this._nroFactura = `${this._codRecaudador}-${nrofac[2]
          .toString()
          .padStart(9, '0')}`;
      },
      error: (e) => console.error(e),
    });
  }
  validarCaja() {
    let fecha: Date = new Date();
    let nrofac = this._nroFactura.split('-', 3);
    sessionStorage.setItem('ultfac', nrofac[2]);
    this.recxcaja.estado = 1;
    this.recxcaja.facinicio = +nrofac[2]!;
    this.recxcaja.facfin = +nrofac[2]!;
    this.recxcaja.fechainiciolabor = fecha;
    this.recxcaja.idcaja_cajas = this._caja;
    this.recxcaja.idusuario_usuarios = this._caja.idusuario_usuarios;
    this.s_recaudaxcaja.saveRecaudaxcaja(this.recxcaja).subscribe({
      next: (datos) => {
        this.estadoCajaT = false;
        sessionStorage.setItem('estadoCaja', '1');
      },
      error: (e) => console.error(e),
    });
  }
  cerrarCaja() {
    sessionStorage.setItem('estadoCaja', '0');
    let nrofac = this._nroFactura.split('-', 3);
    this.s_recaudaxcaja.getLastConexion(this._caja.idcaja).subscribe({
      next: (datos) => {
        let c_fecha: Date = new Date();
        this.recxcaja = datos;
        this.recxcaja.estado = 0;
        this.recxcaja.fechafinlabor = c_fecha;
        this.estadoCajaT = true;
        this.recxcaja.facfin = +nrofac[2]!;
        this.s_recaudaxcaja.updateRecaudaxcaja(this.recxcaja).subscribe({
          next: (datos) => {
            sessionStorage.setItem('ultimafac', '0');
          },
          error: (e) => console.error(e),
        });
      },
      error: (e) => console.error(e),
    });
  }
  //Formas de cobro
  listFormasCobro() {
    this.fcobroService.getAll().subscribe({
      next: (datos) => {
        this._formascobro = datos;
        this.idformacobro = this._formascobro[0].idformacobro;
      },
      error: (err) => console.error(err.error),
    });
  }

  onSubmit() {
    this.arrCuenta = [];
    //this.getLastFactura();
    this.swcobrado = false;
    this.acobrar = 0;
    this.sumtotal = 0;
    this._cliente = [];
    this.arrFacturas = [];
    this.reset();
    // this.reiniciar();
    if (
      (this.formBuscar.value.cuenta == null ||
        this.formBuscar.value.cuenta == '') &&
      (this.formBuscar.value.identificacion == null ||
        this.formBuscar.value.identificacion == '') &&
      (this.formBuscar.value.nombre == null ||
        this.formBuscar.value.nombre == '')
    ) {
      this.swvalido = 0;
    } else {
      this.swvalido = 1;
      if (
        this.formBuscar.value.cuenta != null &&
        this.formBuscar.value.cuenta != ''
      ) {
        this.aboService.getByIdabonado(this.formBuscar.value.cuenta).subscribe({
          next: (datos) => {
            this._cliente = datos;
            if (this._cliente.length > 0) {
              this.datosCliente('cuenta');
            } else {
              this.swbusca = 1;
              this.mensaje.campo = 'Cuenta: ';
              this.mensaje.texto = this.formBuscar.value.cuenta;
            }
          },
          error: (err) => console.error('Al obtener idabonado: ', err.error),
        });
      } else {
        if (
          this.formBuscar.value.identificacion != null &&
          this.formBuscar.value.identificacion != ''
        ) {
          this.buscaIdentificacion(this.formBuscar.value.identificacion);
        }
      }
    }
  }

  buscaIdentificacion(identificacion: String) {
    this.acobrar = 0;
    this.clieService.getByIdentificacion(identificacion).subscribe({
      next: (datos) => {
        this._cliente = datos;
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

  datosCliente(campo: String) {
    if (campo == 'cuenta') {
      this.cliente.nombre = this._cliente[0].idcliente_clientes.nombre;
      this.cliente.cedula = this._cliente[0].idcliente_clientes.cedula;
      this.cliente.direccion = this._cliente[0].idcliente_clientes.direccion;
      this.cliente.telefono = this._cliente[0].idcliente_clientes.telefono;
      this.cliente.email = this._cliente[0].idcliente_clientes.email;
      this.cliente.porcexonera =
        this._cliente[0].idcliente_clientes.porcexonera / 100;
      this.cliente.porcdiscapacidad =
        this._cliente[0].idcliente_clientes.porcdiscapacidad / 100;
      this.sinCobro(this._cliente[0].idcliente_clientes.idcliente);
    }
    if (campo == 'identificacion') {
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
    this.formBuscar.controls['cuenta'].setValue('');
    this.formBuscar.controls['identificacion'].setValue('');
    this.formCobrar.value.saldo = 0
  }

  sinCobro(idcliente: number) {
    this.loadingService.showLoading();
    this.swbusca = 0;
    this.facService.getFacSincobro(idcliente).subscribe({
      next: (sincobrar: any) => {
        if (sincobrar.length === 0) {
          this.swbusca = 2;
          this.loadingService.hideLoading();
        }
        sincobrar.map(async (item: any, i: number) => {
          if (item.idAbonado != 0 && item.idmodulo != 27) {
            const abonado: Abonados = await this.getAbonado(item.idAbonado);
            item.direccion = abonado.direccionubicacion;
            item.responsablePago = abonado.idresponsable.nombre;
            const emision: any = await this.getEmision(item.idfactura);
            //item.feccrea = emision;
            item.fechaemision = emision;
          } else {
            const cliente: Clientes = await this.getCliente(item.idCliente);
            item.direccion = cliente.direccion;
            item.responsablePago = cliente.nombre;
            item.fechaemision = item.feccrea;
          }
          let iva: any = await this.calIva(item.idfactura);
          if (iva.length != 0) {
            item.iva = iva[0][1];
          } else {
            item.iva = 0;
          }
          const modulo: Modulos = await this.getModulo(item.idmodulo);
          item.modulo = modulo.descripcion;
          let interes: any = 0;
          if (
            (item.formapago != 4 || item.idmodulo != 27) &&
            (item.swcondonar === false || item.swcondonar === null)
          ) {
            interes = await this.cInteres(item);
            item.interes = +interes!;
          } else {
            item.interes = +interes!;
          }
          i++;
          if (i === sincobrar.length) {
            this.loadingService.hideLoading();
            this.swbusca = 3;
          }
          //item.total += interes;
        });
        console.log(sincobrar);
        this._sincobro = sincobrar;
      },
      error: (e) => console.error(e),
    });
  }
  calcular(e: any, factura: any) {
    this.acobrar = 0;
    this.sumtotal = 0;
    if (e.target.checked === true) {
      /*    let query = this.arrFacturas.find(
        (fact: { idfactura: number }) => (fact.idfactura = factura.idfactura)
      ); */
      this.arrFacturas.push(factura);
    }
    if (e.target.checked === false) {
      let query = this.arrFacturas.find(
        (fact: { idfactura: number }) => (fact.idfactura = factura.idfactura)
      );
      let i = this.arrFacturas.indexOf(query);
      this.arrFacturas.splice(i, 1);
    }
    this.arrFacturas.forEach((factura: any) => {
      this.sumtotal += factura.total + factura.iva + factura.interes;
      this.acobrar += factura.total + factura.iva + factura.interes;
    });
  }

  async getAbonado(idabonado: number): Promise<any> {
    const abo = await this.aboService.getById(idabonado).toPromise();
    return abo;
  }
  async getCliente(idclietne: number): Promise<any> {
    const cliente = await this.clieService.getListaById(idclietne).toPromise();
    return cliente;
  }
  async getModulo(idmodulo: number): Promise<any> {
    const modulo = await this.s_modulo.getById(idmodulo).toPromise();
    return modulo;
  }

  async getEmision(idfactura: number) {
    const emision = await this.lecService
      .findDateByIdfactura(idfactura)
      .toPromise();
    return emision;
  }

  reset() {
    this.cliente.nombre = '';
    this.cliente.cedula = '';
    this.cliente.direccion = '';
    this.cliente.telefono = '';
    this.cliente.email = '';
    this.cliente.porcexonera = null;
    this.cliente.porcdiscapacidad = null;
    this.filtrar = '';
    this.totInteres = 0;
    this.formCobrar.reset();

  }

  buscarClientes() {
    if (
      this.formBusClientes.value.nombre_identifica != null &&
      this.formBusClientes.value.nombre_identifica != ''
    ) {
      this.clieService
        .getByNombreIdentifi(this.formBusClientes.value.nombre_identifica)
        .subscribe({
          next: (datos) => (this._clientes = datos),
          error: (err) => console.error(err),
        });
    }
  }

  selecCliente(cliente: Clientes) {
    this.formBuscar.controls['cuenta'].setValue('');
    this.formBuscar.controls['identificacion'].setValue(
      cliente.cedula.toString()
    );
    this.buscaIdentificacion(cliente.cedula.toString());
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

  changeFormacobro() {
    const formacobro = this.formCobrar.get('idformacobro')!.value;
    this.idformacobro = formacobro.idformacobro;
    if (formacobro.idformacobro == 3) {
      this.formacobroNC = true;
    }
    else { this.formacobroNC = false };
  }

  marcarTodas(event: any) {
    let valor: number = 0;
    if (event.target.checked) {
      valor = 1;
    }
    let i = 0;
    this._sincobro.forEach(() => {
      this._sincobro[i].pagado = valor;
      i++;
    });
    this.totalAcobrar();
  }

  marcarAnteriores(e: any, index: number, cuenta: number) {

    this.ntaCredito(cuenta, e.target.checked)
    if (
      this._sincobro[index].idmodulo === 3 ||
      this._sincobro[index].idmodulo === 4
    ) {
      //Solo para Emision
      if (this._sincobro[index].pagado) {
        //Marca anteriores
        let antCuenta = this._sincobro[index].idAbonado;
        let i = index - 1;
        while (i >= 0) {
          if (antCuenta != this._sincobro[i].idAbonado) break;
          this._sincobro[i].pagado = 1;
          antCuenta = this._sincobro[i].idAbonado;
          i--;
        }
      } //Desmarca siguientes
      else {
        let antCuenta = this._sincobro[index].idAbonado;
        let i = index;
        while (i <= this._sincobro.length - 1) {
          if (antCuenta != this._sincobro[i].idAbonado) break;
          this._sincobro[i].pagado = 0;
          antCuenta = this._sincobro[i].idAbonado;
          i++;
        }
      }
    } else {
      if (this._sincobro[index].pagado) {
        this._sincobro[index].pagado = 1;
      } else {
        this._sincobro[index].pagado = 0;
      }
    }
    this.totalAcobrar();
  }
  valCheckBox(cuenta: number, swcobrado: any) {
    if (swcobrado == true) {
      return swcobrado;
    } else if (cuenta != this.arrCuenta[0] && this.arrCuenta.length > 0 && cuenta > 0) {
      return true;
    }
    else {
      return false;
    }
  }
  ntaCredito(cuenta: number, sw: boolean) {
    if (cuenta != 0 && sw === true) {
      let find = this.arrCuenta.find((item: number) => item == cuenta);
      if (!find) {
        this.arrCuenta.push(cuenta);
        this.buscarNtaCredito(this.arrCuenta[0])
      }
    } else if (cuenta != 0 && sw === false) {
      let find = this.arrCuenta.find((item: number) => item == cuenta);

      let i = this.arrCuenta.indexOf(find);
      this.arrCuenta.splice(i, 1);
      if (this.arrCuenta.length > 0) {
        this.buscarNtaCredito(this.arrCuenta[0])
      }
    }
  }

  buscarNtaCredito(cuenta: number) {
    this.s_ntacredito.getSaldosNC(cuenta).subscribe({
      next: (datos: any) => {
        this._nc = datos;
        if (datos.length > 0) {
          console.log("BUSCANDO NTA CEDITO CUENT");
          this.formCobrar.patchValue({
            saldo: datos[0].saldo
          })
        } else {
          console.log("QUITNDO VALOR NTA CEDITO");

          this.formCobrar.patchValue({
            saldo: ''
          })
        }

      },
      error: (e: any) => console.error(e)
    })
  }
  guardarValoresNc(valorNc: any, factura: any): void {
    const notaCredito = this._nc[0];
    const ncvalor = this.formCobrar.value.ncvalor;

    if (!notaCredito || ncvalor == null) {
      console.warn('Datos incompletos para guardar Nota de Crédito');
      return;
    }

    this.s_valorNc.saveValoresnc(valorNc).pipe(
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
      tap((respuesta: any) => {
        console.log("Nota Actualizada", respuesta);
      })
    ).subscribe({
      error: (e: any) => console.error("Error en el proceso de guardado de Nota de Crédito:", e)
    });
  }

  totalAcobrar() {
    let suma: number = 0;
    let i = 0;
    this._sincobro.forEach((item: any, index: number) => {
      if (this._sincobro[i].pagado === true || this._sincobro[i].pagado === 1) {
        /*         if (
          this._sincobro[i].idmodulo.idmodulo == 3 ||
          this._sincobro[i].idmodulo.idmodulo == 4
        ) {
          suma +=
            this._sincobro[i].totaltarifa +
            this._sincobro[i].comerc +
            +this._sincobro[i].interes;
          this._sincobro[i].multa;
        } else if (this._sincobro[i].idmodulo.idmodulo == 8) {
          suma += this._sincobro[i].valorbase;
        } else {
          suma += this._sincobro[i].totaltarifa + +this._sincobro[i].interes;
        } */
        suma +=
          this._sincobro[i].total +
          this._sincobro[i].iva +
          this._sincobro[i].interes;
      }
      i++;
    });
    this.acobrar = +suma.toFixed(2)!;
  }

  valorAcobrar(acobrar: number) {
    this.disabledcobro = true;
    let entero = Math.trunc(acobrar);
    let decimal = (acobrar - entero).toFixed(2);
    this.acobrardec = decimal.toString().slice(1);
    const primerPagado = this._sincobro.find(
      (registro: { pagado: number }) => registro.pagado == 1
    );
    let fcobro: number = 0; //3= Transferencia
    if (primerPagado.estado == 3) fcobro = this._formascobro[1];
    else fcobro = this._formascobro[0];
    this.formCobrar.patchValue({
      // idformacobro: this._formascobro[0],
      idformacobro: fcobro,
      valorAcobrar: acobrar,
      acobrar: entero,
      dinero: '',
      vuelto: '',
      ncvalor: '',
      //saldo: ''
    });
  }

  valorDinero() {
    this.formacobroNC = false;
    this.formCobrar.controls['ncvalor'].setValue('')
    this.formCobrar.controls['dinero'].setValue(
      this.acobrar.toFixed(2).toString()
    );
    this.formCobrar.controls['vuelto'].setValue('');
    this.disabledcobro = false
  }

  async getRubroxfac(idfactura: number, idmodulo: number, factura: any) {
    this.totInteres = 0;
    this._rubrosxfac = null;
    let _lecturas: any;
    this.consumo = 0;
    this.idfactura = idfactura;
    if (factura.swcondonar != true) {
      this.totInteres = await this.cInteres(factura);
    }
    if (idmodulo == 8) {
      this.rubxfacService.getByIdfactura1(idfactura).subscribe({
        next: (detalle) => {
          this._rubrosxfac = detalle;
          this.subtotal();
        },
        error: (err) =>
          console.error('Al recuperar el datalle de la Planilla: ', err.error),
      });
    } else {
      this.rubxfacService.getByIdfactura(idfactura).subscribe({
        next: (detalle: any) => {
          this._rubrosxfac = detalle;
          if ((idmodulo == 3 || idmodulo == 4) && detalle.abonado > 0) {
            this.lecService.getByIdfactura(idfactura).subscribe({
              next: (resp) => {
                _lecturas = resp;
                this.consumo =
                  _lecturas[0].lecturaactual - _lecturas[0].lecturaanterior;
              },
              error: (err) =>
                console.error(
                  'Al recuperar la Lectura de la Planilla: ',
                  err.error
                ),
            });
          }
          this.subtotal();
        },
        error: (err) =>
          console.error('Al recuperar el datalle de la Planilla: ', err.error),
      });
    }
  }

  getAbonadoById(cuenta: number) {
    let abonado: any;
    if (cuenta != 0) {
      this.aboService.getOneAbonado(cuenta).subscribe({
        next: (datos) => {
          abonado = datos;
        },
        error: (e) => console.error(e),
      });
      return abonado;
    }
  }
  //Subtotal de la Planilla
  subtotal() {
    let suma12: number = 0;
    let suma0: number = 0;
    let i = 0;
    this._rubrosxfac.forEach(() => {
      if (this._rubrosxfac[i].idrubro_rubros.swiva == 1)
        suma12 =
          suma12 +
          this._rubrosxfac[i].cantidad * this._rubrosxfac[i].valorunitario;
      else
        suma0 +=
          this._rubrosxfac[i].cantidad * this._rubrosxfac[i].valorunitario;
      i++;
    });
    suma12 = Math.round(suma12 * 100) / 100;
    this.valoriva = suma12 * 0.15;
    this.totfac = suma12 + suma0 + this.valoriva + this.totInteres;
  }

  cobrar() {
    //this.getLastFactura();
    //Crea el registro en Recaudación
    let fecha = new Date();
    let r = {} as iRecaudacion; //Interface para los datos de la Recaudación
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
      next: (resp) => {
        const recaCreada = resp as Recaudacion;
        let i = 0;
        this.facxrecauda(recaCreada, i);
      },
      error: (err) => console.error('Al crear la Recaudación: ', err.error),
    });
  }

  saveRubxFac(idfactura: any, idrubro: any, valorunitario: any) {
    let rubrosxfac: Rubroxfac = new Rubroxfac();
    rubrosxfac.idfactura_facturas = idfactura;
    rubrosxfac.idrubro_rubros = idrubro;
    rubrosxfac.valorunitario = valorunitario;
    rubrosxfac.cantidad = 1;
    rubrosxfac.estado = 1;
    this.rubxfacService.saveRubroxFac(rubrosxfac).subscribe({
      next: (datos) => { },
      error: (e) => console.error(e),
    });
  }
  //Registra las facturas por recaudación y actualiza la fecha de cobro de la(s) factura(s)
  facxrecauda(recaCreada: Recaudacion, i: number) {
    let idfactura: number;
    let valfactura: number;
    let fechacobro: Date = new Date();
    let rubro: Rubros = new Rubros();
    rubro.idrubro = 5;
    //this._sincobro[i].pagado = 1;
    if (this._sincobro[i].pagado === 1 || this._sincobro[i].pagado === true) {
      idfactura = this._sincobro[i].idfactura;
      valfactura = this._sincobro[i].total + this._sincobro[i].interes
      console.log(valfactura)
      this.facService.getById(idfactura).subscribe({
        next: (fac) => {
          this.calcularNCByFactura(valfactura, this.valorNtaCredito);
          fac.valornotacredito = this.valorNtaCredito;
          //Añade a facxrecauda
          let facxr = {} as iFacxrecauda; //Interface para los datos de las facturas de la Recaudación
          facxr.idrecaudacion = recaCreada;
          facxr.idfactura = fac;
          facxr.estado = 1;
          this.facxrService.save(facxr).subscribe({
            next: (nex) => {
              //Actualiza Factura como cobrada
              //let iva = 0;
              this.rubxfacService.getIva(0.15, fac.idfactura).subscribe({
                next: (iva: any) => {
                  if (iva[0] != undefined) {
                    fac.swiva = iva[0][1];
                  } else {
                    fac.swiva = 0;
                  }
                  fac.fechacobro = fechacobro;
                  if (this.swNC === true) {
                    fac.formapago = 3
                    /* AQUI COLOCAR LA FUNCION DE IMPRIMIR EL COMPROBANTE DE NOTACREDITO */
                  }
                  fac.usuariocobro = this.authService.idusuario;
                  if (fac.idmodulo.idmodulo != 8) {
                  }
                  fac.interescobrado = this._sincobro[i].interes;
                  fac.pagado = 1;
                  if (fac.estado === 2) {
                    fac.estado = 2;
                  } else {
                    fac.estado = 1;
                  }
                  if (
                    this._sincobro[i].interes > 0 &&
                    fac.idmodulo.idmodulo != 8
                  ) {
                  }
                  //this.saveRubxFac(fac, rubro, this._sincobro[i].interes);
                  let j = 1;
                  if (fac.nrofactura === null) {
                    let nrofac = this._nroFactura.split('-', 3);
                    let nrofac_f = +nrofac[2]! + j;
                    sessionStorage.setItem(
                      'ultfac',
                      nrofac_f.toString().padStart(9, '0')
                    );
                    this.formatNroFactura(nrofac_f);
                    fac.nrofactura = `${this._codRecaudador}-${nrofac_f
                      .toString()
                      .padStart(9, '0')}`;
                    /* =============== */
                    //let _nrofac = this._nroFactura.split('-', 3);
                    this.s_recaudaxcaja
                      .getLastConexion(this._caja.idcaja)
                      .subscribe({
                        next: (datos) => {
                          let c_fecha: Date = new Date();
                          this.recxcaja = datos;
                          this.recxcaja.facfin = nrofac_f;
                          this.s_recaudaxcaja
                            .updateRecaudaxcaja(this.recxcaja)
                            .subscribe({
                              next: (datos) => {
                              },
                              error: (e) => console.error(e),
                            });
                        },
                        error: (e) => console.error(e),
                      });
                    /* =============== */
                  }
                  //fac.swiva = +iva[0][1]!;
                  this.facService.updateFacturas(fac).subscribe({
                    next: (nex: any) => {
                      if (this._nc.length > 0 && fac.valornotacredito > 0) {
                        let valoresnc: Valoresnc = new Valoresnc();
                        valoresnc.estado = 1;
                        valoresnc.idntacredito_ntacredito = this._nc[0];
                        valoresnc.valor = this.formCobrar.value.ncvalor;
                        valoresnc.fechaaplicado = new Date();
                        valoresnc.saldo = this._nc[0].saldo - this.formCobrar.value.ncvalor;
                        this.guardarValoresNc(valoresnc, nex)
                      }
                      this.swcobrado = true;
                      if (
                        nex.idmodulo.idmodulo != 27 ||
                        nex.interescobrado > 0
                      ) {
                        this.saveRubxFac(fac, rubro, this._sincobro[i].interes);
                      }
                      j++;
                      i++;
                      if (i < this._sincobro.length) {
                        this.facxrecauda(recaCreada, i);
                      }
                    },
                    error: (err) =>
                      console.error('Al actualizar la Factura: ', err.error),
                  });
                },
                error: (e) => console.error('Error al obtener el iva', e),
              });
            },
            error: (err) =>
              console.error(
                'Al crear las Facturas de la Recaudación: ',
                err.error
              ),
          });
        },
        error: (err) =>
          console.error(
            'Al recuperar los datos de la Factura a actualizar: ',
            err.error
          ),
      });
    } else {
      //No pagada continua con la siguiente
      i++;
      if (i < this._sincobro.length) {
        this.facxrecauda(recaCreada, i);
      }
    }
  }
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
                      let defaultValue3 = this._coloresdetalle.find(
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
      // Recupera los Colores del Tono seleccionado
      this._colorescabecera = [];
      this.coloService
        .getByTono(this.formColores.value.tonos0.codigo)
        .subscribe({
          next: (datos) => (this._colorescabecera = datos),
          error: (err) =>
            console.error('Al recuperar los Colores por Tono', err.error),
        });
    });
    // =========== Detalle ===========
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
  //Que el dinero no sea menor que el valor a cobrar
  valDinero(control: AbstractControl): { [key: string]: any } | null {
    const ncvalor = +this.formCobrar.controls['ncvalor'].value || 0;
    const valorAcobrar = +this.formCobrar.value.valorAcobrar || 0;
    const valorActual = +control.value || 0;
    if ((valorAcobrar - ncvalor) > valorActual) {
      return of({ invalido: true });
    }

    return of(null);
  }


  impComprobante(datos: any) {
    let lectura: any;
    this.facService.getById(datos.idfactura).subscribe({
      next: (d_factura: any) => {
        let modulo: number = d_factura.idmodulo.idmodulo;
        if (modulo === 3 || modulo === 4) {
          this.lecService.getOnefactura(d_factura.idfactura).subscribe({
            next: (datos: any) => {
              lectura = datos;
              if (datos != null) {
                this.s_pdfRecaudacion._comprobantePago(lectura, d_factura);
              } else {
                this.s_pdfRecaudacion._comprobantePago(null, d_factura);
              }
            },
            error: (e) => console.error(e),
          });
        } else {
          this.s_pdfRecaudacion._comprobantePago(null, d_factura);
        }
      },
      error: (e) => console.error(e),
    });
  }
  reImpComprobante(datos: any) {
    let lectura: any;
    this.facService.getById(datos.idfactura).subscribe({
      next: (d_factura: any) => {
        let modulo: number = d_factura.idmodulo.idmodulo;
        if (modulo === 3 || modulo === 4) {
          this.lecService.getOnefactura(d_factura.idfactura).subscribe({
            next: (datos: any) => {
              lectura = datos;
              if (datos != null) {
                this.s_pdfRecaudacion.reimprimircomprobantePago(
                  lectura,
                  d_factura
                );
              } else {
                this.s_pdfRecaudacion.reimprimircomprobantePago(
                  null,
                  d_factura
                );
              }
            },
            error: (e) => console.error(e),
          });
        } else {
          this.s_pdfRecaudacion.reimprimircomprobantePago(null, d_factura);
        }
      },
      error: (e) => console.error(e),
    });
  }

  listarIntereses() {
    this.interService.getListaIntereses().subscribe({
      next: (datos) => {
        this._intereses = datos;
      },
      error: (err) => console.error(err.error),
    });
  }

  /* Este metodo calcula el interes individual y la uso en el metodo de listar las facturas sin cobro */
  cInteres(factura: any) {
    let interes: any = 0;
    interes = this.interService
      .getInteresFactura(factura.idfactura)
      .toPromise();

    return interes;
  }

  async calIva(idfactura: any) {
    let iva = this.rubxfacService.getIva(0.15, idfactura).toPromise();
    return iva;
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
      let t = 0,
        c = 0,
        i = 0,
        m = 0;
      t = tarifa === undefined ? 0 : tarifa;
      c = cons === undefined ? 0 : cons;
      i = interes === undefined ? 0 : interes;
      m = multa === undefined ? 0 : multa;
      return t + c + i + m;
    }
  }
  //Al digitar el valor de la NC
  changeNCvalor(e: any) {
    console.log(e.target.value)
    this.valorNtaCredito = +e.target.value!
    let dinero: number;
    if (+this.formCobrar.controls['dinero'].value > 0)
      dinero = +this.formCobrar.controls['dinero'].value;
    else dinero = 0;
    let vuelto = (
      +this.formCobrar.controls['ncvalor'].value +
      dinero -
      this.acobrar
    ).toFixed(2);
    this.formCobrar.controls['vuelto'].setValue(vuelto.toString());
    if (this.formCobrar.controls['vuelto'].value == 0)
      this.disabledcobro = false;
    else this.disabledcobro = true;
  }

calcularNCByFactura(vfactura: number, vnc: number): number {
  if (vnc <= 0) {
    this.valorNtaCredito = 0;
    return 0;
  }

  if (vfactura <= vnc) {
    this.valorNtaCredito = vnc - vfactura;
    console.log(vnc, vfactura, vfactura - vnc);
    return vnc;
  } else {
    this.valorNtaCredito = vnc;
    return vnc;
  }
}

  //Valida que el valor de la NC no se mayor que el valor a cobrar
  valNC(control: AbstractControl) {
    if (this.formCobrar.value.valorAcobrar < control.value || control.value > +this.formCobrar.value.saldo!) {
      this.swNC = false;

      return of({ invalido: true })
    }
    else {
      this.swNC = true;

      return of(null);
    }
  }
  SaldoNC(control: AbstractControl) {
    console.log(control)
    if (this.formCobrar.value.saldo <= 0)
      return of({ invalido: true });
    else return of(null);
  }
  //Al digitar el dinero
  changeDinero() {
    let ncvalor: number;
    if (+this.formCobrar.controls['ncvalor'].value > 0)
      ncvalor = +this.formCobrar.controls['ncvalor'].value;
    else ncvalor = 0;
    let vuelto = (
      +this.formCobrar.controls['dinero'].value +
      ncvalor -
      this.acobrar
    ).toFixed(2);
    this.formCobrar.controls['vuelto'].setValue(vuelto.toString());
    if (this.formCobrar.controls['vuelto'].value >= 0) {
      this.disabledcobro = false;
    } else {
      this.disabledcobro = true;
    }
  }

  getRubroxfacReimpresion(idfactura: number) {
    idfactura;
    this.rubxfacService.getByIdfactura(+idfactura!).subscribe({
      next: (detalle) => {
        this._rubrosxfac = detalle;
        this._subtotal();
      },
      error: (err) => console.error(err),
    });
  }
  _subtotal() {
    let suma12: number = 0;
    let suma0: number = 0;
    let i = 0;
    this._rubrosxfac.forEach(() => {
      if (this._rubrosxfac[i].idrubro_rubros.swiva == 1) {
        suma12 +=
          this._rubrosxfac[i].cantidad * this._rubrosxfac[i].valorunitario;
      } else {
        if (this._rubrosxfac[i].idrubro_rubros.esiva == 0) {
          suma0 +=
            this._rubrosxfac[i].cantidad * this._rubrosxfac[i].valorunitario;
        } else {
        }
      }
      i++;
    });
    //this.totfac = suma12 + suma0;
  }
}

interface Cliente {
  idcliente: number;
  nombre: String;
  cedula: String;
  direccion: String;
  telefono: String;
  email: String;
  porcexonera: number | null;
  porcdiscapacidad: number | null;
}

interface Mensaje {
  campo: String;
  texto: String;
}

interface Interes {
  idinteres: number;
  anio: number;
  mes: number;
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
  observaciones: String;
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
interface facturaI {
  direccion: String;
  feccrea: Date;
  idAbonado: number;
  idCliente: number;
  idfactura: number;
  idmodulo: number;
  interes: number;
  iva: number;
  modulo: string;
  responsablePago: string;
  total: number;
  formapago: number;
}

interface ntaCredito {
  devengado: number;
  saldo: number;
  idntacredito: number;
  cuenta: number
}

interface NtacreditoUpdate {
  idntacredito: number;
  devengado: number;

}