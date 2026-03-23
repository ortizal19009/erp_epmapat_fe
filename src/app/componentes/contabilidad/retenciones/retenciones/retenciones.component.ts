import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { ColoresService } from 'src/app/compartida/colores.service';
import { DefinirService } from 'src/app/servicios/administracion/definir.service';
import { AirxreteService } from 'src/app/servicios/contabilidad/airxrete.service';
import { FecReteimpuService } from 'src/app/servicios/contabilidad/fec-reteimpu.service';
import { FecRetencionesService } from 'src/app/servicios/contabilidad/fec-retenciones.service';
import { RetencionesService } from 'src/app/servicios/contabilidad/retenciones.service';
import { FecfacturaService } from 'src/app/servicios/fecfactura.service';

@Component({
   selector: 'app-retenciones',
   templateUrl: './retenciones.component.html',
   styleUrls: ['./retenciones.component.css']
})

export class RetencionesComponent implements OnInit {

   empresa: any;
   _retenciones: any;
   buscaRetenciones: { desdeSecu: string, hastaSecu: string, desdeFecha: string, hastaFecha: string }
   formBuscar: FormGroup;
   today: number = Date.now();
   date: Date = new Date();
   swdesdehasta: boolean; //Visibilidad Buscar últimos
   filtro: string;
   sumtotal: number = 0;
   seleccionados: number;
   secretencion1: string;
   claveacceso: string;
   swbotones: boolean = true;
   swenviando: boolean;
   txtenviar: string = 'Aceptar';

   constructor(private fb: FormBuilder, private router: Router, public authService: AutorizaService,
      private coloresService: ColoresService, private reteService: RetencionesService, private fecfacService: FecfacturaService,
      private defService: DefinirService, private fec_reteService: FecRetencionesService, private fec_reteimpuService: FecReteimpuService,
      private airxreteService: AirxreteService) { }

