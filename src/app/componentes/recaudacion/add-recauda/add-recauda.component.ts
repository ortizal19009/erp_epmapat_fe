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

  /* Intereses */
  calInteres = {} as calcInteres;
  totInteres: number = 0;
  arrCalculoInteres: any = [];
  factura: Facturas = new Facturas();
  _intereses: any;

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
    private interService: InteresesService
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
      // dinero: '',
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
  }

  get f() {
    return this.formCobrar.controls;
  }

  //Formas de cobro
  listFormasCobro() {
    this.fcobroService.getAll().subscribe({
      next: (datos) => {
        this._formascobro = datos;
        this.formCobrar.patchValue({ idformacobro: this._formascobro[0] });
      },
      error: (err) => console.error(err.error),
    });
  }

  onSubmit() {
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
    this.facService.getSinCobro(idcliente).subscribe({
      next: (datos) => {
        console.log(datos)
        this._sincobro = datos;
        if (this._sincobro.length > 0) {
          let suma: number = 0;
          let i = 0;
          this._sincobro.forEach((item: any, index: number) => {
            let interes = this.cInteres(item);
            if (this._sincobro[i].idmodulo.idmodulo == 3) {
              // console.log(this._sincobro[i]);
              this._sincobro[i].interes = interes;

              this._sincobro[i].comerc = 1;
              this._sincobro[i].interes = interes;
              this._sincobro[i].multa = 0;
              suma +=
                this._sincobro[i].totaltarifa +
                this._sincobro[i].comerc +
                this._sincobro[i].multa +
                this._sincobro[i].interes;
            }
            i++;
          });
          this.sumtotal = suma;
          this.swbusca = 3;
          // this.total();
        } else {
          this.swbusca = 2;
          this.sumtotal = 0;
        }
      },
      error: (err) => console.error(err.error),
    });
  }

  //Total de las planillas sin cobrar
  // total() {
  //    let suma: number = 0; let i = 0;
  //    this._sincobro.forEach(() => {
  //       if (this._sincobro[i].idmodulo.idmodulo == 3) suma += this._sincobro[i].totaltarifa + 1;
  //       else suma += this._sincobro[i].totaltarifa;
  //       // suma += this._sincobro[i].totaltarifa;
  //       i++;
  //    });
  //    this.sumtotal = suma;
  // }

  reset() {
    this.cliente.nombre = '';
    this.cliente.cedula = '';
    this.cliente.direccion = '';
    this.cliente.telefono = '';
    this.cliente.email = '';
    this.cliente.porcexonera = null;
    this.cliente.porcdiscapacidad = null;
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
    console.log('formacobro.idformacobro: ', formacobro.idformacobro);
    if (formacobro.idformacobro > 1) this.valorDinero();
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
    // console.log('this._sincobro[index].idmodulo: ', this._sincobro[index].idmodulo)
    if (
      this._sincobro[index].idmodulo.idmodulo == 3 ||
      this._sincobro[index].idmodulo.idmodulo == 4
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
    }
    this.totalAcobrar();
  }

  totalAcobrar() {
    let suma: number = 0;
    let i = 0;
    //console.log(this._sincobro);
    this._sincobro.forEach((item: any, index: number) => {
      if (this._sincobro[i].pagado == 1) {
        console.log(this._sincobro)
        suma +=
          this._sincobro[i].totaltarifa +
          this._sincobro[i].comerc +
          this._sincobro[i].interes +
          this._sincobro[i].multa
        //interes;
        // if (this._sincobro[i].idmodulo.idmodulo == 3) suma += this._sincobro[i].totaltarifa + 1;
        // else suma += this._sincobro[i].totaltarifa;
      }
      i++;
    });
    this.acobrar = suma;
  }

  valorAcobrar(acobrar: number) {
    this.disabledcobro = true;
    let entero = Math.trunc(acobrar);
    let decimal = (acobrar - entero).toFixed(2);
    this.acobrardec = decimal.toString().slice(1);
    this.formCobrar.patchValue({
      valorAcobrar: acobrar,
      acobrar: entero,
      dinero: '',
      vuelto: '',
    });
  }

  //Es mejor que HTMLInputElement para formularios
  changeDinero() {
    let vuelto = (
      this.formCobrar.controls['dinero'].value - this.acobrar
    ).toFixed(2);
    this.formCobrar.controls['vuelto'].setValue(vuelto.toString());
    if (this.formCobrar.controls['vuelto'].value > 0) {
      this.disabledcobro = true;
    } else {
      this.disabledcobro = true;
    }
  }

  valorDinero() {
    this.formCobrar.controls['dinero'].setValue(
      this.acobrar.toFixed(2).toString()
    );
    this.formCobrar.controls['vuelto'].setValue('');
    // this.disabledcobro = false;
  }

  //Modal del Detalle de la Planilla
  getRubroxfac(idfactura: number) {
    this._rubrosxfac = []
    let _lecturas: any;
    this.consumo = 0;
    this.idfactura = idfactura;
    this.lecService.getByIdfactura(idfactura).subscribe({
      next: (resp) => {
        if (resp.length != 0) {
          _lecturas = resp;
          this.consumo =
            _lecturas[0].lecturaactual - _lecturas[0].lecturaanterior;
          this.rubxfacService.getByIdfactura(idfactura).subscribe({
            next: (detalle) => {
              console.log(detalle)
              this._rubrosxfac = detalle;
              this.subtotal();
              this.calcularInteres();
            },
            error: (err) =>
              console.error(
                'Al recuperar el datalle de la Planilla: ',
                err.error
              ),
          });
        } this.subtotal();
      },
      error: (err) =>
        console.error('Al recuperar la Lectura de la Planilla: ', err.error),
    });
  }

  getRubroxfac1(idfactura: number) {
    console.log(idfactura)
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
    this.totfac = suma12 + suma0 + this.totInteres;
  }

  cobrar() {
    let i = 0;
    this.updateFacturas(i);
  }
  updateFacturas(i: number) {
    let idfactura: number;
    let fechacobro: Date = new Date();
    if (this._sincobro[i].pagado) {
      idfactura = this._sincobro[i].idfactura;
      this.facService.getById(idfactura).subscribe({
        next: (resp) => {
          // console.log('resp: ', resp);
          resp.fechacobro = fechacobro;
          resp.usuariocobro = this.authService.idusuario;
          resp.pagado = 1;
          this.facService.updateFacturas(resp).subscribe({
            next: (nex) => {
              this.swcobrado = true;
              // console.log('Actualización Ok!')
              i++;
              if (i < this._sincobro.length) this.updateFacturas(i);
            },
            error: (err) =>
              console.error('Al actualizar la Factura: ', err.error),
          });
        },
        error: (err) =>
          console.error(
            'Al recuperar los datos de la Factura a actualizar: ',
            err.error
          ),
      });
    } else {
      i++;
      if (i < this._sincobro.length) this.updateFacturas(i);
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
    if (this.formCobrar.value.valorAcobrar > control.value)
      return of({ invalido: true });
    else return of(null);
  }

  impComprobante(datos: any) {
    //console.log(datos);
    this.getRubroxfac(datos.idfactura);
    this.idfactura = datos.idfactura;
    this.rubxfacService.getByIdfactura(+datos.idfactura!).subscribe({
      next: (detalle) => {
        this._rubrosxfac = detalle;
        //console.log(detalle);
        this.s_pdfRecaudacion.comprobantePago(datos, detalle);
        /*  this.lecService.getByIdfactura(idfactura).subscribe({
          next: (resp) => {
            _lecturas = resp;
            console.log(resp);
            this.consumo =
              _lecturas[0].lecturaactual - _lecturas[0].lecturaanterior;
          },
          error: (err) =>
            console.error(
              'Al recuperar la Lectura de la Planilla: ',
              err.error
            ),
        }); */
        // this.subtotal();
      },
      error: (err) =>
        console.error('Al recuperar el datalle de la Planilla: ', err.error),
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

  calcularInteres() {
    let idFactura = +this.idfactura!;
    this.totInteres = 0;
    this.arrCalculoInteres = [];
    let interes: number = 0;
    //let date: Date = new Date();
    this.facService.getById(idFactura).subscribe({
      next: (datos) => {
        // console.log(datos);
        let fec = datos.feccrea.toString().split('-', 2);
        let fechai: Date = new Date(`${fec[0]}-${fec[1]}-02`);
        let fechaf: Date = new Date();
        this.factura = datos;
        //fechai.setMonth(fechai.getMonth() + 1);
        fechaf.setMonth(fechaf.getMonth() - 1);
        while (fechai <= fechaf) {
          this.calInteres = {} as calcInteres;
          let query = this._intereses.find(
            (interes: { anio: number; mes: number }) =>
              interes.anio === +fechai.getFullYear()! &&
              interes.mes === +fechai.getMonth()! + 1
          );
          if (!query) {
            console.log("Este mes no hay interes", this.calInteres.anio, this.calInteres.mes)

            this.calInteres.anio = +fechai.getFullYear()!
            this.calInteres.mes = +fechai.getMonth()! + 1
            this.calInteres.interes = 0
            query = this.calInteres
          } else {
            this.calInteres.anio = query.anio;
            this.calInteres.mes = query.mes;
            this.calInteres.interes = query.porcentaje;
            this.calInteres.valor = datos.totaltarifa;
            /*       this.arrCalculoInteres.push(this.calInteres);
                  fechai.setMonth(fechai.getMonth() + 1); */


          }
          this.arrCalculoInteres.push(this.calInteres);
          fechai.setMonth(fechai.getMonth() + 1);
        }
        this.arrCalculoInteres.forEach((item: any) => {
          this.totInteres += (item.interes * item.valor) / 100;
          interes += (item.interes * item.valor) / 100;

        });
        this.subtotal();
        // console.log(interes);
        // return interes;
      },
      error: (e) => console.error(e),
    });
  }

  cInteres(factura: any) {
    this.totInteres = 0;
    this.arrCalculoInteres = [];
    let interes: number = 0;
    let fec = factura.feccrea.toString().split('-', 2);
    let fechai: Date = new Date(`${fec[0]}-${fec[1]}-02`);
    let fechaf: Date = new Date();
    this.factura = factura;
    //fechai.setMonth(fechai.getMonth() + 1);
    fechaf.setMonth(fechaf.getMonth() - 1);
    while (fechai <= fechaf) {
      this.calInteres = {} as calcInteres;
      let query = this._intereses.find(
        (interes: { anio: number; mes: number }) =>
          interes.anio === +fechai.getFullYear()! &&
          interes.mes === +fechai.getMonth()! + 1
      );
      if (!query) {

        this.calInteres.anio = +fechai.getFullYear()!
        this.calInteres.mes = +fechai.getMonth()! + 1
        this.calInteres.interes = 0
        query = this.calInteres
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
    return interes;
  }
  valorTarifas(tarifa: number, cons: number, interes: number, multa: number) {
    let t = 0, c = 0, i = 0, m = 0
    t = tarifa === undefined ? 0 : tarifa;
    c = cons === undefined ? 0 : cons;
    i = interes === undefined ? 0 : interes;
    m = multa === undefined ? 0 : multa;
    //t = tarifa;
    //c = cons;
    //i = interes;
    //m = multa
    return t + c + i + m;

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
