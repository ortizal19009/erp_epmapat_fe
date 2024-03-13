import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { ColoresService } from 'src/app/compartida/colores.service';
import { Usuarios } from 'src/app/modelos/administracion/usuarios.model';
import { Cajas } from 'src/app/modelos/cajas.model';
import { Clientes } from 'src/app/modelos/clientes';
import { Ptoemision } from 'src/app/modelos/ptoemision';
import { Recaudaxcaja } from 'src/app/modelos/recaudaxcaja.model';
import { AbonadosService } from 'src/app/servicios/abonados.service';
import { CajaService } from 'src/app/servicios/caja.service';
import { ClientesService } from 'src/app/servicios/clientes.service';
import { FacturaService } from 'src/app/servicios/factura.service';
import { LecturasService } from 'src/app/servicios/lecturas.service';
import { RecaudaxcajaService } from 'src/app/servicios/recaudaxcaja.service';
import { RubroxfacService } from 'src/app/servicios/rubroxfac.service';

@Component({
   selector: 'app-transferencias',
   templateUrl: './transferencias.component.html',
   styleUrls: ['./transferencias.component.css'],
})
export class TransferenciasComponent implements OnInit {
   formBuscar: FormGroup;
   swvalido = 1; //Ups
   atransferir: number;
   swtransferido: boolean;
   swbusca = 0; //0: Sin búsqueda, 1:No existe, 2:No tiene Planillas sinCobro, 3:Tiene Planillas sinCobro
   cliente = {} as Cliente; //Interface para los datos del Cliente
   mensaje = {} as Mensaje; //Interface para los mensajes
   _sincobro: any;
   consumo: number;
   idfactura: number; //Id de la Planilla a mostrar en el detalle
   _rubrosxfac: any;
   totfac: number;
   sumtotal: number;
   formBusClientes: FormGroup; //Buscar Clientes del Modal
   _clientes: any; //Clientes del Modal de Búsqueda de Clientes
   filtro: string;
   _cliente: any; //Datos del Cliente
   formTransferir: FormGroup;
   _establecimiento: Ptoemision = new Ptoemision();
   _usuario: Usuarios = new Usuarios();

   _nroFactura: any;
   _codRecaudador: any;
   estadoCajaT: boolean = true;
   caja: Cajas = new Cajas();
   cajaActiva: boolean = false;
   _caja: Cajas = new Cajas();
   recxcaja: Recaudaxcaja = new Recaudaxcaja();

   constructor(
      private coloresService: ColoresService,
      public fb: FormBuilder,
      private aboService: AbonadosService,
      private lecService: LecturasService,
      private rubxfacService: RubroxfacService,
      private authService: AutorizaService,
      private clieService: ClientesService,
      private facService: FacturaService,
      private s_cajas: CajaService,
      private s_recaudaxcaja: RecaudaxcajaService
   ) { }