   ngOnInit(): void {
      sessionStorage.setItem('ventana', '/retenciones');
      let coloresJSON = sessionStorage.getItem('/retenciones');
      if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));
      else this.buscaColor();

      const fecha = new Date();
      const año = fecha.getFullYear()
      this.formBuscar = this.fb.group({
         desdeSecu: '',
         hastaSecu: '',
         desdeFecha: año + '-01-01',
         hastaFecha: año + '-12-31',
      });

      //Datos de búsqueda última Retención o guardadas
      this.buscaRetenciones = JSON.parse(sessionStorage.getItem("buscaRetenciones")!);
      if (this.buscaRetenciones == null) {
         this.ultimaRetencion();
      } else {
         this.formBuscar.patchValue({
            desdeSecu: this.buscaRetenciones.desdeSecu,
            hastaSecu: this.buscaRetenciones.hastaSecu,
            desdeFecha: this.buscaRetenciones.desdeFecha,
            hastaFecha: this.buscaRetenciones.hastaFecha
         });
         this.buscar();
      }
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
         const datos = await this.coloresService.setcolor(this.authService.idusuario, 'retenciones');
         const coloresJSON = JSON.stringify(datos);
         sessionStorage.setItem('/retenciones', coloresJSON);
         this.colocaColor(datos);
      } catch (error) { console.error(error); }
   }

   ultimaRetencion() {
      this.reteService.ultimo().subscribe({
         next: resp => {
            let desde = +resp.secretencion1 - 16;
            if (desde <= 0) desde = 1;
            this.formBuscar.patchValue({
               desdeSecu: desde.toString(),
               hastaSecu: resp.secretencion1.toString(),
            });
            this.buscar();
         },
         error: err => console.error(err.error)
      });
   }

   buscar() {
      //Secuencial
      let desdeSecu: string = '1';
      if (this.formBuscar.value.desdeSecu != null) { desdeSecu = this.formBuscar.value.desdeSecu; }
      let hastaSecu: string = '999999999';
      if (this.formBuscar.value.hastaSecu != null) { hastaSecu = this.formBuscar.value.hastaSecu; }
      //Busca Retenciones
      this.reteService.getDesdeHasta(this.formBuscar.value.desdeSecu, this.formBuscar.value.hastaSecu,
         this.formBuscar.value.desdeFecha, this.formBuscar.value.hastaFecha).subscribe({
            next: datos => {
               //Guarda los datos de búsqueda
               this.buscaRetenciones = {
                  desdeSecu: this.formBuscar.value.desdeSecu,
                  hastaSecu: this.formBuscar.value.hastaSecu,
                  desdeFecha: this.formBuscar.value.desdeFecha,
                  hastaFecha: this.formBuscar.value.hastaFecha
               };
               sessionStorage.setItem("buscaRetenciones", JSON.stringify(this.buscaRetenciones));

               this._retenciones = datos;
               this.total();
            },
            error: err => console.error(err.error)
         });
   }

   total() {
      let suma: number = 0;
      this.seleccionados = 0;
      this._retenciones.forEach((rete: any) => {
         suma = suma + rete.valorretbienes + rete.valorretservicios + rete.valretserv100 + rete.valretair;
         if (rete.escoge == 1) {
            this.seleccionados = this.seleccionados + 1;
            this.secretencion1 = rete.secretencion1;
         }
      });
      this.sumtotal = suma;
   }

   listainicial() {
      sessionStorage.removeItem('buscaRetenciones');
      this.swdesdehasta = false;
      this.ultimaRetencion();
   }

   changeDesdeHasta() { this.swdesdehasta = true; }

   changeEscoge(i: number) {
      // this.secretencion1 = this._retenciones[i].secretencion1;
      this.total();
   }

   async datosDefinirAsync() {
      try {
         const def = await this.defService.getByIddefinirAsync(1);
         this.empresa = def;
      } catch (error) {
         console.error('Al recuperar los datos de la Empresa', error);
      }
   }

   async enviar() {
      this.swenviando = true;
      this.txtenviar = 'Enviando';
      this.swbotones = false;
      await this.datosDefinirAsync();
      // console.log('Despues de datosDefinirAsync');
      for (let i = 0; i < this._retenciones.length; i++) {
         // console.log('I:', i);
         if (this._retenciones[i].escoge == 1) {
            // console.log('rete.escoge: ', this._retenciones[i].escoge);
            // let rete = this._retenciones[i];
            let fec_retencion = {} as Fec_retencion;
            fec_retencion.idretencion = this._retenciones[i].idrete;
            this.claveAcceso(i);
            fec_retencion.claveacceso = this.claveacceso;
            fec_retencion.secuencial = padStart(this._retenciones[i].secretencion1, 9)
            fec_retencion.estado = 'I';
            fec_retencion.establecimiento = '001';
            fec_retencion.puntoemision = '001';
            fec_retencion.direccionestablecimiento = this.empresa.direccion;
            fec_retencion.fechaemision = this._retenciones[i].fechaemiret1;
            fec_retencion.tipoidentificacionsujetoretenid = this._retenciones[i].idbene.tpidben;
            fec_retencion.razonsocialsujetoretenido = this._retenciones[i].idbene.nomben;
            fec_retencion.identificacionsujetoretenido = this._retenciones[i].idbene.rucben;
            fec_retencion.periodofiscal = this._retenciones[i].fechaemiret1.slice(5, 7) + "/" + this._retenciones[i].fechaemiret1.slice(0, 4);
            fec_retencion.telefonosujetoretenido = this._retenciones[i].idbene.tlfben;
            fec_retencion.emailsujetoretenido = this._retenciones[i].idbene.mailben;
            this.fec_reteService.saveAsync(fec_retencion)
            // console.log('Guarda Retención Ok!');
            await this.AIR(this._retenciones[i]);
            if (this._retenciones[i].valorretbienes != 0) { await this.IVA(this._retenciones[i], '1', this._retenciones[i].valorretbienes); }
            if (this._retenciones[i].valorretservicios != 0) { await this.IVA(this._retenciones[i], '2', this._retenciones[i].valorretservicios); }
            if (this._retenciones[i].valretserv100 != 0) { await this.IVA(this._retenciones[i], '3', this._retenciones[i].valretserv100); }
         }
      }
      this.swenviando = false;
      this.txtenviar = 'Continuar';
   }

   //Recupera los AIR de la retencion y los guarda en fec_reteimpu
   async AIR(retencion: any) {
      try {
         const air = await this.airxreteService.getByIdreteAsync(retencion.idrete);
         air.forEach(async (impuesto, index) => {
            let fec_reteimpu = {} as Fec_reteimpu;
            fec_reteimpu.idretencionesimpuestos = +(retencion.idrete.toString() + index.toString());
            fec_reteimpu.idretencion = retencion.idrete;
            fec_reteimpu.codigo = '1'; //1=RENTA: TABLA 19 de la Ficha Técnica de comprobantes electrónicos 
            fec_reteimpu.codigoporcentaje = impuesto.idtabla10.codretair;   //
            fec_reteimpu.baseimponible = impuesto.baseimpair;
            fec_reteimpu.codigodocumentosustento = '01'; //Factura
            fec_reteimpu.numerodocumentosustento = retencion.numserie + padStart(retencion.numdoc, 9);
            fec_reteimpu.fechaemisiondocumentosustento = retencion.fechaemision;
            try {
               this.fec_reteimpuService.saveAsync(fec_reteimpu);
               // console.log(retencion, 'AIR Ok!')
            }
            catch (error) { console.error('Al guardar AIR en fec_reteimpu: ', error) }
         });
      } catch (error) { console.error('Al recuperar los AIR', error) }
   }

   //IVA (Bienes, Servicios y/o 100%)
   async IVA(retencion: any, codigoporcentaje: string, monto: number) {
      let fec_reteimpu = {} as Fec_reteimpu;
      fec_reteimpu.idretencionesimpuestos = +(retencion.idrete.toString() + '0' + codigoporcentaje);  //Id de fec_retenciones_impuesto: idrete+0(1,2 o 3)
      fec_reteimpu.idretencion = retencion.idrete;
      fec_reteimpu.codigo = '2'; // 2=IVA: TABLA 19 de la Ficha Técnica de comprobantes electrónicos 
      fec_reteimpu.codigoporcentaje = codigoporcentaje;   //1:Bienes, 2:Servicios, 3:100%
      fec_reteimpu.baseimponible = monto;
      fec_reteimpu.codigodocumentosustento = '01'; //Factura
      fec_reteimpu.numerodocumentosustento = retencion.numserie + padStart(retencion.numdoc, 9);
      fec_reteimpu.fechaemisiondocumentosustento = retencion.fechaemision;
      try {
         this.fec_reteimpuService.saveAsync(fec_reteimpu);
         // console.log(retencion, 'IVA Ok!')
      }
      catch (error) { console.error('Al guardar la retención del IVA en fec_reteimpu: ', error) }
   }

   continuar() {
      // event.preventDefault();
      // e.stopPropagation();
      this.swbotones = true;
   }

   claveAcceso(i: number) {
      this.claveacceso = '';
      let fecha = formatearFecha(1, this._retenciones[i].fechaemiret1);   //1: Sin slash para la Clave de acceso
      let ruc = this.empresa.ruc;
      let ambiente = this.empresa.tipoambiente.toString();  //1: Pruebas  2: Producción
      let serie = '001001'
      let secuencial = padStart(this._retenciones[i].secretencion1, 9)
      let codigonumerico = codigoNumerico(secuencial.slice(1, 9));
      let tipoemision = '1';  //1: Normal
      this.claveacceso = this.claveacceso + fecha + '07' + ruc + ambiente + serie + secuencial + codigonumerico + tipoemision;
      let verificador = modulo11(this.claveacceso);
      this.claveacceso = this.claveacceso + verificador	//Dígito Verificador (Módulo 11)
   }

   imprimir() {
      sessionStorage.setItem("retencionesToImpExp", JSON.stringify(this.buscaRetenciones));
      this.router.navigate(['/imp-retenciones']);
   }

}

interface Fec_retencion {
   idretencion: number;
   claveacceso: String;
   secuencial: String;
   xmlautorizado: String;
   errores: String;
   estado: String;
   establecimiento: String;
   puntoemision: String;
   direccionestablecimiento: String;
   fechaemision: Date;
   tipoidentificacionsujetoretenid: String;
   razonsocialsujetoretenido: String;
   identificacionsujetoretenido: String;
   periodofiscal: String;
   telefonosujetoretenido: String;
   emailsujetoretenido: String;
}

interface Fec_reteimpu {
   idretencionesimpuestos: number;
   idretencion: number;
   codigo: string;
   codigoporcentaje: string;
   baseimponible: number;
   codigodocumentosustento: string;
   numerodocumentosustento: string;
   fechaemisiondocumentosustento: Date;
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

function padStart(value: string, targetLength: number): string {
   const padding = "0".repeat(targetLength - value.length);
   return padding + value;
}

function formatDate(date: Date): string {
   const month = date.getMonth() + 1; // Months are zero-indexed
   const year = date.getFullYear();

   const formattedMonth = month < 10 ? `0${month}` : `${month}`;
   const formattedYear = `${year}`;

   return `${formattedMonth}/${formattedYear}`;
}