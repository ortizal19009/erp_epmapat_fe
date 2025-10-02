import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { AsientosService } from 'src/app/servicios/contabilidad/asientos.service';
import { CuentasService } from 'src/app/servicios/contabilidad/cuentas.service';
import { EjecucionService } from 'src/app/servicios/contabilidad/ejecucio.service';
import { ReformasService } from 'src/app/servicios/contabilidad/reformas.service';

@Component({
   selector: 'app-aux-ingreso',
   templateUrl: './aux-ingreso.component.html',
   styleUrls: ['./aux-ingreso.component.css']
})

export class AuxIngresoComponent implements OnInit {

   _ejecucion: any;
   _presupue: any;
   opcion: number = 1;
   filtro: string;
   formBuscar: FormGroup;
   formTransa: FormGroup;
   disabled = false;
   swvalido = 1;
   totalModfi: number = 0;
   idtransa = 0;
   elimdisabled = false;
   date: Date = new Date();
   today: number = Date.now();
   
   dFecha: Date;
   numreg = 0;
   totalRefo: number;
   totalDeve: number;
   totalCobp: number;
   codpar: String;
   nombre: String;
   saldo_ini = 0;
   _cuentas: any;
   cta_cla: String;
   nom_cla: String;
   codifica: number = 0;
   sal_deve: number = 0;
   sal_cob: number = 0;

   opcrep: String;
   archExportar: string;

   constructor(public fb: FormBuilder, private router: Router,
      private ejecuService: EjecucionService, private reformaService: ReformasService,
      private asientoService: AsientosService, private cuentaService: CuentasService) { }

