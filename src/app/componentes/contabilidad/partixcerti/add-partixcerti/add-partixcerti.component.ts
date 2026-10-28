import { Component, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, AsyncValidatorFn, FormBuilder, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AutorizaService } from '@compartida/autoriza.service';
import { Certipresu } from '@modelos/contabilidad/certipresu.model';
import { Partixcerti } from '@modelos/contabilidad/partixcerti.model';
import { Presupue } from '@modelos/contabilidad/presupue.model';
import { CertipresuService } from '@servicios/contabilidad/certipresu.service';
import { PartixcertiService } from '@servicios/contabilidad/partixcerti.service';
import { PresupueService } from '@servicios/contabilidad/presupue.service';
import { Observable, of, Subscription } from 'rxjs';

@Component({
  selector: 'app-add-partixcerti',
  templateUrl: './add-partixcerti.component.html',
  styleUrls: ['./add-partixcerti.component.css']
})
export class AddPartixcertiComponent implements OnInit, OnDestroy {

   iCertificacion = {} as interfaceCertificacion; //Interface para los datos de la Certificación
   idcerti: number;
   formPartixcerti: FormGroup;
   presupue: Presupue[] = [];
   intpre: number | null = null;
   private calculos = new Subscription();

   constructor(public authService: AutorizaService, private router: Router, private certiService: CertipresuService,
      private presuService: PresupueService, private fb: FormBuilder, private parxcerService: PartixcertiService) { }

   ngOnInit(): void {
      if (!this.authService.sessionlog) { this.router.navigate(['/inicio']); }
      sessionStorage.setItem('ventana', '/certipresu');
      let coloresJSON = sessionStorage.getItem('/certipresu');
      if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));

      this.idcerti = Number(sessionStorage.getItem('idcertiToAddPartixcerti'));

      this.formPartixcerti = this.fb.group({
               intpre: ['', Validators.required, this.valCodpar()],
               codpar: '',
               nompar: '',
               saldo: null,
               valor: this.fb.control(null, { validators: [Validators.required, Validators.min(0.01), this.valValor()], updateOn: 'change' }),
               newsaldo: null,
               descripcion: ''
            }, { updateOn: "blur" });
      this.calculos.add(this.f['valor'].valueChanges.subscribe(() => this.recalcularSaldo()));
      this.calculos.add(this.f['saldo'].valueChanges.subscribe(() => {
         this.f['valor'].updateValueAndValidity({ emitEvent: false }); this.recalcularSaldo();
      }));
      this.buscaCertipresu();
   }

   ngOnDestroy() { this.calculos.unsubscribe(); }

   recalcularSaldo() {
      const saldo = Number(this.f['saldo'].value);
      const valor = Number(this.f['valor'].value ?? 0);
      const resultado = this.intpre != null && this.f['saldo'].value !== null && Number.isFinite(saldo) && Number.isFinite(valor)
         ? (Math.round(saldo * 100) - Math.round(valor * 100)) / 100 : null;
      this.f['newsaldo'].setValue(resultado, { emitEvent: false });
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
            saldo: Math.round((Number(selectedOption.inicia ?? 0) + Number(selectedOption.totmod ?? 0) - Number(selectedOption.totcerti ?? 0)) * 100) / 100,
            valor: null,
            newsaldo: null
         });
      }
      else {
         this.intpre = null;
         this.formPartixcerti.patchValue({ nompar: '', saldo: null, valor: null, newsaldo: null });
      }
      this.f['intpre'].updateValueAndValidity({ emitEvent: false });
      this.f['valor'].updateValueAndValidity({ emitEvent: false });
      this.recalcularSaldo();
   }

   seleccionarTexto(event: FocusEvent): void {
      const input = event.target as HTMLInputElement;
      input.select();
   }

   guardar() {
      this.formPartixcerti.markAllAsTouched();
      if (this.formPartixcerti.invalid || this.formPartixcerti.pending || this.intpre == null) return;
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
   valValor(): ValidatorFn {
      return (control: AbstractControl): ValidationErrors | null => {
         if (control.value === null || control.value === undefined || control.value === '') return null;
         const valor = Number(control.value);
         if (!Number.isFinite(valor)) return { numeroInvalido: true };
         if (Math.abs(valor * 100 - Math.round(valor * 100)) > 0.000001) return { decimales: true };
         const saldo = this.formPartixcerti?.get('saldo')?.value;
         if (this.intpre == null || saldo === null || saldo === undefined) return null;
         return Math.round(valor * 100) > Math.round(Number(saldo) * 100) ? { invalido: true } : null;
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