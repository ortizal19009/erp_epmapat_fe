import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { rejects } from 'assert';
import { resolve } from 'path';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { ColoresService } from 'src/app/compartida/colores.service';
import { DefinirService } from 'src/app/servicios/administracion/definir.service';
import { FacturaService } from 'src/app/servicios/factura.service';
import { FecFacturaDetallesImpuestosService } from 'src/app/servicios/fec-factura-detalles-impuestos.service';
import { FecFacturaDetallesService } from 'src/app/servicios/fec-factura-detalles.service';
import { FecFacturaPagosService } from 'src/app/servicios/fec-factura-pagos.service';
import { FecfacturaService } from 'src/app/servicios/fecfactura.service';
import { RubroxfacService } from 'src/app/servicios/rubroxfac.service';

@Component({
   selector: 'app-fecfactura',
   templateUrl: './fecfactura.component.html',
   styleUrls: ['./fecfactura.component.css']
})
export class FecfacturaComponent implements OnInit {

   empresa: any;
   formExportar: FormGroup;
   swbotones: boolean = false;
   swcalculando: boolean = false;
   txtcalculando = 'Calculando';
   _facturas: any;
   swexportar: boolean;
   swfacturas: boolean;
   claveacceso: string;
   sumaTotal: number = 0;
   tipocobro: string;

   constructor(private router: Router, private fb: FormBuilder, public authService: AutorizaService, private defService: DefinirService,
      private coloresService: ColoresService, private facService: FacturaService, private fecfacService: FecfacturaService, private rxfService: RubroxfacService, private fec_facdetalleService: FecFacturaDetallesService, private fec_facdetimpService: FecFacturaDetallesImpuestosService, private fec_facPagosService: FecFacturaPagosService) { }

