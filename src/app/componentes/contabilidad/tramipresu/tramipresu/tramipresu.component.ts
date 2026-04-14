import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Eliminadosapp } from '@modelos/administracion/eliminadosapp.model';
import { Clasificador } from '@modelos/clasificador.model';
import { Cuentas } from '@modelos/contabilidad/cuentas.model';
import { Estrfunc } from '@modelos/contabilidad/estrfunc.model';
import { Presupue } from '@modelos/contabilidad/presupue.model';
import { Tramipresu } from '@modelos/contabilidad/tramipresu.model';
import { EliminadosappService } from '@servicios/administracion/eliminadosapp.service';
import { ClasificadorService } from '@servicios/clasificador.service';
import { CuentasService } from '@servicios/contabilidad/cuentas.service';
import { EjecucionService } from '@servicios/contabilidad/ejecucio.service';
import { EstrfuncService } from '@servicios/contabilidad/estrfunc.service';
import { PregastoService } from '@servicios/contabilidad/pregasto.service';
import { map } from 'rxjs';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { ColoresService } from 'src/app/compartida/colores.service';
// import { Tramipresu } from 'src/app/modelos/contabilidad/tramipresu.model';
import { TramipresuService } from 'src/app/servicios/contabilidad/tramipresu.service';
import Swal from 'sweetalert2';

@Component({
   selector: 'app-tramipresu',
   templateUrl: './tramipresu.component.html',
   styleUrls: ['./tramipresu.component.css']
})
export class TramipresuComponent implements OnInit {

   formBuscar: FormGroup;
   filtro: string;
   tramipresu: Tramipresu[] = [];
   buscarTramipresu: { desdeNum: number, hastaNum: number, desdeFecha: string, hastaFecha: string }
   total: number;
   swdesdehasta: boolean; //Visibilidad Buscar últimos
   ultIdSelec: number = -1;

   constructor(private fb: FormBuilder, private router: Router, public authService: AutorizaService, private coloresService: ColoresService,
      private tramiService: TramipresuService, private ejecuService: EjecucionService, private elimService: EliminadosappService) { }

