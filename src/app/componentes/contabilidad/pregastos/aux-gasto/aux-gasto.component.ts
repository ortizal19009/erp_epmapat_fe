import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { catchError, firstValueFrom, map, Observable, throwError } from 'rxjs';
import { AsientosService } from 'src/app/servicios/contabilidad/asientos.service';
import { EjecucionService } from 'src/app/servicios/contabilidad/ejecucio.service';
import { ReformasService } from 'src/app/servicios/contabilidad/reformas.service';
import { TramipresuService } from 'src/app/servicios/contabilidad/tramipresu.service';

@Component({
   selector: 'app-aux-gasto',
   templateUrl: './aux-gasto.component.html',
   styleUrls: ['./aux-gasto.component.css']
})
export class AuxGastoComponent implements OnInit {

   formBuscar: FormGroup;
   opcion: number = 1;
   codpar: string;
   inicia: number;
   date: Date = new Date();
   today: number = Date.now();
   _ejecucion: any;
   numreg = 0; acumRefo = 0;
   acumPrmiso = 0; acumDevenga = 0; acumPagado = 0;
   salPrmiso = 0; salDevengado = 0; salPagado = 0;

   constructor(private router: Router, public fb: FormBuilder, private ejecuService: EjecucionService,
      private tramiService: TramipresuService, private asieService: AsientosService, private refoService: ReformasService) { }

   ngOnInit(): void {
      sessionStorage.setItem('ventana', '/pregastos');
      let coloresJSON = sessionStorage.getItem('/pregastos');
      if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));

      let pargasToAuxiliar = JSON.parse(sessionStorage.getItem("pargasToAuxiliar")!);
      this.codpar = pargasToAuxiliar.codpar;
      this.inicia = pargasToAuxiliar.inicia;

      const fecha = new Date();
      const año = fecha.getFullYear()
      this.formBuscar = this.fb.group({
         codpar: pargasToAuxiliar.codpar,
         nompar: pargasToAuxiliar.nompar,
         desdeFecha: año + '-01-01',
         hastaFecha: año + '-01-31',
         tiprep: 0
      });
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
      // this.nombre = nompar;
      // this.saldo_ini = inicia;
      switch (this.opcion) {
         case 1:
            // this.totalRefo = 0;
            // this.opcrep = "Auxiliar Presupuestario Gasto";
            // this.archExportar = 'Aux_Gasto'
            this.buscaEjecu();
            break;
         case 2:
            // 
            // this.buscaCueasocia();
            break;
         case 3:
            // this.buscaEjecu();
            break;
         default:
            this.regresar()
            break;
      };
   }

   regresar() { this.router.navigate(['/pregastos']); }

   buscaEjecu() {
      this.ejecuService.getCodparFecha(this.codpar, this.formBuscar.value.desdeFecha, this.formBuscar.value.hastaFecha).subscribe({
         next: datos => {
            this._ejecucion = datos;
            this.numreg = 0; this.acumRefo = 0; this.acumPrmiso = 0; this.acumDevenga = 0; this.acumPagado = 0;
            let i = 0;
            this._ejecucion.forEach((objEjecu: { compro: String }) => {
               this.numreg++
               this.acumRefo = this.acumRefo + this._ejecucion[i].modifi;
               this.acumPrmiso = this.acumPrmiso + this._ejecucion[i].prmiso;
               this.acumDevenga = this.acumDevenga + this._ejecucion[i].devengado;
               this.acumPagado = this.acumPagado + this._ejecucion[i].cobpagado;
               this._ejecucion[i].codificado = this._ejecucion[i].intpre.inicia + this.acumRefo;
               this._ejecucion[i].saldo_compromiso = this._ejecucion[i].codificado - this.acumPrmiso;
               this._ejecucion[i].saldo_devengado = this._ejecucion[i].codificado - this.acumDevenga;
               this._ejecucion[i].saldo_cobpagado = this._ejecucion[i].codificado - this.acumPagado;
               if (this._ejecucion[i].tipeje == 3 || this._ejecucion[i].tipeje == 5) {
                  if (this._ejecucion[i].idtrami > 0) this.busca_tramite(objEjecu);
                  if (this._ejecucion[i].idasiento > 0) this.busca_asiento(objEjecu);
               }
               else { if (this._ejecucion[i].tipeje == 2) this.buscar_reforma(objEjecu) }
               i++
            });
         },
         error: err => console.error(err.error)
      });
   }

   busca_tramite(objEjecu: any) {
      this.tramiService.findById(objEjecu.idtrami).subscribe({
         next: resp => objEjecu.compro = "TR-" + resp.numero,
         error: err => console.error('Al buscar el Trámite: ', err.error)
      })
   }

   busca_asiento(objEjecu: any) {
      let tc: String; // Tipo de comprobante
      this.asieService.getById(objEjecu.idasiento).subscribe({
         next: resp => {
            objEjecu.asiento = resp.asiento;
            switch (resp.tipcom) {
               case 1: tc = 'I'; break;
               case 2: tc = 'E'; break;
               case 3: tc = 'DC'; break;
               case 4: tc = 'DI'; break;
               case 5: tc = 'DE'; break;
               default: tc = ''; break;
            };
            objEjecu.compro = tc + "-" + resp.compro;
         },
         error: err => console.error('Al buscar el asiento: ', err.error)
      });
   }

   buscar_reforma(objEjecu: any) {
      this.refoService.getById(objEjecu.idrefo).subscribe({
         next: resp => objEjecu.compro = "RE" + "-" + resp.numero,
         error: err => console.error('Al buscar la Reforma: ', err.error)
      });
   }

   imprimir() {
      let codpar = this.formBuscar.value.codpar;
      let nompar = this.formBuscar.value.nompar;
      let desde = this.formBuscar.value.desdeFecha;
      let hasta = this.formBuscar.value.hastaFecha;
      let inicia = this.inicia;
      const pargas = { codpar, nompar, inicia, desde, hasta }
      const pargasJSON = JSON.stringify(pargas);
      sessionStorage.setItem('pargasToImpExp', pargasJSON);
      this.router.navigate(['/imp-auxgasto']);
   }

}
