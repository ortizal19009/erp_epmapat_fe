import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { AbonadosService } from 'src/app/servicios/abonados.service';
import { ClientesService } from 'src/app/servicios/clientes.service';
import { Clientes } from 'src/app/modelos/clientes';
import { FacturaService } from 'src/app/servicios/factura.service';
import { RubroxfacService } from 'src/app/servicios/rubroxfac.service';
import { ColorService } from 'src/app/servicios/administracion/color.service';
import { Colores } from 'src/app/modelos/administracion/colores.model';
import { LecturasService } from 'src/app/servicios/lecturas.service';
import { Formacobro } from 'src/app/modelos/formacobro.model';
import { FormacobroService } from 'src/app/servicios/formacobro.service';
import { of } from 'rxjs';
import { Facturas } from 'src/app/modelos/facturas.model';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { RecaudacionReportsService } from '../recaudacion-reports.service';
import { InteresesService } from 'src/app/servicios/intereses.service';
import { CajaService } from 'src/app/servicios/caja.service';
import { Cajas } from 'src/app/modelos/cajas.model';
import { Ptoemision } from 'src/app/modelos/ptoemision';
import { Usuarios } from 'src/app/modelos/administracion/usuarios.model';
import { Recaudacion } from 'src/app/modelos/recaudacion.model';
import { RecaudacionService } from 'src/app/servicios/recaudacion.service';
import { FacxrecaudaService } from 'src/app/servicios/facxrecauda.service';
import { RecaudaxcajaService } from 'src/app/servicios/recaudaxcaja.service';
import { Recaudaxcaja } from 'src/app/modelos/recaudaxcaja.model';
import { Rubroxfac } from 'src/app/modelos/rubroxfac.model';
import { Rubros } from 'src/app/modelos/rubros.model';
import { Abonados } from 'src/app/modelos/abonados';
import { Lecturas } from 'src/app/modelos/lecturas.model';