   ngOnInit(): void {
      sessionStorage.setItem('ventana', '/fecfactura');
      let coloresJSON = sessionStorage.getItem('/fecfactura');
      if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));
      else this.buscaColor();

      const fechaActual = new Date();
      this.formExportar = this.fb.group({
         nrofactura: '',
         estab: '',
         ptoemi: '',
         desdeNum: '',
         hastaNum: '',
         desdeFecha: obtenerFechaActualString(fechaActual),
         hastaFecha: obtenerFechaActualString(fechaActual)
      });

   }

   colocaColor(colores: any) {
      document.documentElement.style.setProperty('--bgcolor1', colores[0]);
      const cabecera = document.querySelector('.cabecera');
      if (cabecera) cabecera.classList.add('nuevoBG1')
      document.documentElement.style.setProperty('--bgcolor2', colores[1]);
      const detalle = document.querySelector('.detalle');
      if (detalle) detalle.classList.add('nuevoBG2');
   }

   async buscaColor() {
      try {
         const datos = await this.coloresService.setcolor(this.authService.idusuario, 'fecfactura');
         const coloresJSON = JSON.stringify(datos);
         sessionStorage.setItem('/fecfactura', coloresJSON);
         this.colocaColor(datos);
      } catch (error) { console.error(error); }
   }

   async datosDefinirAsync() {
      try {
         const def = await this.defService.getByIddefinirAsync(1);
         this.empresa = def;
      } catch (error) {
         console.log('Al recuperar los datos de la Empresa', error);
      }
   }

   regresar() { this.router.navigate(['/inicio']); }

   buscar() {
      this.datosDefinirAsync();
      this.swexportar = false;
      let nrofactura = this.formExportar.value.nrofactura;
      this.facService.getByNrofactura(nrofactura).subscribe({
         next: (datos: any) => {
            this._facturas = datos;
            switch (this._facturas.length) {
               case 1:
                  this.swexportar = true;
                  this.swfacturas = true;
                  break;
               case 0:
                  //   this.s_abonados.getListaByNombreCliente(this.f_abonado.value.buscarAbonado).subscribe(datos => {
                  //     this.abonado = datos;
                  //   });
                  break;
               default:
                  break;
            }
         },
         error: err => console.error(err.error)
      });
   }
   async exportar() {
      await this._exportar()
   }
   async _exportar() {

      let fecfactura = {} as Fec_factura;
      fecfactura.idfactura = this._facturas[0].idfactura;
      this.claveAcceso();
      fecfactura.claveacceso = this.claveacceso;
      fecfactura.secuencial = this._facturas[0].nrofactura.slice(8, 18);
      fecfactura.estado = 'I';
      fecfactura.establecimiento = this._facturas[0].nrofactura.slice(0, 3);
      fecfactura.puntoemision = this._facturas[0].nrofactura.slice(4, 7);
      fecfactura.direccionestablecimiento = this.empresa.direccion;
      fecfactura.fechaemision = this._facturas[0].fechacobro;
      fecfactura.tipoidentificacioncomprador = this._facturas[0].idcliente.idtpidentifica_tpidentifica.codigo;
      fecfactura.razonsocialcomprador = this._facturas[0].idcliente.nombre;
      fecfactura.identificacioncomprador = this._facturas[0].idcliente.cedula;
      fecfactura.direccioncomprador = this._facturas[0].idcliente.direccion;
      fecfactura.telefonocomprador = this._facturas[0].idcliente.telefono;
      fecfactura.emailcomprador = this._facturas[0].idcliente.email;
      this.tipocobro = this._facturas[0].formapago;
      this.fecfacService.save(fecfactura).subscribe({
         next: async (resp: any) => {
            this.swexportar = false;
            this.formExportar.controls['nrofactura'].setValue('');
            this.swfacturas = false;
            let codImpuesto = 0;
            if (resp.fechacobro <= '2024-03-31') {
               codImpuesto = 2
            } else {
               codImpuesto = 4;
            }
            this.rxfService.getRubrosAsync(resp.idfactura).then(async (item: any) => {
               let i = 0;
               this.sumaTotal= 0;
               item.forEach((rxf: any) => {
                  let detalle = {} as Fec_factura_detalles;
                  let basImponible: number = 0 ; 
                  detalle.idfacturadetalle = rxf.idrubroxfac
                  detalle.idfactura = rxf.idfactura_facturas.idfactura
                  detalle.codigoprincipal = rxf.idrubro_rubros.idrubro
                  detalle.descripcion = rxf.idrubro_rubros.descripcion
                  detalle.cantidad = rxf.cantidad
                  detalle.preciounitario = rxf.valorunitario
                  detalle.descuento = 0
                  basImponible = detalle.cantidad * detalle.preciounitario; 
                  this.fec_facdetalleService.saveFacDetalle(detalle).subscribe({
                     next: (datos: any) => {
                        console.log(datos)
                        let iva = 0;
                        if (rxf.idrubro_rubros.swiva === true) {
                           if (codImpuesto = 2) {
                              iva = rxf.valorunitario * 0.12
                           }
                           if (codImpuesto = 4) {
                              iva = rxf.valorunitario * 0.15
                           }
                        } else {
                           codImpuesto = 0;
                        }
                        this.sumaTotal += rxf.valorunitario + iva;
                        let secuencialImpuestos: String = rxf.idrubroxfac.toString() + i
                        let detalleImpuesto = {} as Fec_factura_detalles_impuestos;
                        detalleImpuesto.idfacturadetalleimpuestos = +secuencialImpuestos!;
                        detalleImpuesto.idfacturadetalle = rxf.idrubroxfac;
                        detalleImpuesto.codigoimpuesto = "2";
                        detalleImpuesto.codigoporcentaje = codImpuesto.toString();
                        detalleImpuesto.baseimponible = basImponible;
                        this.fec_facdetimpService.saveFacDetalleImpuesto(detalleImpuesto).subscribe({
                           next: (detimpuesto) => {
                           }, error: (e) => console.error(e)
                        })
                        i++;
                     }, error: (e) => console.error(e)
                  });
               })
               setTimeout(() => {
                  this.pagos(resp, this.sumaTotal)
               }, 500)
            })
         },
         error: err => { console.error('Al guardar en Fec_factura: ', err.error) }
      })
   }

   claveAcceso() {
      this.claveacceso = '';
      let fecha = formatearFecha(1, this._facturas[0].fechacobro);   //1: Sin slash para la Clave de acceso
      let ruc = this.empresa.ruc;
      let ambiente = this.empresa.tipoambiente.toString();  //1: Pruebas  2: Producción
      let estab = this._facturas[0].nrofactura.slice(0, 3);
      let ptoemi = this._facturas[0].nrofactura.slice(4, 7);
      let serie = estab + ptoemi;
      let secuencial = this._facturas[0].nrofactura.slice(8, 17);
      let codigonumerico = codigoNumerico(this._facturas[0].nrofactura.slice(9, 17));
      let tipoemision = '1';  //1: Normal
      this.claveacceso = this.claveacceso + fecha + '01' + ruc + ambiente + serie + secuencial + codigonumerico + tipoemision;
      let verificador = modulo11(this.claveacceso);
      this.claveacceso = this.claveacceso + verificador	//Dígito Verificador (Módulo 11)
      // console.log('this.claveacceso: ', this.claveacceso)
   }

   pagos = ((resp: any, sumaTotal: number) => {
      console.log(this.tipocobro)
      let pagos = {} as Fec_factura_pagos;
      switch (this.tipocobro.toString()) {
         case '1':
            console.log('efectivo', this.tipocobro)
            pagos.formapago = '01';
            break;
         case '3':
            console.log('notacredoto', this.tipocobro)
            pagos.formapago = '01';
            break;
         case '4':
            console.log('transferencias', this.tipocobro)
            pagos.formapago = '20';
            break;
         case '5':
            console.log('tarjcredito', this.tipocobro)
            pagos.formapago = '19';
            break;
         case '6':
            console.log('recaudacion externa', this.tipocobro)
            pagos.formapago = '01';
            break;
         case '7':
            console.log('cheques', this.tipocobro)
            pagos.formapago = '20';
            break;
      }
      let secuencialPagos: String = resp.idfactura.toString() + 0; //cambiar el 0 por un valor autoincrementable cuando sea mas de una factura
      pagos.idfacturapagos = +secuencialPagos!
      pagos.idfactura = resp.idfactura;
      pagos.total = sumaTotal;
      pagos.plazo = 0;
      pagos.unidadtiempo = 'dias';
      this.fec_facPagosService.saveFacPago(pagos).subscribe({
         next: (datos) => {
            console.log(datos);
         }, error: (e) => console.error(e)
      })

   })
}

