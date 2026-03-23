import { Component, OnInit } from '@angular/core';
import { AbstractControl, AsyncValidatorFn, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { BeneficiariosService } from 'src/app/servicios/contabilidad/beneficiarios.service';
import { CertipresuService } from 'src/app/servicios/contabilidad/certipresu.service';
import { DocumentosService } from 'src/app/servicios/administracion/documentos.service';
import { catchError, map, Observable, of } from 'rxjs';
import { Documentos } from 'src/app/modelos/administracion/documentos.model';
import { Beneficiarios } from 'src/app/modelos/contabilidad/beneficiarios.model';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { Certipresu } from 'src/app/modelos/contabilidad/certipresu.model';

@Component({
   selector: 'app-add-certipresu',
   templateUrl: './add-certipresu.component.html',
   styleUrls: ['./add-certipresu.component.css'],
})

export class AddCertipresuComponent implements OnInit {

   formCertipresu: FormGroup;
   documentos: Documentos[] = [];
   beneficiarios: Beneficiarios[] = [];
   idbene: number | null = 1;
   responsables: Beneficiarios[] = [];
   idbeneres: number | null;
   inicioFormulario: number = 0;
   tiempoTranscurrido: number = 0;

   constructor(private beneService: BeneficiariosService, private router: Router, public authService: AutorizaService,
      private fb: FormBuilder, private docuService: DocumentosService, private certiService: CertipresuService) { }

   ngOnInit(): void {
      if (!this.authService.sessionlog) { this.router.navigate(['/inicio']); }
      sessionStorage.setItem('ventana', '/certipresu');
      let coloresJSON = sessionStorage.getItem('/certipresu');
      if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));

      this.formCertipresu = this.fb.group({
         numero: ['', [Validators.required, Validators.min(1)], this.valNumero()],
         fecha: ['', Validators.required, this.valAño()],
         intdoc: this.documentos,
         numdoc: ['', Validators.required],
         idbene: ['(Ninguno)', Validators.required, this.valBenefi()],
         idbeneres: ['', Validators.required, this.valResponsa()],
         descripcion: [],
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

   listarDocumentos() {
      this.docuService.getListaDocumentos().subscribe({
         next: (documentos: Documentos[]) => {
            this.documentos = documentos;
            this.f['intdoc'].setValue(1)
         },
         error: (err) => console.error(err.error)
      });
   }

   ultimo() {
      this.certiService.ultima(1).subscribe({
         next: resp => {
            let x = resp.numero + 1;
            this.formCertipresu.patchValue({ numero: x, fecha: resp.fecha });
         },
         error: err => { console.error(err.error); this.authService.mostrarError('Error al buscar el Ultimo', err.error) }
      });
   }

   benefixNombre(e: any) {
      if (e.target.value != '') {
         this.beneService.findByNomben(e.target.value).subscribe({
            next: datos => this.beneficiarios = datos,
            error: err => console.error(err.error),
         });
      }
   }
   onBeneficiarioSelected(e: any) {
      const selectedOption = this.beneficiarios.find((x: { nomben: any; }) => x.nomben === e.target.value);
      if (selectedOption) this.idbene = selectedOption.idbene;
      else this.idbene = null;
   }

   responsaxNombre(e: any) {
      if (e.target.value != '') {
         this.beneService.findByNomben(e.target.value).subscribe({
            next: (responsables: Beneficiarios[]) => this.responsables = responsables,
            error: err => console.error(err.error),
         });
      }
   }
   onResponsableSelected(e: any) {
      const selectedOption = this.responsables.find((x: { nomben: any; }) => x.nomben === e.target.value);
      if (selectedOption) this.idbeneres = selectedOption.idbene;
      else this.idbeneres = null;
   }

   get f() { return this.formCertipresu.controls; }

   onSubmit() {
      // Vuelve a validar el número (Mientras toman café ...)
      this.validaNumeroAntesDeGuardar().subscribe(esValido => {
         if (!esValido) {
            const fin = Date.now();
            this.tiempoTranscurrido = fin - this.inicioFormulario;
            this.authService.mensaje404(`La Certificación ${this.formCertipresu.value.numero} ya fue creada por otro Usuario. 
               Tiempo transcurrido: ${this.authService.formatearTiempo(this.tiempoTranscurrido)}`);
            return;
         }
         const dto: CertipresuCreateDTO = {
            tipo: 1,
            valor: 0,
            numero: this.formCertipresu.value.numero,
            fecha: this.formCertipresu.value.fecha,
            intdoc: { intdoc: this.formCertipresu.value.intdoc },
            numdoc: this.formCertipresu.value.numdoc,
            idbene: { idbene: this.idbene },
            idbeneres: { idbene: this.idbeneres },
            descripcion: this.formCertipresu.value.descripcion,
            usucrea: this.authService.idusuario,
            feccrea: new Date(),
         };
         // Guarda
         this.certiService.saveCertipresu(dto).subscribe({
            next: (certi: Certipresu) => {
               this.authService.swal('success', `Certificación ${certi.numero} guardada con éxito`);
               sessionStorage.setItem('ultidcerti', certi.idcerti.toString());
               //Actualiza los datos de búsqueda para que se muestre en la lista de certificaciones
               let buscaDesdeNum = this.f['numero'].value - 16;
               if (buscaDesdeNum <= 0) buscaDesdeNum = 1;
               let year = new Date(this.f['fecha'].value).getFullYear(); // Extraer el año de la fecha 
               const buscarCertipresu = {
                  desdeNum: buscaDesdeNum,
                  hastaNum: this.f['numero'].value,
                  desdeFecha: year.toString() + "-01-01",
                  hastaFecha: year.toString() + "-12-31",
               };
               sessionStorage.setItem("buscarCertipresu", JSON.stringify(buscarCertipresu));
               //Datos a enviar a partixcerti
               const datosToPartixcerti = {
                  idcerti: certi.idcerti,
                  desdeNum: buscaDesdeNum,
                  hastaNum: this.f['numero'].value
               };
               sessionStorage.setItem('datosToPartixcerti', JSON.stringify(datosToPartixcerti));
               this.router.navigate(['partixcerti']);
            },
            error: err => { console.error('Al guardar la Certificación: ', err.error); this.authService.mostrarError('Error al guardar', err.error) }
         });
      });
   }

   regresar() { this.router.navigate(['/certipresu']); }

   // Valida el número
   valNumero(): AsyncValidatorFn {
      return (control: AbstractControl) => {
         const valor = control.value;
         if (valor === null || valor === undefined || valor === '') { return of(null); }
         return this.certiService.valNumero(valor, 1).pipe(
            map(existe => (existe ? { existe: true } : null)),
            catchError(() => of(null))
         );
      };
   }

   // Al guardar Valida el número nuevamente
   validaNumeroAntesDeGuardar(): Observable<boolean> {
      const valor = this.formCertipresu.get('numero')?.value;
      if (valor === null || valor === undefined || valor === '') { return of(true); }
      return this.certiService.valNumero(valor, 1).pipe(
         map(existe => !existe),
         catchError(() => of(true))
      );
   }

   //Valida el año de la fecha
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
      return (_control: AbstractControl) => {
         if (this.idbene == null) { return of({ invalido: true }); }
         return of(null);
      };
   }

   //Valida que se haya seleccionado un Responsable
   valResponsa(): AsyncValidatorFn {
      return (_control: AbstractControl) => {
         if (this.idbeneres == null) { return of({ invalido: true }); }
         return of(null);
      };
   }

}

export interface CertipresuCreateDTO {
   tipo: number;
   numero: number;
   fecha: Date;
   valor: number;
   descripcion: String;
   numdoc: String;
   usucrea: number;
   feccrea: Date;
   idbene: { idbene: number | null };
   idbeneres: { idbene: number | null };
   intdoc: { intdoc: number };
}