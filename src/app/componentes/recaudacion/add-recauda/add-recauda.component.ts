import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AbonadosService } from 'src/app/servicios/abonados.service';
import { ClientesService } from 'src/app/servicios/clientes.service';
import { Clientes } from 'src/app/modelos/clientes';
import { FacturaService } from 'src/app/servicios/factura.service';
import { RubroxfacService } from 'src/app/servicios/rubroxfac.service';
import { ColorService } from 'src/app/servicios/administracion/color.service';
import { Colores } from 'src/app/modelos/administracion/colores.model';
import { LecturasService } from 'src/app/servicios/lecturas.service';

@Component({
   selector: 'app-add-recauda',
   templateUrl: './add-recauda.component.html',
   styleUrls: ['./add-recauda.component.css']
})
export class AddRecaudaComponent implements OnInit {

   formBuscar: FormGroup;
   formCobrar: FormGroup;
   cliente = {} as Cliente; //Interface para los datos del Cliente
   mensaje = {} as Mensaje; //Interface para los mensajes
   swvalido = 1;     //Ups
   _cliente: any;    //Datos del Cliente
   formBusClientes: FormGroup;   //Buscar Clientes del Modal
   _cuentas: any;    //Cuentas del Cliente
   _clientes: any;   //Clientes del Modal de Búsqueda de Clientes
   filtro: string;
   privez = true;    //Para resetear los datos de Búsqueda de Clientes
   _sincobro: any;
   sumtotal: number; acobrar: number;
   swbusca = 0;   //0: Sin búsqueda, 1:No existe, 2:No tiene Planillas sinCobro, 3:Tiene Planillas sinCobro
   acobrardec: string;
   disabledcobro = true;
   _rubrosxfac: any;
   totfac: number;
   idfactura: number;   //Id de la Planilla a mostrar en el detalle
   consumo: number;
   formColores: FormGroup;   //Colores
   _tonoscabecera: any;
   _colorescabecera: any;
   _tonosdetalle: any;
   _coloresdetalle: any;
   swcobrado: boolean;

   constructor(public fb: FormBuilder, private aboService: AbonadosService, private clieService: ClientesService,
      public fb1: FormBuilder, private facService: FacturaService, private rubxfacService: RubroxfacService,
      private lecService: LecturasService, private coloService: ColorService) { }

