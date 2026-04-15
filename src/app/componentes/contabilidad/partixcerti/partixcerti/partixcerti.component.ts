import { Component, OnInit } from '@angular/core';
import { AbstractControl, AsyncValidatorFn, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ColoresService } from '@compartida/colores.service';
import { TramipresuService } from '@servicios/contabilidad/tramipresu.service';
import { Observable, of } from 'rxjs';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { EjecucioVM } from 'src/app/dtos/contabilidad/ejecucio.dto';
import { Eliminadosapp } from 'src/app/modelos/administracion/eliminadosapp.model';
import { Certipresu } from 'src/app/modelos/contabilidad/certipresu.model';
import { Partixcerti } from 'src/app/modelos/contabilidad/partixcerti.model';
import { Presupue } from 'src/app/modelos/contabilidad/presupue.model';
import { EliminadosappService } from 'src/app/servicios/administracion/eliminadosapp.service';
import { CertipresuService } from 'src/app/servicios/contabilidad/certipresu.service';
import { EjecucionService } from 'src/app/servicios/contabilidad/ejecucio.service';
import { PartixcertiService } from 'src/app/servicios/contabilidad/partixcerti.service';
import { PresupueService } from 'src/app/servicios/contabilidad/presupue.service';
import Swal from 'sweetalert2';

@Component({
   selector: 'app-partixcerti',
   templateUrl: './partixcerti.component.html',
   styleUrls: ['./partixcerti.component.css']
})

export class PartixcertiComponent implements OnInit {

   formPartixcerti: FormGroup;
   idcerti: number;
   iCertificacion = {} as interfaceCertificacion; //Interface para los datos de la Certificación
   partixcerti: Partixcerti[] = [];
   padre: string;
   presupue: Presupue[] = [];
   idparxcer: number;      //Para modificar
   swmodificar: boolean;
   sweliminar: boolean = false;
   swbusca: boolean = false;
   hover: boolean = false;
   primera: number;
   navegador: number;
   ultima: number;
   sumValor: number = 0;
   sumTotprmisos: number = 0;
   compromisos: EjecucioVM[] = [];
   totComprometido: number = 0;
   datosToPartixcerti: { idcerti: number; desdeNum: number; hastaNum: number; ultima: number; padre: string; };

   constructor(private router: Router, private fb: FormBuilder, public authService: AutorizaService, private ejecuService: EjecucionService,
      private certiService: CertipresuService, private parxcerService: PartixcertiService, private presuService: PresupueService,
      private elimService: EliminadosappService, private tramiService: TramipresuService, private coloresService: ColoresService) { }