interface Fec_factura {
   idfactura: number;
   claveacceso: String;
   secuencial: String;
   xmlautorizado: String;
   errores: String;
   estado: String;
   establecimiento: String;
   puntoemision: String;
   direccionestablecimiento: String;
   fechaemision: Date;
   tipoidentificacioncomprador: String;
   guiaremision: String;
   razonsocialcomprador: String;
   identificacioncomprador: String;
   direccioncomprador: String;
   telefonocomprador: String;
   emailcomprador: String;
}
interface Fec_factura_detalles {
   idfacturadetalle: number;
   idfactura: number;
   codigoprincipal: String;
   descripcion: String;
   cantidad: number;
   preciounitario: number;
   descuento: number;
}
interface Fec_factura_detalles_impuestos {
   idfacturadetalleimpuestos: number;
   idfacturadetalle: number;
   codigoimpuesto: String;
   codigoporcentaje: String;
   baseimponible: number;
}
interface Fec_factura_pagos {
   idfacturapagos: number;
   idfactura: number;
   formapago: String;
   total: number;
   plazo: number;
   unidadtiempo: String;
}
function obtenerFechaActualString(fecha: Date) {
   const milisegundos = fecha.getTime(); // Obtener milisegundos desde la fecha
   const fechaActual = new Date(milisegundos);
   const anio = fechaActual.getFullYear();
   const mes = fechaActual.getMonth() + 1; // Los meses en JavaScript van de 0 a 11
   const dia = fechaActual.getDate();
   // Formatear la fecha a string con el formato deseado
   return `${anio}-${mes.toString().padStart(2, '0')}-${dia.toString().padStart(2, '0')}`;
}

//Transforma la fecha: opcion 1: para la clave de acceso sin slash opcion=2 para el XML con slash
function formatearFecha(opcion: number, fecha: string): string {
   const dia = fecha.slice(8, 11);
   const mes = fecha.slice(5, 7);
   const año = fecha.slice(0, 4);
   if (opcion == 1) return `${dia}${mes}${año}`;
   else return `${dia}/${mes}/${año}`;
}

//Código numérico de la Clave de acceso
function codigoNumerico(as_numero: string): string {
   let ls_rtn = "";
   for (let li_i = as_numero.length - 1; li_i >= 0; li_i--) {
      ls_rtn += as_numero.charAt(li_i);
   }
   return ls_rtn;
}

function modulo11(as_clave: string): string {
   //Clave al reves
   let ls_evalc = "";
   for (let li_i = 47; li_i >= 0; li_i--) {
      ls_evalc += as_clave.charAt(li_i);
   }

   //Multiplica cada caracter por (2,3,4,5,6,7) y acumula
   let ll_kont = 0;
   let ll_total = 0;
   const multiplicadores = [2, 3, 4, 5, 6, 7]; // Arreglo de multiplicadores
   for (let li_i = 0; li_i < ls_evalc.length; li_i++) {
      const ll_numero = parseInt(ls_evalc.charAt(li_i), 10);
      const ll_producto = ll_numero * multiplicadores[ll_kont]; // Aplica el multiplicador
      ll_total += ll_producto;
      ll_kont = (ll_kont + 1) % 6; // Actualiza el contador cíclico (0-5)
   }

   //Calcula el Residuo y el Dígito verificador
   let ll_residuo = ll_total % 11;
   let ll_rtn = 11 - ll_residuo;

   //Cambia 11 a 0 y 10 a 1
   let ls_rtn: string;
   switch (ll_rtn) {
      case 11:
         ls_rtn = "0";
         break;
      case 10:
         ls_rtn = "1";
         break;
      default:
         ls_rtn = ll_rtn.toString();
   }
   return ls_rtn;
}
