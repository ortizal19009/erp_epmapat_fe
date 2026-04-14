import { Component, OnInit } from '@angular/core';
import { AbstractControl, AsyncValidatorFn, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AutorizaService } from '@compartida/autoriza.service';
import { Tramipresu } from '@modelos/contabilidad/tramipresu.model';
import { EjecucionService } from '@servicios/contabilidad/ejecucio.service';
import { catchError, map, Observable, of } from 'rxjs';
import { Documentos } from 'src/app/modelos/administracion/documentos.model';
import { Beneficiarios } from 'src/app/modelos/contabilidad/beneficiarios.model';
import { DocumentosService } from 'src/app/servicios/administracion/documentos.service';
import { BeneficiariosService } from 'src/app/servicios/contabilidad/beneficiarios.service';
import { TramipresuService } from 'src/app/servicios/contabilidad/tramipresu.service';

@Component({
   selector: 'app-modi-tramipresu',
   templateUrl: './modi-tramipresu.component.html',
   styleUrls: ['./modi-tramipresu.component.css']
})

export class ModiTramipresuComponent implements OnInit {

   formTramipresu: FormGroup;
   idtrami: number;
   antnumero: number;
   documentos: Documentos[] = [];
   beneficiarios: Beneficiarios[] = [];
   idbene: number | null;
   inicioFormulario: number = 0;

   constructor(private beneService: BeneficiariosService, private router: Router, private fb: FormBuilder,
      private docuService: DocumentosService, private tramiService: TramipresuService, public authService: AutorizaService,
      private ejecuService: EjecucionService) { }