   ngOnInit(): void {
      if (!this.authService.sessionlog) { this.router.navigate(['/inicio']); }
      sessionStorage.setItem('ventana', '/tramipresu');
      let coloresJSON = sessionStorage.getItem('/tramipresu');
      if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));
      else this.buscaColor();

      const fecha = new Date();
      const año = fecha.getFullYear();
      this.formBuscar = this.fb.group({
         desdeNum: 0,
         hastaNum: 0,
         desdeFecha: año + '-01-01',
         hastaFecha: año + '-12-31',
      });

      //Datos de búsqueda: últimos Trámites o guardados
      this.ultIdSelec = sessionStorage.getItem('ultidtrami') ? Number(sessionStorage.getItem('ultidtrami')) : 0;
      this.buscarTramipresu = JSON.parse(sessionStorage.getItem("buscarTramipresu")!);
      if (this.buscarTramipresu == null) this.ultimoTramipresu();
      else {
         this.formBuscar.patchValue({
            desdeNum: this.buscarTramipresu.desdeNum,
            hastaNum: this.buscarTramipresu.hastaNum,
            desdeFecha: this.buscarTramipresu.desdeFecha,
            hastaFecha: this.buscarTramipresu.hastaFecha
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
         const datos = await this.coloresService.setcolor(this.authService.idusuario, 'tramipresu');
         const coloresJSON = JSON.stringify(datos);
         sessionStorage.setItem('/tramipresu', coloresJSON);
         this.colocaColor(datos);
      } catch (error) { console.error(error); }
   }

   ultimoTramipresu() {
      this.tramiService.ultimoTramipresu().subscribe({
         next: resp => {
            let desde = resp.numero - 16;
            if (desde <= 0) desde = 1;
            this.formBuscar.patchValue({
               desdeNum: desde,
               hastaNum: resp.numero,
            });
            this.buscar();
         },
         error: err => { console.error(err.error); this.authService.mostrarError('Error al buscar el último', err.error) }
      });
   }

   buscar() {
      let desdeNum: number = 1;
      if (this.formBuscar.value.desdeNum != null) { desdeNum = this.formBuscar.value.desdeNum; }
      let hastaNum: number = 999999999;
      if (this.formBuscar.value.hastaNum != null) { hastaNum = this.formBuscar.value.hastaNum; }
      this.tramiService.getDesdeHasta(desdeNum, hastaNum, this.formBuscar.value.desdeFecha, this.formBuscar.value.hastaFecha).subscribe({
         next: (tramites: Tramipresu[]) => {
            this.tramipresu = tramites;
            this.total = this.sumarTotmiso();
            this.buscarTramipresu = {  //Guarda los datos de búsqueda
               desdeNum: this.formBuscar.value.desdeNum,
               hastaNum: this.formBuscar.value.hastaNum,
               desdeFecha: this.formBuscar.value.desdeFecha,
               hastaFecha: this.formBuscar.value.hastaFecha
            };
            sessionStorage.setItem("buscarTramipresu", JSON.stringify(this.buscarTramipresu));
         },
         error: err => { console.error(err.error); this.authService.mostrarError('Error al buscar los Trámites', err.error) }
      });
   }

   sumarTotmiso(): number {
      return this.tramipresu.reduce((acum, item) => {
         const valor = Number(item.totmiso) || 0;
         return acum + valor;
      }, 0);
   }

   changeDesdeHasta() { this.swdesdehasta = true; }

   busquedainicial() {
      sessionStorage.removeItem('buscarTramipresu');
      this.swdesdehasta = false;
      this.ultimoTramipresu();
   }

   addTramite() { this.router.navigate(['add-tramipresu']); }

   compromisos(event: any, tramipresu: Tramipresu) {
      const tagName = event.target.tagName;
      this.ultIdSelec = tramipresu.idtrami;
      sessionStorage.setItem('ultidtrami', this.ultIdSelec.toString());
      if (tagName === 'TD') {
         const datosToPrmisoxtrami = {
            idtrami: tramipresu.idtrami,
            desdeNum: this.formBuscar.value.desdeNum,
            hastaNum: this.formBuscar.value.hastaNum
         };
         sessionStorage.setItem('datosToPrmisoxtrami', JSON.stringify(datosToPrmisoxtrami));
         this.router.navigate(['prmisoxtrami']);
      }
   }

   modiTramipresu(tramipresu: any) {
      sessionStorage.setItem("idtramiToModi", tramipresu.idtrami.toString());
      this.router.navigate(['/modi-tramipresu']);
   }

   eliminar(tramipresu: Tramipresu) {
      this.ejecuService.countByIdtrami(tramipresu.idtrami).subscribe({
         next: registros => {
            if (registros > 0) {
               Swal.fire({
                  icon: 'error',
                  title: `No puede eliminar el Trámite Nro: ${tramipresu.numero}`,
                  text: `Tiene comprometido ${registros} Partida(s)`,
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
                  text: `Eliminar el Trámite: ${tramipresu.numero} ?`,
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
                  if (resultado.isConfirmed) this.elimina(tramipresu);
               });
            }
         },
         error: err => { console.error('Al buscar las Partidas de la Certificación: ', err.error); },
      });
   }

   elimina(tramipresu: Tramipresu) {
      this.tramiService.deleteTramipresu(tramipresu.idtrami).subscribe({
         next: (response: DeleteResponse) => {
            if (response.deleted === true) {  // Eliminado correctamente
               let eliminado: Eliminadosapp = new Eliminadosapp();
               eliminado.idusuario = this.authService.idusuario!;
               eliminado.modulo = this.authService.moduActual;
               eliminado.fecha = new Date();
               eliminado.routerlink = 'tramipresu';
               eliminado.tabla = 'TRAMITES';
               eliminado.datos = `Nro. ${tramipresu.numero} del ${tramipresu.fecha} Beneficiario: ${tramipresu.idbene.nomben}`;
               this.elimService.save(eliminado).subscribe({
                  next: () => {
                     this.authService.swal('success', `Trámite ${tramipresu.numero} eliminada con éxito`);
                     this.buscar();
                  },
                  error: err => { console.error(err.error); this.authService.mostrarError('Error al guardar eliminado', err.error); }
               });
               return;
            }
            if (response.deleted === false) {   // No existía
               this.authService.mensaje404(`El Trámite ${tramipresu.numero} no existe o fue eliminada por otro Usuario`);
               this.buscar();
               return;
            }
            if (response.error === true) { // Error real del backend
               this.authService.mostrarError('Error al eliminar el Trámite', `${response.error} ${response.message}`);
               return;
            }
         },
         error: (err) => {
            this.authService.mostrarError('Error al eliminar el Trámite', err.error);
         }
      });
   }

   cerrar() { this.router.navigate(['/inicio']); }

}

export interface DeleteResponse {
   deleted?: boolean;  // true si se eliminó, false si no existía
   error?: boolean;    // true si hubo un error real (500)
   message: string;    // mensaje del backend
}