   ngOnInit(): void {
      if (!this.authService.sessionlog) { this.router.navigate(['/inicio']); }
      sessionStorage.setItem('ventana', '/certipresu');
      let coloresJSON = sessionStorage.getItem('/certipresu');
      if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));
      else this.buscaColor();

      const datosToPartixcertiJSON = sessionStorage.getItem('datosToPartixcerti');
      if (datosToPartixcertiJSON) {
         this.datosToPartixcerti = JSON.parse(datosToPartixcertiJSON);
         this.idcerti = this.datosToPartixcerti.idcerti;
         this.primera = +this.datosToPartixcerti.desdeNum;
         this.ultima = +this.datosToPartixcerti.hastaNum;
         this.padre = this.datosToPartixcerti.padre
      }
      this.buscaCertipresu();
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
         const datos = await this.coloresService.setcolor(this.authService.idusuario, 'certipresu');
         const coloresJSON = JSON.stringify(datos);
         sessionStorage.setItem('/certipresu', coloresJSON);
         this.colocaColor(datos);
      } catch (error) { console.error(error); }
   }

   buscaCertipresu() {
      this.certiService.getByIdCerti(this.idcerti).subscribe({
         next: (certipresu: Certipresu) => {
            this.navegador = certipresu.numero;
            this.iCertificacion.numero = certipresu.numero;
            this.iCertificacion.fecha = certipresu.fecha;
            this.iCertificacion.docu = certipresu.intdoc.nomdoc + ' ' + certipresu.numdoc
            this.iCertificacion.respon = certipresu.idbeneres.nomben
            this.iCertificacion.descripcion = certipresu.descripcion;
            this.buscaPartixcerti();
         },
         error: err => { console.error(err.error); this.authService.mostrarError('Error al buscar la Certificación', err.error) }
      });
   }

   buscaPartixcerti() {
      this.parxcerService.getByIdCerti(this.idcerti).subscribe({
         next: (partixcerti: Partixcerti[]) => {
            this.swbusca = true;
            this.partixcerti = partixcerti;
            if (this.partixcerti.length > 1) this.calcularTotales();
         },
         error: err => { console.error(err.error); this.authService.mostrarError('Error al buscar', err.error) }
      });
   }

   calcularTotales(): void {
      this.sumValor = this.partixcerti.map(p => Number(p.valor) || 0).reduce((acc, val) => acc + val, 0);
      this.sumTotprmisos = this.partixcerti.map(p => Number(p.totprmisos) || 0).reduce((acc, val) => acc + val, 0);
   }

   // Compromisos de una partixcerti
   buscaCompromisos(idprmiso: number) {
      this.ejecuService.obtenerPorIdparxcer(idprmiso).subscribe({
         next: (ejecucio: EjecucioVM[]) => {
            this.compromisos = ejecucio;
            // Calcula el total de compromisos
            this.totComprometido = this.compromisos.length > 1
               ? this.compromisos.reduce((sum, e) => sum + (e.prmiso || 0), 0)
               : (this.compromisos[0]?.devengado || 0);
            // Carga los Trámites
            this.compromisos.forEach((e, index) => {
               if (e.idtrami) {
                  this.tramiService.findById(e.idtrami).subscribe(tramipresu => {
                     this.compromisos[index].tramite = tramipresu;
                  });
               }
            });
         },
         error: (err) => { console.error(err); this.authService.mostrarError('Error al buscar los Compromisos', err.error) }
      });
   }

   abrirTramite(idtrami: number) {
      this.tramiService.ultimoTramipresu().subscribe({
         next: resp => {
            const datosToPrmisoxtrami = {
               idtrami: idtrami,
               desdeNum: 1,
               hastaNum: resp.numero,
               padre: 'Ninguno'
            };
            sessionStorage.setItem('datosToPrmisoxtrami', JSON.stringify(datosToPrmisoxtrami));
            const url = `${window.location.origin}/prmisoxtrami`;
            window.open(url, '_blank');
         },
         error: err => { console.error(err.error); this.authService.mostrarError('Error al buscar el último', err.error) }
      });
   }

   nuevo() {
      this.datosToPartixcerti.idcerti = this.idcerti
      sessionStorage.setItem('datosToPartixcerti', JSON.stringify(this.datosToPartixcerti));
      sessionStorage.setItem('idcertiToAddPartixcerti', this.idcerti.toString());
      this.router.navigate(['/add-partixcerti']);
   }

   get f() { return this.formPartixcerti.controls; }

   modificar(partixcerti: Partixcerti) {
      this.swmodificar = true;
      this.formPartixcerti = this.fb.group({
         intpre: '',
         codpar: '',
         nompar: '',
         saldo: '',
         valor: ['', [Validators.required, Validators.min(0.01)], this.valValor()],
         newsaldo: '',
         descripcion: this.iCertificacion.descripcion
      }, { updateOn: "blur" });

      this.idparxcer = partixcerti.idparxcer;
      this.formPartixcerti.patchValue({
         intpre: partixcerti.intpre,
         codpar: partixcerti.intpre.codpar,
         nompar: partixcerti.intpre.nompar,
         saldo: partixcerti.saldo,
         valor: partixcerti.valor,
         newsaldo: partixcerti.saldo - partixcerti.valor,
         descripcion: partixcerti.descripcion,
      });
   }

   actualizar() {
      const dto: PartixcertiUpdateDTO = {};   // Todos los campos opcionales
      if (this.f['valor'].dirty) { dto.valor = this.f['valor'].value; }
      if (this.f['descripcion'].dirty) { dto.descripcion = this.f['descripcion'].value; }
      dto.usumodi = this.authService.idusuario;
      dto.fecmodi = new Date();
      this.parxcerService.updatePartixcerti(this.idparxcer, dto).subscribe({
         next: (actualizada: Partixcerti) => {
            this.authService.swal('success', `Partida ${actualizada.intpre.codpar} de la Certificación ${this.iCertificacion.numero} actualizada con éxito`);
            this.swmodificar = false
            this.buscaPartixcerti();
         },
         error: err => { console.error(err.error); this.authService.mostrarError('Error al actualizar', err.error) }
      });

   }

   cancelar() { this.swmodificar = false }

   eliminar(partixcerti: Partixcerti) {
      this.ejecuService.countByIdparxcer(partixcerti.idparxcer).subscribe({
         next: registros => {
            if (registros > 0) {
               Swal.fire({
                  icon: 'error',
                  title: `No puede eliminar la Partida ${partixcerti.intpre.codpar} de la Certificación Nro: ${this.iCertificacion.numero}`,
                  text: `Tiene registrado ${registros} Compromiso(s)`,
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
                  text: `Eliminar la Partida ${partixcerti.intpre.codpar} de la Certificación Nro: ${this.iCertificacion.numero} ?`,
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
                  if (resultado.isConfirmed) this.elimina(partixcerti);
               });
            }
         },
         error: err => { console.error('Al buscar las Partidas de la Certificación: ', err.error); },
      });
   }

   elimina(partixcerti: Partixcerti) {
      this.parxcerService.deletePartixcerti(partixcerti.idparxcer).subscribe({
         next: () => {
            let eliminado: Eliminadosapp = new Eliminadosapp();
            eliminado.idusuario = this.authService.idusuario!;
            eliminado.modulo = this.authService.moduActual;
            eliminado.fecha = new Date();
            eliminado.routerlink = 'partixcerti';
            eliminado.tabla = 'PARTIXCERTI';
            eliminado.datos = `Partida ${partixcerti.intpre.codpar} de la Certificacion Nro: ${this.iCertificacion.numero}`;
            this.elimService.save(eliminado).subscribe({
               next: () => {
                  this.authService.swal('success', `Partida ${partixcerti.intpre.codpar} de la Certificacion Nro: ${this.iCertificacion.numero} eliminada con éxito`);
                  this.buscaPartixcerti();
               },
               error: err => { console.error(err.error); this.authService.mostrarError('Error al guardar eliminado', err.error); }
            });
         },
         error: (err) => {
            if (err.status === 404) {
               this.authService.mensaje404(`La Partida ${partixcerti.intpre.codpar} de la Certificacion Nro: ${this.iCertificacion.numero} no existe o fue eliminada por otro Usuario`);
               this.buscaPartixcerti();
            } else {
               this.authService.mostrarError('Error al eliminar la Partida de la Certificación', err.error);
            }
         }
      });
   }

   imprimir() {
      sessionStorage.setItem("partixcertiToImpExp", this.iCertificacion.numero.toString());
      this.router.navigate(['/imp-partixcerti']);
   }

   regresar() { this.router.navigate(['/certipresu']); }
   cerrar() { this.router.navigate(['/inicio']); }

   actual() { this.navegador = this.iCertificacion.numero; }

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
      this.certiService.getByNumero(n, 1).subscribe(certi => {
         if (!certi) {
            this.authService.swal('warning', `No existe la Certificación Nro: ${n}`);
            return;
         }
         this.idcerti = certi.idcerti;
         this.navegador = certi.numero;
         this.iCertificacion.numero = certi.numero;
         this.iCertificacion.fecha = certi.fecha;
         this.iCertificacion.docu = certi.intdoc.nomdoc + ' ' + certi.numdoc
         this.iCertificacion.respon = certi.idbeneres.nomben
         this.iCertificacion.descripcion = certi.descripcion;
         this.buscaPartixcerti();
      });
   }

   seleccionarTexto(event: FocusEvent): void {
      const input = event.target as HTMLInputElement;
      input.select();
   }

   //Valida el Valor
   // valValor(_control: AbstractControl) {
   //    this.partida.newsaldo = Math.round((this.partida.saldo - +this.formPartixcerti.controls['valor'].value) * 100) / 100;
   //    this.formPartixcerti.controls['newsaldo'].setValue(this.partida.newsaldo);
   //    if (this.partida.newsaldo < 0) return of({ 'invalido': true });
   //    else return of(null);
   // }
   valValor(): AsyncValidatorFn {
      return (control: AbstractControl): Observable<ValidationErrors | null> => {
         const valor = +control.value;
         const saldo = this.formPartixcerti.controls['saldo'].value
         const newsaldo = Math.round((saldo - valor) * 100) / 100;
         // Coloca newsaldo
         this.formPartixcerti.get('newsaldo')?.setValue(newsaldo, { emitEvent: false });
         if (newsaldo < 0) { return of({ invalido: true }) }
         return of(null);
      };
   }

}

interface interfaceCertificacion {
   numero: number;
   fecha: Date;
   docu: string;
   respon: string;
   descripcion: String;
}

export interface PartixcertiUpdateDTO {
   valor?: number;
   descripcion?: String;
   usumodi?: number;
   fecmodi?: Date;
}