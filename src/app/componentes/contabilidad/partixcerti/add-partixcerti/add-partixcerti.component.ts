import { Component, OnInit } from '@angular/core';
import { AbstractControl, AsyncValidatorFn, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AutorizaService } from '@compartida/autoriza.service';
import { Certipresu } from '@modelos/contabilidad/certipresu.model';
import { Partixcerti } from '@modelos/contabilidad/partixcerti.model';
import { Presupue } from '@modelos/contabilidad/presupue.model';
import { CertipresuService } from '@servicios/contabilidad/certipresu.service';
import { PartixcertiService } from '@servicios/contabilidad/partixcerti.service';
import { PresupueService } from '@servicios/contabilidad/presupue.service';
import { Observable, of } from 'rxjs';

@Component({
  selector: 'app-add-partixcerti',
  templateUrl: './add-partixcerti.component.html',
  styleUrls: ['./add-partixcerti.component.css']
})
export class AddPartixcertiComponent implements OnInit {

   iCertificacion = {} as interfaceCertificacion; //Interface para los datos de la Certificación
   idcerti: number;
   formPartixcerti: FormGroup;
   presupue: Presupue[] = [];
   intpre: number | null;

   constructor(public authService: AutorizaService, private router: Router, private certiService: CertipresuService,
      private presuService: PresupueService, private fb: FormBuilder, private parxcerService: PartixcertiService) { }

   ngOnInit(): void {
      if (!this.authService.sessionlog) { this.router.navigate(['/inicio']); }
      sessionStorage.setItem('ventana', '/certipresu');
      let coloresJSON = sessionStorage.getItem('/certipresu');
      if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));

      this.idcerti = Number(sessionStorage.getItem('idcertiToAddPartixcerti'));
console.log('Recibe: ', this.idcerti )

      this.formPartixcerti = this.fb.group({
               intpre: ['', Validators.required, this.valCodpar()],
               codpar: '',
               nompar: '',
               saldo: '',
               valor: ['', [Validators.required, Validators.min(0.01)], this.valValor()],
               newsaldo: '',
               descripcion: ''
            }, { updateOn: "blur" });
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

   buscaCertipresu() {
      this.certiService.getByIdCerti(this.idcerti).subscribe({
         next: (certipresu: Certipresu) => {
            this.iCertificacion.numero = certipresu.numero;
            this.iCertificacion.fecha = certipresu.fecha;
            this.iCertificacion.docu = certipresu.intdoc.nomdoc + ' ' + certipresu.numdoc
            this.iCertificacion.respon = certipresu.idbeneres.nomben
            this.iCertificacion.descripcion = certipresu.descripcion;
            //
            this.formPartixcerti.patchValue({descripcion: this.iCertificacion.descripcion})
            
         },
         error: err => { console.error(err.error); this.authService.mostrarError('Error al buscar la Certificación', err.error) }
      });
   }

   get f() { return this.formPartixcerti.controls; }

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
         this.formPartixcerti.patchValue({
            nompar: selectedOption.nompar,
            saldo: selectedOption.inicia + selectedOption.totmod - selectedOption.totcerti,
            valor: '',
            newsaldo: ''
         });
      }
      else {
         this.intpre = null;
         this.formPartixcerti.patchValue({ nompar: '' });
      }
   }

   seleccionarTexto(event: FocusEvent): void {
      const input = event.target as HTMLInputElement;
      input.select();
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
            this.authService.swal('success', `Partida ${partixcerti.intpre.codpar} guardada con éxito en la Certificación ${this.iCertificacion.numero}`);
            sessionStorage.setItem('ultidparxcer', partixcerti.idparxcer.toString());
            this.regresar();
         },
         error: err => { console.error(err.error); this.authService.mostrarError('Error al guardar', err.error) }
      });
   }

   regresar() { this.router.navigate(['/partixcerti']); }

   //Valida que se haya seleccionado una Partida
   valCodpar(): AsyncValidatorFn {
      return (_control: AbstractControl) => {
         if (this.intpre == null) { return of<ValidationErrors>({ invalido: true }); }
         return of(null);
      };
   }

   //Valida el Valor
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