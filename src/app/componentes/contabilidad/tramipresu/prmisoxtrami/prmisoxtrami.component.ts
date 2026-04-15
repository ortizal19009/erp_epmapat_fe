import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Eliminadosapp } from '@modelos/administracion/eliminadosapp.model';
import { Asientos } from '@modelos/contabilidad/asientos.model';
import { Ejecucio } from '@modelos/contabilidad/ejecucio.model';
import { Partixcerti } from '@modelos/contabilidad/partixcerti.model';
import { Tramipresu } from '@modelos/contabilidad/tramipresu.model';
import { EliminadosappService } from '@servicios/administracion/eliminadosapp.service';
import { AsientosService } from '@servicios/contabilidad/asientos.service';
import { of } from 'rxjs';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { EjecucioUpdateDTO, EjecucioVM } from 'src/app/dtos/contabilidad/ejecucio.dto';
import { CertipresuService } from 'src/app/servicios/contabilidad/certipresu.service';
import { EjecucionService } from 'src/app/servicios/contabilidad/ejecucio.service';
import { PartixcertiService } from 'src/app/servicios/contabilidad/partixcerti.service';
import { PresupueService } from 'src/app/servicios/contabilidad/presupue.service';
import { TramipresuService } from 'src/app/servicios/contabilidad/tramipresu.service';
import Swal from 'sweetalert2';

@Component({
   selector: 'app-prmisoxtrami',
   templateUrl: './prmisoxtrami.component.html',
   styleUrls: ['./prmisoxtrami.component.css']
})
export class PrmisoxtramiComponent implements OnInit {

   formModi: FormGroup;
   idtrami: number;
   iTramite = {} as interfaceTramite; //Interface para los datos del Trámite
   compromisos: EjecucioVM[] = [];
   sumCompromiso: number;
   sumDevengado: number;
   totales: number[] = [0, 0, 0, 0];
   partixcerti: PartixcertiVM[] = [];
   intpre: number | null;
   swmodificar: boolean;
   devengados: EjecucioVM[] = [];
   totDevengado: number = 0;
   swbusca: boolean = false;
   hover: boolean = false;
   padre: string;
   primera: number;
   navegador: number;
   ultima: number;
   datosToPrmisoxtrami: { idtrami: number; desdeNum: number; hastaNum: number; ultima: number; padre: string; };

   constructor(private router: Router, private fb: FormBuilder, private parxcerService: PartixcertiService,
      private tramiService: TramipresuService, private ejecuService: EjecucionService, private asiService: AsientosService,
      public authService: AutorizaService, private elimService: EliminadosappService) { }