   ngOnInit(): void {
      sessionStorage.setItem('ventana', '/tramipresu');
      let coloresJSON = sessionStorage.getItem('/tramipresu');
      if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));

      this.idtrami = +sessionStorage.getItem("idtramiToModi")!;
      this.formTramipresu = this.fb.group({
         numero: ['', [Validators.required, Validators.min(1)], this.valNumero()],
         fecha: ['', Validators.required, this.valAño()],
         intdoc: '',
         numdoc: ['', [Validators.required, Validators.minLength(1)]],
         fecdoc: ['', Validators.required],
         idbene: ['', Validators.required, this.valBenefi()],
         descri: ''
      }, { updateOn: "blur" });

      this.inicioFormulario = Date.now();
      this.datosTramipresu();
      this.listarDocumentos();
   }

   colocaColor(colores: any) {
      document.documentElement.style.setProperty('--bgcolor1', colores[0]);
      const cabecera = document.querySelector('.cabecera');
      if (cabecera) cabecera.classList.add('nuevoBG1')
      document.documentElement.style.setProperty('--bgcolor2', colores[1]);
      const detalle = document.querySelector('.detalle');
      if (detalle) detalle.classList.add('nuevoBG2');
   }

   listarDocumentos() {
      this.docuService.getListaDocumentos().subscribe({
         next: (documentos: Documentos[]) => { this.documentos = documentos },
         error: err => console.error(err.error),
      });
   }

   datosTramipresu() {
      this.tramiService.findById(this.idtrami).subscribe({
         next: datos => {
            this.antnumero = datos.numero;
            this.idbene = datos.idbene.idbene;
            this.formTramipresu.patchValue({
               numero: datos.numero,
               fecha: datos.fecha,
               intdoc: datos.intdoc.intdoc,
               numdoc: datos.numdoc,
               fecdoc: datos.fecdoc,
               idbene: datos.idbene.nomben,
               descri: datos.descri,
            });
            this.ejecuService.countByIdtrami(this.idtrami).subscribe({
               next: numPartidas => {
                  if (numPartidas > 0) {
                     this.formTramipresu.get('fecha')!.disable();
                     this.formTramipresu.get('idbene')!.disable();
                  } else {
                     this.formTramipresu.get('fecha')!.enable();
                     this.formTramipresu.get('idbene')!.enable();
                  }
               },
               error: err => { console.error(err.error); this.authService.mostrarError('Error al contar las Partidas', err.error) }
            });
         },
         error: err => { console.error(err.error); this.authService.mostrarError('Error al buscar el Trámite', err.error) }
      });
   }

   get f() { return this.formTramipresu.controls; }

   benefixNombre(e: any) {
      if (e.target.value != '') {
         this.beneService.findByNomben(e.target.value).subscribe({
            next: (beneficiarios: Beneficiarios[]) => this.beneficiarios = beneficiarios,
            error: err => console.error(err.error),
         });
      }
   }
   onBenefiSelected(e: any) {
      const selectedOption = this.beneficiarios.find((x: { nomben: any; }) => x.nomben === e.target.value);
      if (selectedOption) this.idbene = selectedOption.idbene;
      else this.idbene = null;
   }

   actualizar() {
      // Vuelve a validar el número (Mientras toman café ...)
      this.validaNumeroAntesDeGuardar().subscribe(esValido => {
         if (!esValido) {
            const fin = Date.now();
            const tiempoTranscurrido = fin - this.inicioFormulario;
            this.authService.mensaje404(`El Trámite ${this.formTramipresu.value.numero} ya fue creado/actualizado por otro Usuario. 
               Tiempo transcurrido: ${this.authService.formatearTiempo(tiempoTranscurrido)}`);
            return;
         }
         const dto: TramipresuUpdateDTO = {};   // Todos los campos opcionales
         if (this.f['numero'].dirty) { dto.numero = this.f['numero'].value; }
         if (this.f['fecha'].dirty) { dto.fecha = this.f['fecha'].value; }
         if (this.f['intdoc'].dirty) { dto.intdoc = { intdoc: this.f['intdoc'].value }; }
         if (this.f['numdoc'].dirty) { dto.numdoc = this.f['numdoc'].value; }
         if (this.f['fecdoc'].dirty) { dto.fecdoc = this.f['fecdoc'].value; }
         if (this.f['idbene']?.dirty) { dto.idbene = { idbene: this.idbene }; }
         if (this.f['descri'].dirty) { dto.descri = this.f['descri'].value; }
         dto.usumodi = this.authService.idusuario;
         dto.fecmodi = new Date();
         this.tramiService.updateTramipresu(this.idtrami, dto).subscribe({
            next: (actualizada: Tramipresu) => {
               this.authService.swal('success', `Trámite ${actualizada.numero} actualizada con éxito`);
               this.regresar()
            },
            error: err => { console.error(err.error); this.authService.mostrarError('Error al actualizar el Trámite', err.error) }
         });
      });
   }

   regresar() { this.router.navigate(['/tramipresu']); }

   // Valida el número
   valNumero(): AsyncValidatorFn {
      return (control: AbstractControl) => {
         const valor = control.value;
         if (valor === null || valor === undefined || valor === '') { return of(null); }
         return this.tramiService.valNumero(valor).pipe(
            map(existe => {
               if (existe && valor !== this.antnumero) { return { existe: true }; }
               return null;
            }),
            catchError(() => of(null))
         );
      };
   }

   // Al actualizar Valida el número nuevamente
   validaNumeroAntesDeGuardar(): Observable<boolean> {
      const valor = this.formTramipresu.get('numero')?.value;
      if (valor == this.antnumero) { return of(true); }
      return this.tramiService.valNumero(valor).pipe(
         map(existe => !existe),
         catchError(() => of(true))
      );
   }

   //Valida periodo
   valAño(): AsyncValidatorFn {
      return (control: AbstractControl): Observable<ValidationErrors | null> => {
         const datos = this.authService.getDatosEmpresa();
         const añoEmpresa = datos?.fechap?.toString().slice(0, 4);
         const añoDigitado = control.value?.toString().slice(0, 4);
         const esValido = añoEmpresa === añoDigitado;
         return of(esValido ? null : { añoinvalido: true });
      };
   }

   //Valida que se haya seleccionado un Beneficiario
   valBenefi(): AsyncValidatorFn {
      return (_control: AbstractControl): Observable<ValidationErrors | null> => {
         const esValido = this.idbene != null;
         return of(esValido ? null : { invalido: true });
      };
   }

}

export interface TramipresuUpdateDTO {
   numero?: number;
   fecha?: Date;
   intdoc?: { intdoc: number };
   numdoc?: String;
   fecdoc?: Date;
   idbene?: { idbene: number | null };
   descri?: String;
   usumodi?: number;
   fecmodi?: Date;
}