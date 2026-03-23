import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { Certipresu } from 'src/app/modelos/contabilidad/certipresu.model';
import { Partixcerti } from 'src/app/modelos/contabilidad/partixcerti.model';
import { Presupue } from 'src/app/modelos/contabilidad/presupue.model';
import { CertipresuService } from 'src/app/servicios/contabilidad/certipresu.service';
import { EjecucionService } from 'src/app/servicios/contabilidad/ejecucion.service';
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
   swnuevo: boolean
   presupue: Presupue[] = [];
   idparxcer: number;      //Para modificar
   intpre: number | null;
   partida: { codpar: String, saldo: number, newsaldo: number } = { codpar: '', saldo: 0, newsaldo: 0 };
   swmodificar: boolean;
   sweliminar: boolean = false;
   swbusca: boolean = false;
   hover: boolean = false;
   primera: number;
   navegador: number;
   ultima: number;
   sumValor: number = 0;
   sumTotprmisos: number = 0;

   constructor(private router: Router, private fb: FormBuilder, public authService: AutorizaService, private ejecuService: EjecucionService,
      private certiService: CertipresuService, private parxcerService: PartixcertiService, private presuService: PresupueService,
      private elimService: EliminadosappService) { }

   ngOnInit(): void {
      if (!this.authService.sessionlog) { this.router.navigate(['/inicio']); }
      sessionStorage.setItem('ventana', '/certipresu');
      let coloresJSON = sessionStorage.getItem('/certipresu');
      if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));

      const datosToPartixcertiJSON = sessionStorage.getItem('datosToPartixcerti');
      if (datosToPartixcertiJSON) {
         const datosToPartixcerti = JSON.parse(datosToPartixcertiJSON);
         this.idcerti = datosToPartixcerti.idcerti;
         this.primera = +datosToPartixcerti.desdeNum;
         this.ultima = +datosToPartixcerti.hastaNum;
      }
      this.buscaCertipresu();
      this.creaForm();
   }

   colocaColor(colores: any) {
      document.documentElement.style.setProperty('--bgcolor1', colores[0]);
      const cabecera = document.querySelector('.cabecera');
      if (cabecera) cabecera.classList.add('nuevoBG1')
      document.documentElement.style.setProperty('--bgcolor2', colores[1]);
      const detalle = document.querySelector('.detalle');
      if (detalle) detalle.classList.add('nuevoBG2');
   }

   creaForm() {
      //Form de nueva/modificar partixcerti
      this.formPartixcerti = this.fb.group({
         intpre: ['', Validators.required, this.valCodpar()],
         codpar: '',
         nompar: '',
         saldo: '',
         valor: ['', [Validators.required, Validators.min(0.01)], this.valValor.bind(this)],
         newsaldo: '',
         descripcion: this.iCertificacion.descripcion
      }, { updateOn: "blur" });
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

   get f() { return this.formPartixcerti.controls; }

   calcularTotales(): void {
      this.sumValor = this.partixcerti.map(p => Number(p.valor) || 0).reduce((acc, val) => acc + val, 0);
      this.sumTotprmisos = this.partixcerti.map(p => Number(p.totprmisos) || 0).reduce((acc, val) => acc + val, 0);
   }

   nuevo() {
      this.swnuevo = true;
      this.creaForm();
   }

   cancelar() {
      this.swnuevo = false;
      this.swmodificar = false;
   }

   modificar(partixcerti: Partixcerti) {
      this.swmodificar = true;
      this.idparxcer = partixcerti.idparxcer;
      this.intpre = partixcerti.intpre.intpre;
      this.partida.saldo = +partixcerti.saldo;
      this.partida.newsaldo = this.partida.saldo - partixcerti.valor;
      // console.log('this.partida.newsaldo: ', this.partida.newsaldo)
      this.formPartixcerti.patchValue({
         intpre: partixcerti.intpre,
         codpar: partixcerti.intpre.codpar,
         nompar: partixcerti.intpre.nompar,
         saldo: this.partida.saldo,
         valor: partixcerti.valor,
         newsaldo: this.partida.newsaldo,
         descripcion: partixcerti.descripcion,
      });
   }

   //Datalist de codpar 
   partidaxCodpar(e: any) {
      if (e.target.value != '') {
         this.presuService.findByCodpar(2, e.target.value).subscribe({
            next: (partidas: Presupue[]) => this.presupue = partidas,
            error: err => console.error(err.error),
         });
      }
   }
   onPartidaSelected(e: any) {
      const selectedOption = this.presupue.find((x: { codpar: any; }) => x.codpar === e.target.value);
      if (selectedOption) {
         this.intpre = selectedOption.intpre;
         this.partida.saldo = selectedOption.inicia + selectedOption.totmod - selectedOption.totcerti;
         this.formPartixcerti.patchValue({
            nompar: selectedOption.nompar,
            saldo: this.partida.saldo,
            valor: '',
            newsaldo: ''
         });
      }
      else {
         this.intpre = null;
         this.formPartixcerti.patchValue({ nompar: '' })
      }
   }

   guardar() {
      const dto: PartixcertiCreateDTO = {
         idcerti: { idcerti: this.idcerti },
         intpre: { intpre: this.intpre },
         saldo: this.formPartixcerti.value.saldo,
         valor: this.formPartixcerti.value.valor,
         descripcion: this.formPartixcerti.value.descripcion,
         totprmisos: 0,
         swreinte: 0,
         usucrea: this.authService.idusuario,
         feccrea: new Date(),
      };
      this.parxcerService.savePartixcerti(dto).subscribe({
         next: (partixcerti: Partixcerti) => {
            this.authService.swal('success', `Partida ${partixcerti.intpre.codpar} guardada en la Certificación con éxito `);
            sessionStorage.setItem('ultidparxcer', partixcerti.idparxcer.toString());
            this.buscaPartixcerti();
            this.swnuevo = false;
         },
         error: err => { console.error(err.error); this.authService.mostrarError('Error al guardar', err.error) }
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
      // console.log('Envia: ', this.idcerti)
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

   //Valida que se haya seleccionado una Partida
   valCodpar(): AsyncValidatorFn {
      return (_control: AbstractControl) => {
         if (this.intpre == null) { return of<ValidationErrors>({ invalido: true }); }
         return of(null);
      };
   }

   //Valida el Valor
   valValor(_control: AbstractControl) {
      this.partida.newsaldo = Math.round((this.partida.saldo - +this.formPartixcerti.controls['valor'].value) * 100) / 100;
      this.formPartixcerti.controls['newsaldo'].setValue(this.partida.newsaldo);
      if (this.partida.newsaldo < 0) return of({ 'invalido': true });
      else return of(null);
   }

}

interface interfaceCertificacion {
   numero: number;
   fecha: Date;
   docu: string;
   respon: string;
   descripcion: String;
}

export interface PartixcertiCreateDTO {
   idcerti: { idcerti: number | null };
   intpre: { intpre: number | null };
   saldo: number;
   valor: number;
   descripcion: String;
   totprmisos: number;
   swreinte: number
   usucrea: number;
   feccrea: Date;
}

export interface PartixcertiUpdateDTO {
   valor?: number;
   descripcion?: String;
   usumodi?: number;
   fecmodi?: Date;
}