   ngOnInit(): void {
      if (!this.authService.sessionlog) { this.router.navigate(['/inicio']); }
      sessionStorage.setItem('ventana', '/tramipresu');
      let coloresJSON = sessionStorage.getItem('/tramipresu');
      if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));

      const datosToPrmisoxtramiJSON = sessionStorage.getItem('datosToPrmisoxtrami');
      if (datosToPrmisoxtramiJSON) {
         this.datosToPrmisoxtrami = JSON.parse(datosToPrmisoxtramiJSON);
         this.idtrami = +this.datosToPrmisoxtrami.idtrami;
         this.primera = +this.datosToPrmisoxtrami.desdeNum;
         this.ultima = +this.datosToPrmisoxtrami.hastaNum;
         this.padre = this.datosToPrmisoxtrami.padre;
         
      }
      this.buscaTramite();
   }

   colocaColor(colores: any) {
      document.documentElement.style.setProperty('--bgcolor1', colores[0]);
      const cabecera = document.querySelector('.cabecera');
      if (cabecera) cabecera.classList.add('nuevoBG1')
      document.documentElement.style.setProperty('--bgcolor2', colores[1]);
      const detalle = document.querySelector('.detalle');
      if (detalle) detalle.classList.add('nuevoBG2');
   }

   buscaTramite() {
      this.tramiService.findById(this.idtrami).subscribe({
         next: (tramipresu: Tramipresu) => {
            this.iTramite.numero = tramipresu.numero;
            this.iTramite.fecha = tramipresu.fecha;
            this.iTramite.docu = tramipresu.intdoc.nomdoc + ' ' + tramipresu.numdoc
            this.iTramite.beneficiario = tramipresu.idbene.nomben
            this.iTramite.descri = tramipresu.descri;
            this.buscaCompromisos();
         },
         error: err => { console.error(err.error); this.authService.mostrarError('Error al buscar el Trámite', err.error) }
      });
   }

   buscaCompromisos() {
      this.ejecuService.getByIdtrami(this.idtrami).subscribe({
         next: (ejecucio: Ejecucio[]) => {
            this.swbusca = true;
            this.compromisos = ejecucio;
            this.calcTotales();
         },
         error: (e) => console.error(e),
      });
   }

   //Totales de los compromisos del trámite
   calcTotales() {
      this.sumCompromiso = 0; this.sumDevengado = 0;
      this.compromisos.forEach((compromisos: EjecucioVM) => {
         this.sumCompromiso = this.sumCompromiso + compromisos.prmiso;
         this.sumDevengado = this.sumDevengado + compromisos.totdeven;
         // Coloca partixcerti para mostrar certipresu.numero
         this.parxcerService.getById(compromisos.idparxcer).subscribe({
            next: (partixcerti: Partixcerti) => compromisos.partixcerti = partixcerti,
            error: err => console.error(err.error)
         });
      });
   }

   nuevo() {
      this.datosToPrmisoxtrami.idtrami = this.idtrami
      sessionStorage.setItem('datosToPrmisoxtrami', JSON.stringify(this.datosToPrmisoxtrami));

      sessionStorage.setItem('idtramiToAddPartixtramite', this.idtrami.toString());
      this.router.navigate(['/add-partixtramite']);
   }

   cancelar() { this.swmodificar = false }

   modificar(compromiso: EjecucioVM) {
      this.formModi = this.fb.group({
         inteje: compromiso.inteje,
         codpar: compromiso.intpre.codpar,
         nompar: compromiso.intpre.nompar,
         numcerti: compromiso.partixcerti?.idcerti.numero,
         valorcerti: compromiso.partixcerti?.valor,
         saldo: compromiso.partixcerti?.valor! - compromiso.partixcerti?.totprmisos!,
         prmisoOriginal: compromiso.prmiso,
         prmiso: [compromiso.prmiso, [Validators.required, Validators.min(0.01), this.valPrmiso()]],
         newsaldo: 0,
         concep: compromiso.concep
      });
      this.swmodificar = true;
      // if (this.formModi.get('saldo')?.value == 0) {this.formModi.get('prmiso')?.disable({ emitEvent: false })}
      if (compromiso.totdeven > 0) {this.formModi.get('prmiso')?.disable({ emitEvent: false })}
      this.formModi.get('prmiso')?.valueChanges.subscribe(prmisoNuevo => {
         const saldo = this.formModi.get('saldo')?.value;
         const prmisoOriginal = this.formModi.get('prmisoOriginal')?.value;
         const maxPermitido = saldo + prmisoOriginal;
         const newsaldo = maxPermitido - prmisoNuevo;
         this.formModi.get('newsaldo')?.setValue(newsaldo, { emitEvent: false });
      });
   }

   get f() { return this.formModi.controls; }

   actualiza() {
      const dto: EjecucioUpdateDTO = {};
      if (this.formModi.controls['prmiso'].dirty) { dto.prmiso = this.formModi.controls['prmiso'].value; }
      if (this.formModi.controls['concep'].dirty) { dto.concep = this.formModi.controls['concep'].value; }
      dto.usumodi = this.authService.idusuario;
      dto.fecmodi = new Date();
      this.ejecuService.updateEjecucio(this.formModi.controls['inteje'].value, dto).subscribe({
         next: (_ejecucio: Ejecucio) => {
            this.authService.swal('success', `Compromiso actualizado con éxito`);
            this.swmodificar = false;
            this.buscaCompromisos();
         },
         error: err => { console.error(err.error); this.authService.mostrarError('Error al actualizar Ejecucio', err.error) }
      });
   }

   // Devengados de un compromiso
   buscaDevengados(idprmiso: number) {
      this.ejecuService.obtenerPorIdprmiso(idprmiso).subscribe({
         next: (ejecucio: Ejecucio[]) => {
            this.devengados = ejecucio;
            // Calcula el total de devengado
            this.totDevengado = this.devengados.length > 1
               ? this.devengados.reduce((sum, e) => sum + (e.devengado || 0), 0)
               : (this.devengados[0]?.devengado || 0);
            // Carga los asientos
            this.devengados.forEach((e, index) => {
               if (e.idasiento) {
                  this.asiService.unAsiento(e.idasiento).subscribe(a => {
                     this.devengados[index].asiento = a;
                  });
               }
            });
         },
         error: (err) => { console.error(err); this.authService.mostrarError('Error al buscar los Devengados', err.error) }
      });
   }

   abrirCertipresu(compromiso: EjecucioVM) {
      const datosToPartixcerti = {
         idcerti: compromiso.partixcerti?.idcerti.idcerti,
         desdeNum: 1,
         hastaNum: compromiso.partixcerti?.idcerti.numero,
         padre: 'Ninguno'
      };
      sessionStorage.setItem('datosToPartixcerti', JSON.stringify(datosToPartixcerti));
      const url = `${window.location.origin}/partixcerti`;
      window.open(url, '_blank');
   }

   abrirAsiento(asiento: Asientos) {
      let datosToTransaci = {
         idasiento: asiento.idasiento,
         desdeNum: 2,
         hastaNum: asiento.asiento,
         padre: 'Ninguno'
      };
      sessionStorage.setItem('datosToTransaci', JSON.stringify(datosToTransaci));
      const url = `${window.location.origin}/transaci`;
      window.open(url, '_blank');
   }

   eliminar(ejecucio: Ejecucio) {
      this.ejecuService.contarPorIdprmiso(ejecucio.inteje).subscribe({
         next: registros => {
            if (registros > 0) {
               Swal.fire({
                  icon: 'error',
                  title: `No puede eliminar el Compromiso de la Partida: ${ejecucio.intpre.codpar}`,
                  text: `Tiene registrado ${registros} Devengado(s)`,
                  confirmButtonText: '<i class="bi-check"></i> Continuar ',
                  customClass: {
                     popup: 'noeliminar',
                     title: 'robotobig',
                     confirmButton: 'btn btn-warning',
                  },
               });
            } else {
               Swal.fire({
                  width: '500px',
                  title: 'Mensaje',
                  text: `Eliminar el Compromiso de la Partida: ${ejecucio.intpre.codpar} ?`,
                  icon: 'warning',
                  showCancelButton: true,
                  confirmButtonText: '<i class="fa fa-check"></i> Aceptar',
                  cancelButtonText: '<i class="fa fa-times"></i> Cancelar',
                  customClass: {
                     popup: 'eliminar',
                     title: 'robotobig',
                     confirmButton: 'btn btn-success',
                     cancelButton: 'btn btn-success'
                  },
               }).then((resultado) => {
                  if (resultado.isConfirmed) this.elimina(ejecucio);
               });
            }
         },
         error: err => { console.error('Al buscar las Partidas de la Certificación: ', err.error); },
      });
   }

   elimina(ejecucio: Ejecucio) {
      this.ejecuService.deleteEjecucion(ejecucio.inteje).subscribe({
         next: () => {
            let eliminado: Eliminadosapp = new Eliminadosapp();
            eliminado.idusuario = this.authService.idusuario!;
            eliminado.modulo = this.authService.moduActual;
            eliminado.fecha = new Date();
            eliminado.routerlink = 'prmisoxtrami';
            eliminado.tabla = 'EJECUCIO';
            eliminado.datos = `Compromiso de la Partida ${ejecucio.intpre.codpar} del Trámite Nro: ${this.iTramite.numero} del ${this.iTramite.fecha}`;
            this.elimService.save(eliminado).subscribe({
               next: () => {
                  this.authService.swal('success', `Compromiso de la Partida ${ejecucio.intpre.codpar} del Trámite Nro: ${this.iTramite.numero} eliminado con éxito`);
                  this.buscaCompromisos();
               },
               error: err => { console.error(err.error); this.authService.mostrarError('Error al guardar eliminado', err.error); }
            });
         },
         error: (err) => {
            if (err.status === 404) {
               this.authService.mensaje404(`La Partida ${ejecucio.intpre.codpar} del Trámite Nro: ${this.iTramite.numero} no existe o fue eliminada por otro Usuario`);
               this.buscaCompromisos();
            } else {
               this.authService.mostrarError('Error al eliminar la Partida de la Certificación', err.error);
            }
         }
      });
   }

   regresar() { this.router.navigate(['/tramipresu']); }
   cerrar() { this.router.navigate(['/inicio']); }

   actual() { this.navegador = this.iTramite.numero; }

   irPrimero() {
      this.navegador = this.primera;
      this.cargarRegistro(this.navegador);
   }

   irUltimo() {
      this.navegador = this.ultima;
      this.cargarRegistro(this.navegador);
   }

   retroceder() {
      if (this.navegador > 1) {
         this.navegador--;
         this.cargarRegistro(this.navegador);
      }
   }

   avanzar() {
      this.navegador++;
      this.cargarRegistro(this.navegador);
   }

   irA(n: number) {
      if (n > 0) {
         this.navegador = n;
         this.cargarRegistro(n);
      }
   }

   cargarRegistro(n: number) {
      this.tramiService.getByNumero(n).subscribe(tramite => {
         if (!tramite) {
            this.authService.swal('warning', `No existe el Trámite Nro: ${n}`);
            return;
         }
         this.idtrami = tramite.idtrami;
         this.navegador = tramite.numero;
         this.iTramite.numero = tramite.numero;
         this.iTramite.fecha = tramite.fecha;
         this.iTramite.docu = tramite.intdoc.nomdoc + ' ' + tramite.numdoc
         this.iTramite.descri = tramite.descri;
         this.buscaCompromisos();
      });
   }

   seleccionarTexto(event: FocusEvent): void {
      const input = event.target as HTMLInputElement;
      input.select();
   }

   //Valida el prmiso en Modificar
   valPrmiso(): ValidatorFn {
      return (control: AbstractControl): ValidationErrors | null => {
         if (!control.parent) return null;
         const saldo = control.parent.get('saldo')?.value;
         const prmisoNuevo = control.value;
         const prmisoOriginal = control.parent.get('prmisoOriginal')?.value;
         if (saldo == null || prmisoNuevo == null || prmisoOriginal == null) return null;
         const maxPermitido = saldo + prmisoOriginal;
         return prmisoNuevo > maxPermitido ? { prmisoMayorSaldo: true } : null;
      };
   }

}

interface interfaceTramite {
   numero: number;
   fecha: Date;
   docu: string;
   beneficiario: string;
   descri: String;
}

interface PartixcertiVM extends Partixcerti {
   compromiso?: number;
}