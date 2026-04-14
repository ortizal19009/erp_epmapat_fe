import { Component, OnInit } from '@angular/core';
import { AbstractControl, AsyncValidatorFn, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Tramipresu } from '@modelos/contabilidad/tramipresu.model';
import { catchError, map, Observable, of } from 'rxjs';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { Documentos } from 'src/app/modelos/administracion/documentos.model';
import { Beneficiarios } from 'src/app/modelos/contabilidad/beneficiarios.model';
import { DocumentosService } from 'src/app/servicios/administracion/documentos.service';
import { BeneficiariosService } from 'src/app/servicios/contabilidad/beneficiarios.service';
import { TramipresuService } from 'src/app/servicios/contabilidad/tramipresu.service';

@Component({
   selector: 'app-add-tramipresu',
   templateUrl: './add-tramipresu.component.html',
   styleUrls: ['./add-tramipresu.component.css']
})

export class AddTramipresuComponent implements OnInit {

   formTramipresu: FormGroup;
   documentos: Documentos[] = [];
   beneficiarios: Beneficiarios[] = [];
   idbene: number | null;
   inicioFormulario: number = 0;

   constructor(
      private docService: DocumentosService, private fb: FormBuilder, private router: Router,
      public authService: AutorizaService, private tramiService: TramipresuService, private beneService: BeneficiariosService) { }

   ngOnInit(): void {
      sessionStorage.setItem('ventana', '/tramipresu');
      let coloresJSON = sessionStorage.getItem('/tramipresu');
      if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));

      this.formTramipresu = this.fb.group({
         numero: ['', [Validators.required, Validators.min(1)], this.valNumero.bind(this)],
         fecha: ['', [Validators.required], this.valAño()],
         intdoc: '',
         numdoc: ['', Validators.required],
         fecdoc: ['', Validators.required],
         idbene: ['', [Validators.required], [this.valBenefi()]],
         descri: '',
      }, { updateOn: "blur" });

      this.inicioFormulario = Date.now();
      this.listarDocumentos();
      this.ultimo();
   }

   colocaColor(colores: any) {
      document.documentElement.style.setProperty('--bgcolor1', colores[0]);
      const cabecera = document.querySelector('.cabecera');
      if (cabecera) cabecera.classList.add('nuevoBG1')
      document.documentElement.style.setProperty('--bgcolor2', colores[1]);
      const detalle = document.querySelector('.detalle');
      if (detalle) detalle.classList.add('nuevoBG2');
   }

   get f() { return this.formTramipresu.controls; }

   ultimo() {
      this.tramiService.ultimoTramipresu().subscribe({
         next: (tramipresu: Tramipresu) => {
            this.formTramipresu.patchValue({
               numero: +tramipresu.numero! + 1,
               fecha: tramipresu.fecha,
               fecdoc: tramipresu.fecha,
            });
         },
         error: err => { console.error(err.error); this.authService.mostrarError('Error al buscar el Último Trámite', err.error) }
      });
   }

   listarDocumentos() {
      this.docService.getListaDocumentos().subscribe({
         next: (documentos: Documentos[]) => {
            this.documentos = documentos;
            this.formTramipresu.controls['intdoc'].setValue(1);
         },
         error: err => { console.error(err.error); this.authService.mostrarError('Error al buscar los Documentos', err.error) }
      });
   }

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

   guardar() {
      // Vuelve a validar el número (Mientras toman café ...)
      this.validaNumeroAntesDeGuardar().subscribe(esValido => {
         if (!esValido) {
            const fin = Date.now();
            const tiempoTranscurrido = fin - this.inicioFormulario;
            this.authService.mensaje404(`El Trámite ${this.formTramipresu.value.numero} ya fue creado por otro Usuario. 
               Tiempo transcurrido: ${this.authService.formatearTiempo(tiempoTranscurrido)}`);
            return;
         }
         const dto: TramipresuCreateDTO = {
            numero: this.formTramipresu.value.numero,
            fecha: this.formTramipresu.value.fecha,
            intdoc: { intdoc: this.formTramipresu.value.intdoc },
            numdoc: this.formTramipresu.value.numdoc,
            fecdoc: this.formTramipresu.value.fecdoc,
            idbene: { idbene: this.idbene },
            descri: this.formTramipresu.value.descri,
            totmiso: 0,
            swreinte: 0,
            usucrea: this.authService.idusuario,
            feccrea: new Date()
         }
         this.tramiService.saveTramipresu(dto).subscribe({
            next: (nuevo: Tramipresu) => {
               //Actualiza los datos de búsqueda para que se muestre en la lista de Trámites
               let buscaDesdeNum = this.f['numero'].value - 16;
               if (buscaDesdeNum <= 0) buscaDesdeNum = 1;
               let year = new Date(this.f['fecha'].value).getFullYear(); // Extraer el año de la fecha 
               const buscarTramipresu = {
                  desdeNum: buscaDesdeNum,
                  hastaNum: this.f['numero'].value,
                  desdeFecha: year.toString() + "-01-01",
                  hastaFecha: year.toString() + "-12-31",
               };
               sessionStorage.setItem("buscarTramipresu", JSON.stringify(buscarTramipresu));
               this.authService.swal('success', `Trámite ${nuevo.numero} guardado con éxito`);
               sessionStorage.setItem('ultidtrami', nuevo.idtrami.toString());
               //Abre partidas del trámite
               const datosToPrmisoxtrami = {
                  idtrami: nuevo.idtrami,
                  desdeNum: buscaDesdeNum,
                  hastaNum: this.f['numero'].value
               };
               sessionStorage.setItem('datosToPrmisoxtrami', JSON.stringify(datosToPrmisoxtrami));
               this.router.navigate(['prmisoxtrami']);
            },
            error: err => { console.error(err.error); this.authService.mostrarError('Error al guardar el Trámite', err.error) }
         });
      });
   }

   regresar() { this.router.navigate(['tramipresu']); }

   //Valida Numero
   valNumero(control: AbstractControl) {
      return this.tramiService.valNumero(control.value).pipe(
         map(result => result ? { existe: true } : null)
      );
   }

   // Al guardar Valida el número nuevamente
   validaNumeroAntesDeGuardar(): Observable<boolean> {
      const valor = this.formTramipresu.get('numero')?.value;
      if (valor === null || valor === undefined || valor === '') { return of(true); }
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

export interface TramipresuCreateDTO {
   numero: number;
   fecha: Date;
   intdoc: { intdoc: number };
   numdoc: String;
   fecdoc: Date;
   idbene: { idbene: number | null };
   descri: String;
   totmiso: number;
   swreinte: number;
   usucrea: number;
   feccrea: Date;
}