@Component({
  selector: 'app-add-recauda',
  templateUrl: './add-recauda.component.html',
  styleUrls: ['./add-recauda.component.css'],
})
export class AddRecaudaComponent implements OnInit {
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
  totInteres: number = 0;
  arrCalculoInteres: any = [];
  factura: Facturas = new Facturas();
  _intereses: any;
  $event: any;
  valoriva: number;
  _codigo: string;
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
    private s_recaudaxcaja: RecaudaxcajaService
  ) {}

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
    //this.getLastFactura();
    this.swcobrado = false;
    this.acobrar = 0;
    this._cliente = [];
    this.reset();
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
            console.log(datos);

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
    this.formBuscar.controls['cuenta'].setValue('');
    this.formBuscar.controls['identificacion'].setValue('');
  }

  sinCobro(idcliente: number) {
    console.log(idcliente)
    this.facService.getSinCobro(idcliente).subscribe({
      next: (datos: any) => {
        this._sincobro = datos;
        if (datos.length > 0) {
          let suma: number = 0;
          let i = 0;
          this._sincobro.forEach(async (item: any, index: number) => {
            let interes = this.cInteres(item);
            // let abonado = this.getAbonado(item.idabonado);
            if (item.idabonado != 0) {
              const abonado: Abonados = await this.getAbonado(item.idabonado);
              item.direccion = abonado.direccionubicacion;
              item.responsablePago = abonado.idresponsable.nombre;
            } else {
              item.direccion = 'S/D';
            }
            let com = 0;
            if (item.idmodulo.idmodulo == 3 && item.idabonado != 0) com = 1;
            item.interes = Math.round(interes * 100) / 100;
            item.comerc = com;
            //item.multa = 0;
            //item.totaltarifa = n_totalTarifa;
            suma += item.totaltarifa + item.interes;
            i++;
            this.sumtotal = Math.round(suma * 100) / 100;
          });
          this.swbusca = 3;
        } else {
          this.swbusca = 2;
          this.sumtotal = 0;
        }
      },
      error: (err) => console.error(err.error),
    });
    
  }
  disabled(e: any) {}

  async getAbonado(idabonado: number): Promise<any> {
    const abo = await this.aboService.getById(idabonado).toPromise();
    return abo;
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
          error: (err) => console.log(err.error),
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
    if (formacobro.idformacobro == 3) this.formacobroNC = true;
    else this.formacobroNC = false;
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

  marcarAnteriores(index: number) {
    if (
      this._sincobro[index].idmodulo.idmodulo === 3 /* ||
      this._sincobro[index].idmodulo.idmodulo === 4 */
    ) {
      //Solo para Emision
      if (this._sincobro[index].pagado) {
        //Marca anteriores
        let antCuenta = this._sincobro[index].idabonado;
        let i = index - 1;
        while (i >= 0) {
          if (antCuenta != this._sincobro[i].idabonado) break;
          this._sincobro[i].pagado = 1;
          antCuenta = this._sincobro[i].idabonado;
          i--;
        }
      } //Desmarca siguientes
      else {
        let antCuenta = this._sincobro[index].idabonado;
        let i = index;
        while (i <= this._sincobro.length - 1) {
          if (antCuenta != this._sincobro[i].idabonado) break;
          this._sincobro[i].pagado = 0;
          antCuenta = this._sincobro[i].idabonado;
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
  totalAcobrar() {
    let suma: number = 0;
    let i = 0;
    this._sincobro.forEach((item: any, index: number) => {
      if (this._sincobro[i].pagado === true || this._sincobro[i].pagado === 1) {
        if (
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
        }
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
    let fcobro: number; //3= Transferencia
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

  getRubroxfac(idfactura: number, idmodulo: number) {
    this._rubrosxfac = null;
    let _lecturas: any;
    this.consumo = 0;
    this.idfactura = idfactura;
    console.log(idmodulo);
    if (idmodulo == 8) {
      this.rubxfacService.getByIdfactura1(idfactura).subscribe({
        next: (detalle) => {
          console.log(detalle);
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
          this.calcularInteres(idfactura);
          this.subtotal();
        },
        error: (err) =>
          console.error('Al recuperar el datalle de la Planilla: ', err.error),
      });
    }
  }

  //Modal del Detalle de la Planilla
  getRubroxfac_2(idfactura: number) {
    this._rubrosxfac = [];
    let _lecturas: any;
    this.consumo = 0;
    this.idfactura = idfactura;
    this.lecService.getByIdfactura(idfactura).subscribe({
      next: (resp) => {
        if (resp.length != 0) {
          _lecturas = resp;
          this.consumo =
            _lecturas[0].lecturaactual - _lecturas[0].lecturaanterior;
        }
        this.rubxfacService.getByIdfactura(idfactura).subscribe({
          next: (detalle) => {
            this._rubrosxfac = detalle;
            this.calcularInteres(idfactura);
            this.subtotal();
          },
          error: (err) =>
            console.error(
              'Al recuperar el datalle de la Planilla: ',
              err.error
            ),
        });
        this.subtotal();
      },
      error: (err) =>
        console.error('Al recuperar la Lectura de la Planilla: ', err.error),
    });
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
  getRubroxfac1(idfactura: number) {
    let _lecturas: any;
    this.consumo = 0;
    this.idfactura = idfactura;
    this.rubxfacService.getByIdfactura(idfactura).subscribe({
      next: (detalle) => {
        this._rubrosxfac = detalle;
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
        this.subtotal();
      },
      error: (err) =>
        console.error('Al recuperar el datalle de la Planilla: ', err.error),
    });
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
      next: (datos) => {},
      error: (e) => console.error(e),
    });
  }
  //Registra las facturas por recaudación y actualiza la fecha de cobro de la(s) factura(s)
  facxrecauda(recaCreada: Recaudacion, i: number) {
    let idfactura: number;
    let fechacobro: Date = new Date();
    let rubro: Rubros = new Rubros();
    rubro.idrubro = 5;
    if (this._sincobro[i].pagado) {
      idfactura = this._sincobro[i].idfactura;
      this.facService.getById(idfactura).subscribe({
        next: (fac) => {
          //Añade a facxrecauda
          let facxr = {} as iFacxrecauda; //Interface para los datos de las facturas de la Recaudación
          facxr.idrecaudacion = recaCreada;
          facxr.idfactura = fac;
          facxr.estado = 1;
          this.facxrService.save(facxr).subscribe({
            next: (nex) => {
              //Actualiza Factura como cobrada
              let iva = 0;
              console.log(iva);
              this.rubxfacService.getIva(0.15, fac.idfactura).subscribe({
                next: (iva: any) => {
                  console.log(iva[0]);
                  if (iva[0] != undefined) {
                    fac.swiva = iva[0][1];
                  } else {
                    fac.swiva = 0;
                  }

                  fac.fechacobro = fechacobro;
                  fac.usuariocobro = this.authService.idusuario;
                  if (fac.idmodulo.idmodulo != 8) {
                    fac.interescobrado = this._sincobro[i].interes;
                  }
                  fac.pagado = 1;
                  if (
                    this._sincobro[i].interes > 0 &&
                    fac.idmodulo.idmodulo != 8
                  ) {
                    this.saveRubxFac(fac, rubro, this._sincobro[i].interes);
                  }
                  if (fac.estado === 2) {
                    fac.estado = 2;
                  } else {
                    fac.estado = 1;
                  }
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
                              next: (datos) => {},
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
                      this.swcobrado = true;
                      j++;
                      i++;
                      if (i < this._sincobro.length)
                        this.facxrecauda(recaCreada, i);
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
      if (i < this._sincobro.length) this.facxrecauda(recaCreada, i);
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
                        colores0: defaultValue1,
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
  valDinero(control: AbstractControl) {
    let ncvalor: number;
    if (+this.formCobrar.controls['ncvalor'].value > 0)
      ncvalor = +this.formCobrar.controls['ncvalor'].value;
    else ncvalor = 0;
    if (+this.formCobrar.value.valorAcobrar - ncvalor > control.value)
      return of({ invalido: true });
    else return of(null);
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
                this.s_pdfRecaudacion.comprobantePago(lectura, d_factura);
              } else {
                this.s_pdfRecaudacion.comprobantePago(null, d_factura);
              }
            },
            error: (e) => console.error(e),
          });
        } else {
          this.s_pdfRecaudacion.comprobantePago(null, d_factura);
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

  calcularInteres(idfactura: number) {
    let idFactura = idfactura;
    this.totInteres = 0;
    this.arrCalculoInteres = [];
    let interes: number = 0;
    this.facService.getById(idFactura).subscribe({
      next: (datos: any) => {
        if (datos.estado != 3 && datos.formapago != 4) {
          let fec = datos.feccrea.toString().split('-', 2);
          let fechai: Date = new Date(`${fec[0]}-${fec[1]}-02`);
          let fechaf: Date = new Date();
          this.factura = datos;
          fechaf.setMonth(fechaf.getMonth() - 1);
          while (fechai <= fechaf) {
            this.calInteres = {} as calcInteres;
            let query = this._intereses.find(
              (interes: { anio: number; mes: number }) =>
                interes.anio === +fechai.getFullYear()! &&
                interes.mes === +fechai.getMonth()! + 1
            );
            if (!query) {
              this.calInteres.anio = +fechai.getFullYear()!;
              this.calInteres.mes = +fechai.getMonth()! + 1;
              this.calInteres.interes = 0;
              this.calInteres.valor = datos.totaltarifa;
              query = this.calInteres;
            } else {
              this.calInteres.anio = query.anio;
              this.calInteres.mes = query.mes;
              this.calInteres.interes = query.porcentaje;
              this.calInteres.valor = datos.totaltarifa;
            }
            this.arrCalculoInteres.push(this.calInteres);
            fechai.setMonth(fechai.getMonth() + 1);
          }
          this.arrCalculoInteres.forEach((item: any) => {
            this.totInteres += (+item.interes! * item.valor) / 100;
            interes += (+item.interes! * item.valor) / 100;
          });
        }
        this.subtotal();
      },
      error: (e) => console.error(e),
    });
  }
  /* Este metodo calcula el interes individual y la uso en el metodo de listar las facturas sin cobro */
  cInteres(factura: any) {
    this.totInteres = 0;
    this.arrCalculoInteres = [];
    let interes: number = 0;
    if (factura.estado != 3 && factura.formapago != 4) {
      let fec = factura.feccrea.toString().split('-', 2);
      let fechai: Date = new Date(`${fec[0]}-${fec[1]}-02`);
      let fechaf: Date = new Date();
      this.factura = factura;
      fechaf.setMonth(fechaf.getMonth() - 1);
      while (fechai <= fechaf) {
        this.calInteres = {} as calcInteres;
        let query = this._intereses.find(
          (interes: { anio: number; mes: number }) =>
            interes.anio === +fechai.getFullYear()! &&
            interes.mes === +fechai.getMonth()! + 1
        );
        if (!query) {
          this.calInteres.anio = +fechai.getFullYear()!;
          this.calInteres.mes = +fechai.getMonth()! + 1;
          this.calInteres.interes = 0;
          query = this.calInteres;
        } else {
          this.calInteres.anio = query.anio;
          this.calInteres.mes = query.mes;
          this.calInteres.interes = query.porcentaje;
          this.calInteres.valor = factura.totaltarifa;
          this.arrCalculoInteres.push(this.calInteres);
        }
        fechai.setMonth(fechai.getMonth() + 1);
      }
      this.arrCalculoInteres.forEach((item: any) => {
        //this.totInteres += (item.interes * item.valor) / 100;
        interes += (item.interes * item.valor) / 100;
        // this.subtotal();
      });
    }
    return interes;
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
  changeNCvalor() {
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
  //Valida que el valor de la NC no se mayor que el valor a cobrar
  valNC(control: AbstractControl) {
    if (this.formCobrar.value.valorAcobrar < control.value)
      return of({ invalido: true });
    else return of(null);
  }
  pdf() {}
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
      error: (err) => console.log(err.error),
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