   ngOnInit(): void {
      sessionStorage.setItem('ventana', '/transferencias');
      let coloresJSON = sessionStorage.getItem('/transferencias');
      if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));
      else this.buscaColor();
      this.formBuscar = this.fb.group({
         cuenta: '',
         identificacion: '',
      });
      //Formulario de Busqueda de Clientes (en Modal)
      this.formBusClientes = this.fb.group({
         nombre_identifica: [null, [Validators.required, Validators.minLength(5)]],
      });

      this.formTransferir = this.fb.group({ atransferir: 0 });

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
      this.abrirCaja();
   }

   async buscaColor() {
      try {
         const datos = await this.coloresService.setcolor(
            this.authService.idusuario,
            'transferencias'
         );
         const coloresJSON = JSON.stringify(datos);
         sessionStorage.setItem('/transferencias', coloresJSON);
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
   onSubmit() {
      this.swtransferido = false;
      this.atransferir = 0;
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
                  console.log(datos)
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

   reset() {
      this.cliente.nombre = '';
      this.cliente.cedula = '';
      this.cliente.direccion = '';
      this.cliente.telefono = '';
      this.cliente.email = '';
      this.cliente.porcexonera = null;
      this.cliente.porcdiscapacidad = null;
   }

   clientesModal() { }

   valorAtransferir(atransferir: number) {
      this.formTransferir.patchValue({ atransferir: atransferir });
   }

   reiniciar() {
      this.swtransferido = false;
      this.swbusca = 0;
      this.atransferir = 0;
      this.formBuscar.controls['cuenta'].setValue('');
      this.formBuscar.controls['identificacion'].setValue('');
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
      this.totalAtransferir();
   }

   totalAtransferir() {
      let suma: number = 0;
      let i = 0;
      console.log(this._sincobro)
      this._sincobro.forEach(() => {
         if (this._sincobro[i].pagado === 1) {
            suma +=
               this._sincobro[i].totaltarifa +
               this._sincobro[i].comerc +
               this._sincobro[i].interes +
               this._sincobro[i].multa;
         }
         i++;
      });
      this.atransferir = suma;
   }

   marcarAnteriores(index: number) {
      console.log('MARCAR ANTERIORES')
      if (
         this._sincobro[index].idmodulo.idmodulo == 3 ||
         this._sincobro[index].idmodulo.idmodulo == 4
      ) {
         //Solo para Emision
         if (this._sincobro[index].pagado) {
            console.log(this._sincobro[index])
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
            console.log('cuenta anterior')
            let i = index;
            while (i <= this._sincobro.length - 1) {
               if (antCuenta != this._sincobro[i].idabonado) break;
               this._sincobro[i].pagado = 0;
               antCuenta = this._sincobro[i].idabonado;
               i++;
            }
         }
      }
      this.totalAtransferir();
   }

   //Modal del Detalle de la Planilla
   getRubroxfac(idfactura: number) {
      let _lecturas: any;
      this.consumo = 0;
      this.idfactura = idfactura;
      this.lecService.getByIdfactura(idfactura).subscribe({
         next: (resp) => {
            _lecturas = resp;
            this.consumo =
               _lecturas[0].lecturaactual - _lecturas[0].lecturaanterior;
            this.rubxfacService.getByIdfactura(idfactura).subscribe({
               next: (detalle) => {
                  this._rubrosxfac = detalle;
                  this.subtotal();
               },
               error: (err) =>
                  console.error(
                     'Al recuperar el datalle de la Planilla: ',
                     err.error
                  ),
            });
         },
         error: (err) =>
            console.error('Al recuperar la Lectura de la Planilla: ', err.error),
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
      this.totfac = suma12 + suma0;
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

   buscaIdentificacion(identificacion: String) {
      this.atransferir = 0;
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

   sinCobro(idcliente: number) {
      this.facService.getSinCobro(idcliente).subscribe({
         next: (datos) => {
            this._sincobro = datos;
            if (this._sincobro.length > 0) {
               let suma: number = 0;
               let i = 0;
               this._sincobro.forEach(() => {
                  if (this._sincobro[i].idmodulo.idmodulo == 3)
                     this._sincobro[i].comerc = 1;
                  this._sincobro[i].interes = 0;
                  this._sincobro[i].multa = 0;
                  suma +=
                     this._sincobro[i].totaltarifa +
                     this._sincobro[i].comerc +
                     this._sincobro[i].multa +
                     this._sincobro[i].interes;
                  i++;
               });
               this.sumtotal = suma;
               this.swbusca = 3;
            } else {
               this.swbusca = 2;
               this.sumtotal = 0;
            }
         },
         error: (err) => console.error(err.error),
      });
   }

   get f() {
      return this.formTransferir.controls;
   }

   transferir() {
      let i = 0;
      this.actufacturas(i);
      // this.onSubmit();
   }

   actufacturas(i: number) {
      let idfactura: number;
      let fechatransferencia: Date = new Date();
      if (this._sincobro[i].pagado) {
         idfactura = this._sincobro[i].idfactura;
         this.facService.getById(idfactura).subscribe({
            next: (fac) => {
               //Actualiza Factura como Transferida
               fac.estado = 3;
               fac.fechatransferencia = fechatransferencia;
               fac.usuariotransferencia = this.authService.idusuario;
               fac.pagado = 1;
               fac.fechacobro = fechatransferencia;
               fac.usuariocobro = this.authService.idusuario;
               fac.formapago = 4;
               this.facService.updateFacturas(fac).subscribe({
                  next: (nex) => {
                     this.swtransferido = true;
                     // console.log('Actualización Ok!')
                     i++;
                     if (i < this._sincobro.length) this.actufacturas(i);
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
         //No marcada continua con la siguiente
         i++;
         if (i < this._sincobro.length) this.actufacturas(i);
      }
   }
   abrirCaja() {
      this.s_cajas.getByIdUsuario(this.authService.idusuario).subscribe({
         next: (datos) => {
            this._caja = datos;
            this._establecimiento = datos.idptoemision_ptoemision;
            this._usuario = datos.idusuario_usuarios;
            this._codRecaudador = `${datos.idptoemision_ptoemision.establecimiento}-${datos.codigo}`;
            /* VALIDAR SI LA CAJA ESTA ABIERTA O CERRADA */
            this.s_recaudaxcaja.getLastConexion(this._caja.idcaja).subscribe({
               next: (datos) => {
                  let c_fecha: Date = new Date();
                  let l_fecha: Date = new Date(datos.fechainiciolabor);
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
               },
               error: (e) => console.error(e),
            });

            if (datos.ultimafact === null) {
               this.facService.valLastFac(datos.codigo.toString()).subscribe({
                  next: (dato: any) => {
                     let nrofac = dato.nrofactura.split('-', 3);
                     this._nroFactura = `${this._codRecaudador}-${nrofac[2]
                        .toString()
                        .padStart(9, '0')}`;
                  },
                  error: (e) => console.error(e),
               });
            } else {
               let nrofac = datos.ultimafact.split('-', 3);
               //let nrofac_f = +nrofac[2]! + 1
               this._nroFactura = `${this._codRecaudador}-${nrofac[2]
                  .toString()
                  .padStart(9, '0')}`;
            }
         },
      });
   }

   validarCaja() {
      let fecha: Date = new Date();

      let nrofac = this._nroFactura.split('-', 3);
      sessionStorage.setItem('ultfac', nrofac[2]);
      //this._caja.estado = 1;
      this.recxcaja.estado = 1;
      this.recxcaja.facinicio = +nrofac[2]! + 1;
      this.recxcaja.fechainiciolabor = fecha;
      //recxcaja.horainicio = fecha;
      this.recxcaja.idcaja_cajas = this._caja;
      this.recxcaja.idusuario_usuarios = this._caja.idusuario_usuarios;
      console.log(this.recxcaja);
      this.s_recaudaxcaja.saveRecaudaxcaja(this.recxcaja).subscribe({
         next: (datos) => {
            this.estadoCajaT = false;
         },
         error: (e) => console.error(e),
      });
   }
   cerrarCaja() {
      sessionStorage.setItem('estadoCaja', '0');
      this.s_recaudaxcaja.getLastConexion(this._caja.idcaja).subscribe({
         next: (datos) => {
            let c_fecha: Date = new Date();
            this.recxcaja = datos;
            this.recxcaja.estado = 0;
            this.recxcaja.fechafinlabor = c_fecha;
            this.estadoCajaT = true;
            this.s_recaudaxcaja.updateRecaudaxcaja(this.recxcaja).subscribe({
               next: (datos) => {
                  console.log('caja cerrada');
               },
               error: (e) => console.error(e),
            });
         },
         error: (e) => console.error(e),
      });
   }

   valorTarifas(
      tarifa: number,
      cons: number,
      interes: number,
      multa: number,
      modulo: number,
      valorbase: number
   ) {
      //console.log('tarifa', tarifa, 'comercializacion', cons, 'interes', interes, 'multa', multa, 'modulo', modulo, 'valorbase', valorbase)
      if (modulo != 8) {
         let t = 0,
            c = 0,
            i = 0,
            m = 0;
         t = tarifa === undefined ? 0 : tarifa;
         c = cons === undefined ? 0 : cons;
         i = interes === undefined ? 0 : interes;
         m = multa === undefined ? 0 : multa;
         return t + c + i + m;
      } else {
         return valorbase;
      }
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
