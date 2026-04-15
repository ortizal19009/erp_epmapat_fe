import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { AutorizaService } from '@compartida/autoriza.service';
import { Certipresu } from '@modelos/contabilidad/certipresu.model';
import { Ejecucio } from '@modelos/contabilidad/ejecucio.model';
import { Partixcerti } from '@modelos/contabilidad/partixcerti.model';
import { Presupue } from '@modelos/contabilidad/presupue.model';
import { CertipresuService } from '@servicios/contabilidad/certipresu.service';
import { PartixcertiService } from '@servicios/contabilidad/partixcerti.service';
import { PresupueService } from '@servicios/contabilidad/presupue.service';
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
   partida: Presupue;
   opcion: number = 1;
   ejecucion: any;
   numreg = 0; acumRefo = 0;
   acumPrmiso = 0; acumDevenga = 0; acumPagado = 0;
   salPrmiso = 0; salDevengado = 0; salPagado = 0;
   swbusca: boolean = false;
   hover: boolean = false;
   partixcerti: Partixcerti[] = [];
   partixcertiConCalculos: PartixcertiConCalculos[] = [];
   totalValor: number;
   totalPrmisos: number;

   constructor(private router: Router, public fb: FormBuilder, private ejecuService: EjecucionService, private presuService: PresupueService,
      private tramiService: TramipresuService, private asieService: AsientosService, private refoService: ReformasService,
      private authService: AutorizaService, private parxcerService: PartixcertiService, private certiService: CertipresuService) { }

   ngOnInit(): void {
      if (!this.authService.sessionlog) { this.router.navigate(['/inicio']); }
      sessionStorage.setItem('ventana', '/pregastos');
      let coloresJSON = sessionStorage.getItem('/pregastos');
      if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));

      const datosToAuxGasto = JSON.parse(sessionStorage.getItem("datosToAuxGasto")!);
      const intpre = datosToAuxGasto.intpre

      this.formBuscar = this.fb.group({
         codpar: '',
         nompar: '',
         desdeFecha: '',
         hastaFecha: '',
      });

      const fechasAuxGasto = JSON.parse(sessionStorage.getItem("fechasAuxGasto")!);
      if (fechasAuxGasto == null) {
         this.ultimaEjecucion();
      } else {
         this.opcion = fechasAuxGasto.opcion;
         this.formBuscar.patchValue({
            desdeFecha: fechasAuxGasto.desdeFecha,
            hastaFecha: fechasAuxGasto.hastaFecha,
         });
      }
      this.buscaPartida(intpre);
   }

   colocaColor(colores: any) {
      document.documentElement.style.setProperty('--bgcolor1', colores[0]);
      const cabecera = document.querySelector('.cabecera');
      if (cabecera) cabecera.classList.add('nuevoBG1')
      document.documentElement.style.setProperty('--bgcolor2', colores[1]);
      const detalle = document.querySelector('.detalle');
      if (detalle) detalle.classList.add('nuevoBG2');
   }

   ultimaEjecucion() {
      this.ejecuService.ultimaFecha().subscribe({
         next: (fecha: String | null) => {
            let desdeFecha: String;
            let hastaFecha: String;
            if (fecha == null) {
               const año = this.authService.getDatosEmpresa()!.fechap.toString().slice(0, 4)
               desdeFecha = año + '-01-01'
               hastaFecha = año + '-01-31'
            }
            else {
               desdeFecha = fecha.toString().slice(0, 8) + '01';
               hastaFecha = fecha;
            }
            this.formBuscar.patchValue({
               desdeFecha: desdeFecha,
               hastaFecha: hastaFecha,
            });
         },
         error: err => { console.error(err.error); this.authService.mostrarError('Error al buscar la última Ejecución', err.error) }
      });
   }

   buscaPartida(intpre: number) {
      this.presuService.getById(intpre).subscribe({
         next: (partida: Presupue) => {
            this.partida = partida;
            this.formBuscar.patchValue({
               codpar: partida.codpar,
               nompar: partida.nompar,
            });
            this.buscaxopcion();
         },
         error: err => { console.error(err.error); this.authService.mostrarError('Error al buscar la Partida', err.error) }
      })
   }

   opciones(opcion: number) {
      this.opcion = opcion;
      this.buscaxopcion()
   }

   buscaxopcion() {
      sessionStorage.setItem("fechasAuxGasto", JSON.stringify({opcion: this.opcion, desdeFecha: this.formBuscar.value.desdeFecha, hastaFecha: this.formBuscar.value.hastaFecha }));
      switch (this.opcion) {
         case 1:
            this.buscaEjecu();
            break;
         case 2:
            this.buscaCertificaciones();
            break;
         default:
            // this.regresar()
            // break;
      };
   }

   buscaEjecu() {
      if (this.formBuscar) {
         this.swbusca = true;
         const desde = this.formBuscar.value.desdeFecha;
         const hasta = this.formBuscar.value.hastaFecha;
         this.ejecuService.getCodparFecha(this.partida.codpar, desde, hasta).subscribe({
            next: (ejecucio: Ejecucio[]) => {
               this.ejecucion = ejecucio;
               this.numreg = 0; this.acumRefo = 0; this.acumPrmiso = 0; this.acumDevenga = 0; this.acumPagado = 0;
               let i = 0;
               this.ejecucion.forEach((objEjecu: { compro: String }) => {
                  this.numreg++
                  this.acumRefo = this.acumRefo + this.ejecucion[i].modifi;
                  this.acumPrmiso = this.acumPrmiso + this.ejecucion[i].prmiso;
                  this.acumDevenga = this.acumDevenga + this.ejecucion[i].devengado;
                  this.acumPagado = this.acumPagado + this.ejecucion[i].cobpagado;
                  this.ejecucion[i].codificado = this.ejecucion[i].intpre.inicia + this.acumRefo;
                  this.ejecucion[i].saldo_compromiso = this.ejecucion[i].codificado - this.acumPrmiso;
                  this.ejecucion[i].saldo_devengado = this.ejecucion[i].codificado - this.acumDevenga;
                  this.ejecucion[i].saldo_cobpagado = this.ejecucion[i].codificado - this.acumPagado;
                  if (this.ejecucion[i].tipeje == 3 || this.ejecucion[i].tipeje == 5) {
                     if (this.ejecucion[i].idtrami > 0) this.busca_tramite(objEjecu);
                     if (this.ejecucion[i].idasiento > 0) this.busca_asiento(objEjecu);
                  }
                  else { if (this.ejecucion[i].tipeje == 2) this.buscar_reforma(objEjecu) }
                  i++
               });
            },
            error: err => { console.error(err.error); this.authService.mostrarError('Error al buscar la Ejecución', err.error) }
         });
      }
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

   // Abre Trámite/Reforma o Asiento
   abreComprobante(ejecucion: any) {
      if (ejecucion.compro.slice(0, 2) == 'TR') {
         const datosToPrmisoxtrami = {
            idtrami: ejecucion.idtrami,
            desdeNum: 1,
            hastaNum: ejecucion.compro.slice(3, 99),
            padre: 'Ninguno'
         };
         sessionStorage.setItem('datosToPrmisoxtrami', JSON.stringify(datosToPrmisoxtrami));
         const url = `${window.location.origin}/prmisoxtrami`;
         window.open(url, '_blank');
         return
      }
      if (ejecucion.compro.slice(0, 1) == 'R') {
         this.authService.swal('warning', `No existe la Reforma Nro: ${ejecucion.compro.slice(2, 99)}`);
         return
      }
      let datosToTransaci = {
         idasiento: ejecucion.idasiento,
         desdeNum: 2,
         hastaNum: ejecucion.asiento,
         padre: 'Ninguno'
      };
      sessionStorage.setItem('datosToTransaci', JSON.stringify(datosToTransaci));
      const url = `${window.location.origin}/transaci`;
      window.open(url, '_blank');
   }

   // Certificaciones de la Partida
   buscaCertificaciones() {
      this.parxcerService.buscarPorIntpre(this.partida.intpre, this.formBuscar.value.desdeFecha, this.formBuscar.value.hastaFecha).subscribe({
         next: (partixcerti: Partixcerti[]) => {
            this.partixcerti = partixcerti;
            let acumulado = 0;
            let codificado = this.partida.inicia;
            this.partixcertiConCalculos = this.partixcerti.map(p => {
               acumulado += p.valor;
               codificado -= p.valor;
               return {
                  ...p,
                  acumulado,
                  restante: codificado
               };
            });
            this.totalCertificaciones();
         },
         error: err => { console.error(err.error); this.authService.mostrarError('Error al buscar las Certificaciones', err.error) }
      });
   }

   totalCertificaciones(): void {
      this.totalValor = 0;
      this.totalPrmisos = 0;
      this.partixcertiConCalculos.forEach((p: PartixcertiConCalculos) => {
         this.totalValor += p.valor ?? 0;
         this.totalPrmisos += p.totprmisos ?? 0;
      });
   }

   abrirCertipresu(partixcerti: PartixcertiConCalculos) {
      this.certiService.ultima(1).subscribe({
         next: (resp: Certipresu) => {
            const datosToPartixcerti = {
               idcerti: partixcerti.idcerti.idcerti,
               desdeNum: 1,
               hastaNum: resp.numero,
               padre: 'Ninguno'
            };
            sessionStorage.setItem('datosToPartixcerti', JSON.stringify(datosToPartixcerti));
            const url = `${window.location.origin}/partixcerti`;
            window.open(url, '_blank');
         },
         error: err => { console.error(err.error); this.authService.mostrarError('Error al buscar la última Certificación', err.error) }
      });
   }

   imprimir() {
      let codpar = this.formBuscar.value.codpar;
      let nompar = this.formBuscar.value.nompar;
      let desde = this.formBuscar.value.desdeFecha;
      let hasta = this.formBuscar.value.hastaFecha;
      let inicia = this.partida.inicia;
      const pargas = { codpar, nompar, inicia, desde, hasta }
      const pargasJSON = JSON.stringify(pargas);
      sessionStorage.setItem('pargasToImpExp', pargasJSON);
      this.router.navigate(['/imp-auxgasto']);
   }

   regresar() { this.router.navigate(['/pregastos']); }
   cerrar() { this.router.navigate(['/inicio']); }

}

interface PartixcertiConCalculos extends Partixcerti {
   acumulado: number;
   restante: number;
}