   ngOnInit(): void {
      this.formBuscar = this.fb.group({
         cuenta: '',
         identificacion: '',
      });
      //Formulario de Busqueda de Clientes (Modal)
      this.formBusClientes = this.fb1.group({
         nombre_identifica: [null, [Validators.required, Validators.minLength(5)]],
      });
      //Formulario Cobrar
      this.formCobrar = this.fb.group({
         acobrar: 0,
         dinero: '',
         vuelto: ''
      });

      //Al digitar quita alerta
      let cuenta = document.getElementById("cuenta") as HTMLInputElement;
      if (cuenta != null) {
         cuenta.addEventListener('keyup', () => {
            this.swvalido = 1;
            this.formBuscar.controls['identificacion'].setValue('');
         });
      }

      let identificacion = document.getElementById("identificacion") as HTMLInputElement;
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
         colores1: t
      });

   }

   onSubmit() {
      this.swcobrado = false; this.acobrar = 0;
      this._cliente = [];
      this.reset();
      if ((this.formBuscar.value.cuenta == null || this.formBuscar.value.cuenta == '') &&
         (this.formBuscar.value.identificacion == null || this.formBuscar.value.identificacion == '') &&
         (this.formBuscar.value.nombre == null || this.formBuscar.value.nombre == '')) {
         this.swvalido = 0;
      } else {
         this.swvalido = 1;
         if (this.formBuscar.value.cuenta != null && this.formBuscar.value.cuenta != '') {
            this.aboService.getByIdabonado(this.formBuscar.value.cuenta).subscribe({
               next: datos => {
                  this._cliente = datos;
                  if (this._cliente.length > 0) {
                     this.datosCliente("cuenta");
                  } else {
                     this.swbusca = 1;
                     this.mensaje.campo = "Cuenta: ";
                     this.mensaje.texto = this.formBuscar.value.cuenta;
                  }
               },
               error: err => console.error('Al obtener idabonado: ', err.error)
            })
         } else {
            if (this.formBuscar.value.identificacion != null && this.formBuscar.value.identificacion != '') {
               this.buscaIdentificacion(this.formBuscar.value.identificacion);
            }
         }
      }
   }

   buscaIdentificacion(identificacion: String) {
      this.acobrar = 0;
      this.clieService.getByIdentificacion(identificacion).subscribe({
         next: datos => {
            this._cliente = datos;
            if (this._cliente.length > 0) {
               this.datosCliente("identificacion");
            } else {
               this.swbusca = 1;
               this.mensaje.campo = "Identificación: ";
               this.mensaje.texto = identificacion;
            }
         },
         error: err => console.error('Al buscar la Identificación: ', err.error)
      });
   }

   datosCliente(campo: String) {
      if (campo == "cuenta") {
         this.cliente.nombre = this._cliente[0].idcliente_clientes.nombre;
         this.cliente.cedula = this._cliente[0].idcliente_clientes.cedula;
         this.cliente.direccion = this._cliente[0].idcliente_clientes.direccion;
         this.cliente.telefono = this._cliente[0].idcliente_clientes.telefono;
         this.cliente.email = this._cliente[0].idcliente_clientes.email;
         this.cliente.porcexonera = this._cliente[0].idcliente_clientes.porcexonera / 100;
         this.cliente.porcdiscapacidad = this._cliente[0].idcliente_clientes.porcdiscapacidad / 100;
         this.sinCobro(this._cliente[0].idcliente_clientes.idcliente);
      }
      if (campo == "identificacion") {
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
      this.swcobrado = false; this.swbusca = 0; this.acobrar = 0;
      this.formBuscar.controls['cuenta'].setValue('');
      this.formBuscar.controls['identificacion'].setValue('');
   }

   sinCobro(idcliente: number) {
      this.facService.getSinCobro(idcliente).subscribe({
         next: datos => {
            this._sincobro = datos;
            if (this._sincobro.length > 0) {
               this.swbusca = 3;
               this.total();
            } else {
               this.swbusca = 2;
               this.sumtotal = 0
            }
         }, error: err => console.error(err.error)
      });
   }

   total() {
      let suma: number = 0; let i = 0;
      this._sincobro.forEach(() => {
         suma += this._sincobro[i].totaltarifa;
         i++;
      });
      this.sumtotal = suma;
   }

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
      if (this.formBusClientes.value.nombre_identifica != null && this.formBusClientes.value.nombre_identifica != '') {
         this.clieService.getByNombreIdentifi(this.formBusClientes.value.nombre_identifica).subscribe({
            next: datos => this._clientes = datos,
            error: err => console.log(err.error)
         })
      }
   }

   selecCliente(cliente: Clientes) {
      this.formBuscar.controls['cuenta'].setValue('');
      this.formBuscar.controls['identificacion'].setValue(cliente.cedula.toString());
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

   marcarTodas(event: any) {
      let valor: number = 0;
      if (event.target.checked) { valor = 1; }
      let i = 0;
      this._sincobro.forEach(() => {
         this._sincobro[i].pagado = valor;
         i++;
      });
      this.totalAcobrar();
   }

   totalAcobrar() {
      let suma: number = 0; let i = 0;
      this._sincobro.forEach(() => {
         if (this._sincobro[i].pagado == 1) {
            suma += this._sincobro[i].totaltarifa;
         }
         i++;
      });
      this.acobrar = suma;
   }

   valorAcobrar(acobrar: number) {
      this.disabledcobro = true;
      let entero = Math.trunc(acobrar)
      this.formCobrar.controls['acobrar'].setValue(entero.toString());
      let decimal = (acobrar - entero).toFixed(2)
      this.acobrardec = decimal.toString().slice(1);
      this.formCobrar.controls['dinero'].setValue('');
      this.formCobrar.controls['vuelto'].setValue('');
      let dinero = document.getElementById("dinero") as HTMLInputElement;
      dinero.addEventListener('keyup', () => {
         let vuelto = (this.formCobrar.controls['dinero'].value - this.acobrar).toFixed(2);
         this.formCobrar.controls['vuelto'].setValue(vuelto.toString());
         if (this.formCobrar.controls['vuelto'].value > 0) { this.disabledcobro = false } else { this.disabledcobro = true }
      });
   }

   valorDinero() {
      this.formCobrar.controls['dinero'].setValue(this.acobrar.toFixed(2).toString());
      this.formCobrar.controls['vuelto'].setValue('');
      this.disabledcobro = false;
   }

   //Modal del Detalle de la Planilla
   getRubroxfac(idfactura: number) {
      let _lecturas: any;
      this.consumo = 0;
      this.idfactura = idfactura;
      this.rubxfacService.getByIdfactura(+idfactura!).subscribe({
         next: detalle => {
            this._rubrosxfac = detalle;
            this.lecService.getByIdfactura(idfactura).subscribe({
               next: resp => {
                  _lecturas = resp;
                  this.consumo = _lecturas[0].lecturaactual - _lecturas[0].lecturaanterior;
               },
               error: err => console.error('Al recuperar la Lectura de la Planilla: ', err.error)
            })
            this.subtotal();
         },
         error: err => console.error('Al recuperar el datalle de la Planilla: ', err.error)
      },);
   }

   //Subtotal de la Planilla
   subtotal() {
      let suma12: number = 0;
      let suma0: number = 0;
      let i = 0;
      this._rubrosxfac.forEach(() => {
         if (this._rubrosxfac[i].idrubro_rubros.swiva == 1) {
            suma12 += this._rubrosxfac[i].cantidad * this._rubrosxfac[i].valorunitario;
         }
         else {
            if (this._rubrosxfac[i].idrubro_rubros.esiva == 0) {
               suma0 += this._rubrosxfac[i].cantidad * this._rubrosxfac[i].valorunitario;
            }
            else {
            }
         }
         i++;
      });
      this.totfac = suma12 + suma0;
   }
   cobrar() {
    this.swcobrado = true;
   }

   tonos() {
      setTimeout(() => {
         this.coloService.getTonos().subscribe({
            next: datos => {
               this._tonoscabecera = datos;
               this._tonosdetalle = datos;
               const defaultValue0 = this._tonoscabecera.find((tono: { idcolor: number; }) => tono.idcolor === 143);
               const defaultValue2 = this._tonosdetalle.find((tono2: { idcolor: number; }) => tono2.idcolor === 125);
               this.formColores = this.fb.group({
                  tonos0: defaultValue0,
                  colores0: new Colores(),
                  tonos1: defaultValue2,
                  colores1: new Colores(),
               });
               this.coloService.getByTono(this.formColores.value.tonos0.codigo).subscribe({
                  next: resp => {
                     this._colorescabecera = resp;
                     const defaultValue1 = this._colorescabecera.find((color: { idcolor: number; }) => color.idcolor === 152);
                     this.coloService.getByTono(this.formColores.value.tonos1.codigo).subscribe({
                        next: resp1 => {
                           this._coloresdetalle = resp1;
                           let defaultValue3 = this._coloresdetalle.find((color1: { idcolor: number; }) => color1.idcolor === 131);
                           this.formColores = this.fb.group({
                              tonos0: defaultValue0,
                              colores0: defaultValue1,
                              tonos1: defaultValue2,
                              colores1: defaultValue3,
                           });
                        },
                        error: err => console.error('Al recuperar los Colores por Tono', err.error)
                     })
                  },
                  error: err => console.error('Al recuperar los Colores por Tono', err.error)
               });
            },
            error: err => console.error('Al recuperar los Tonos', err.error)
         });
      }, 500);
      const tonocabecera = document.getElementById("tonocabecera") as HTMLSelectElement;
      tonocabecera.addEventListener("change", () => {
         // Recupera los Colores del Tono seleccionado
         this._colorescabecera = [];
         this.coloService.getByTono(this.formColores.value.tonos0.codigo).subscribe({
            next: datos => this._colorescabecera = datos,
            error: err => console.error('Al recuperar los Colores por Tono', err.error)
         });
      });
      // =========== Detalle ===========
      const tono1 = document.getElementById("tonodetalle") as HTMLSelectElement;
      tono1.addEventListener("change", () => {
         this._coloresdetalle = [];
         this.coloService.getByTono(this.formColores.value.tonos1.codigo).subscribe({
            next: datos => this._coloresdetalle = datos,
            error: err => console.error('Al recuperar los Colores por Tono', err.error)
         });
      });
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