   ngOnInit(): void {
      sessionStorage.setItem('ventana', '/preingresos');
      let coloresJSON = sessionStorage.getItem('/preingresos');
      if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));

      let paringToAuxiliar:any = JSON.parse(sessionStorage.getItem("paringToAuxiliar")!);
      // sessionStorage.removeItem("paringToAuxiliar");
      this.codpar = paringToAuxiliar.codpar;

      this.formBuscar = this.fb.group({
         codpar: paringToAuxiliar.codpar,
         nompar: paringToAuxiliar.nompar,
         partida: paringToAuxiliar.codpar + '  ' + paringToAuxiliar.nompar,
         desdeFecha: '',
         hastaFecha: ''
      });

      //Fechas guardadas o Actuales
      let fechasAuxingre = { desde: String, hasta: String };
      fechasAuxingre = JSON.parse(sessionStorage.getItem("fechasAuxingre")!);
      if ( fechasAuxingre != null) {
         this.formBuscar.patchValue({
            desdeFecha: fechasAuxingre.desde,
            hastaFecha: fechasAuxingre.hasta
         });
      }
      else {   //Actuales
         let desde: string; let hasta: string;
         const fechaActual = new Date();
         hasta = fechaActual.toISOString().slice(0, 10);
         let fechaRestada: Date = new Date();
         fechaRestada.setMonth(fechaActual.getMonth() - 1);
         desde = fechaRestada.toISOString().slice(0, 10);
         this.formBuscar.patchValue({
            desdeFecha: desde,
            hastaFecha: hasta
         });
      }
      this.buscaxopcion();
   }

   colocaColor(colores: any) {
      document.documentElement.style.setProperty('--bgcolor1', colores[0]);
      const cabecera = document.querySelector('.cabecera');
      if (cabecera) cabecera.classList.add('nuevoBG1')
      document.documentElement.style.setProperty('--bgcolor2', colores[1]);
      const detalle = document.querySelector('.detalle');
      if (detalle) detalle.classList.add('nuevoBG2');
   }

   opciones(opcion: number) {
      this.opcion = opcion;
      this.buscaxopcion()
   }

   buscaxopcion() {
      let nompar = sessionStorage.getItem("nomparToAuxiliar")!;
      let inicia: number = +sessionStorage.getItem("iniciaToAuxiliar")!;
      this.nombre = nompar;
      this.saldo_ini = inicia;
      switch (this.opcion) {
         case 1:
            this.totalRefo = 0;
            this.opcrep = "Auxiliar Presupuestario Ingreso";
            this.archExportar = 'Aux_Ingresos'
            //Guarda las fechas de búsqueda
            sessionStorage.setItem("fechasAuxingre", JSON.stringify( {  desde: this.formBuscar.value.desdeFecha, hasta: this.formBuscar.value.hastaFecha } ));
            this.buscaEjecu();
            break;
         case 2:
            this.opcrep = "Cuentas Asociadas";
            this.archExportar = 'Aux_CtasAsociadas'
            this.buscaCueasocia();
            break;
         case 3:
            this.opcrep = "Datos de la Partida";
            this.archExportar = 'Aux_DatosPartida'
            this.buscaEjecu();
            break;
         default:
            this.regresar()
            break;
      };
   }

   regresar() { this.router.navigate(['/preingresos']); }

   buscaEjecu() {
      this.ejecuService.getCodparFecha(this.codpar, this.formBuscar.value.desdeFecha, this.formBuscar.value.hastaFecha).subscribe({
         next: datos => {
            this._ejecucion = datos;
            this.numreg = 0; this.totalRefo = 0; this.totalDeve = 0; this.totalCobp = 0;
            this._ejecucion.forEach((ejecu: { tipeje: number; devengado: number; cobpagado: number; modifi: number }) => {
               this.numreg = ++this.numreg;
               this.totalRefo = this.totalRefo + ejecu.modifi;
               this.totalDeve = this.totalDeve + ejecu.devengado;
               this.totalCobp = this.totalCobp + ejecu.cobpagado;
               if (ejecu.tipeje == 3 || ejecu.tipeje == 4) {
                  this.buscar_asiento(ejecu);
               } else {
                  if (ejecu.tipeje == 2) {
                     this.buscar_reforma(ejecu);
                  }
               };
            });
         },
         error: err => console.error(err.error)
      });
   }

   buscaCueasocia() {
      this.cuentaService.getByAsoHaber(this.codpar).subscribe({
         next: datos => this._cuentas = datos,
         error: err => console.error(err.error)
      });
   }

   buscar_asiento(ejecucion: any) {
      let tc: String; // Tipo de comprobante
      this.asientoService.getById(ejecucion.idasiento).subscribe({
         next: resp => {
            ejecucion.asiento = resp.asiento;
            switch (resp.tipcom) {
               case 1: tc = 'I'; break;
               case 2: tc = 'E'; break;
               case 3: tc = 'DC'; break;
               case 4: tc = 'DI'; break;
               case 5: tc = 'DE'; break;
               default: tc = ''; break;
            };
            ejecucion.compro = tc + "-" + resp.compro;
         },
         error: err => console.error(err.error)
      });
      ejecucion.codificado = ejecucion.intpre.inicia;
      ejecucion.saldo_devengado = ejecucion.codificado - this.totalDeve;
      ejecucion.saldo_cobpagado = ejecucion.codificado - this.totalCobp;
   }

   buscar_reforma(ejecucion: any) {
      ejecucion.codificado = ejecucion.intpre.inicia + ejecucion.modifi;
      ejecucion.saldo_devengado = ejecucion.codificado - this.totalDeve;
      ejecucion.saldo_cobpagado = ejecucion.codificado - this.totalCobp;
      this.reformaService.getById(ejecucion.idrefo).subscribe({
         next: resp => ejecucion.compro = "RE" + "-" + resp.numero,
         error: err => console.error(err.error)
      })
   }

   imprimir() {
      let codpar = this.formBuscar.value.codpar;
      let nompar = this.formBuscar.value.nompar;
      let desde = this.formBuscar.value.desdeFecha;
      let hasta = this.formBuscar.value.hastaFecha;
      const paring = { codpar, nompar, desde, hasta }
      const paringJSON = JSON.stringify(paring);
      sessionStorage.setItem('paringToImpExp', paringJSON);
      this.router.navigate(['/imp-auxingreso']);
   }

}
