import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { BeneficiariosService } from 'src/app/servicios/contabilidad/beneficiarios.service';
import { CertipresuService } from 'src/app/servicios/contabilidad/certipresu.service';
import { DocumentosService } from 'src/app/servicios/administracion/documentos.service';
import { Documentos } from 'src/app/modelos/administracion/documentos.model';
import { Beneficiarios } from 'src/app/modelos/contabilidad/beneficiarios.model';
import { map } from 'rxjs';
import { PartixcertiService } from 'src/app/servicios/contabilidad/partixcerti.service';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { Certipresu } from 'src/app/modelos/contabilidad/certipresu.model';

@Component({
   selector: 'app-modi-certipresu',
   templateUrl: './modi-certipresu.component.html',
   styleUrls: ['./modi-certipresu.component.css'],
})

export class ModiCertipresuComponent implements OnInit {

   formCertipresu: FormGroup;
   documentos: Documentos[] = [];
   intdoc: number;
   beneficiarios: Beneficiarios[] = [];
   idbene: number | null;
   responsables: Beneficiarios[] = [];;
   idbeneres: number | null;
   idcerti: number;
   antnumero: number;
   partidas: number = 0;

   constructor(private beneService: BeneficiariosService, private router: Router, private fb: FormBuilder,
      private docuService: DocumentosService, private certiService: CertipresuService, public authService: AutorizaService,
      private parxcerService: PartixcertiService) { }

   ngOnInit(): void {
      if (!this.authService.sessionlog) { this.router.navigate(['/inicio']); }
      sessionStorage.setItem('ventana', '/certipresu');
      let coloresJSON = sessionStorage.getItem('/certipresu');
      if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));

      this.idcerti = +sessionStorage.getItem("idcertiToModi")!;
      this.formCertipresu = this.fb.group({
         numero: [null, [Validators.required, Validators.min(1)], this.valNumero()],
         fecha: ['', Validators.required, this.valAño()],
         intdoc: this.documentos,
         numdoc: [null, Validators.required],
         idbene: [null, Validators.required, this.valBenefi()],
         idbeneres: [null, Validators.required, this.valResponsa()],
         descripcion: [],
      }, { updateOn: "blur" });

      this.datosCertipresu();
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
         next: (documentos: Documentos[]) => {
            this.documentos = documentos;
            const encontrado = documentos.find(d => d.intdoc === this.intdoc);
            if (encontrado) { this.f['intdoc'].setValue(encontrado.intdoc); }
         },
         error: err => console.error(err.error),
      });
   }

   datosCertipresu() {
      this.certiService.getById(this.idcerti).subscribe({
         next: (certi: Certipresu) => {
            this.antnumero = certi.numero;
            this.intdoc = certi.intdoc.intdoc;
            this.idbene = certi.idbene.idbene;
            this.idbeneres = certi.idbeneres.idbene;
            this.formCertipresu.patchValue({
               numero: certi.numero,
               fecha: certi.fecha,
               intdoc: certi.intdoc.intdoc,
               numdoc: certi.numdoc,
               idbene: certi.idbene.nomben,
               idbeneres: certi.idbeneres.nomben,
               descripcion: certi.descripcion,
            });
            this.parxcerService.countByIdcerti(this.idcerti).subscribe({
               next: partidas => {
                  this.partidas = partidas;
               },
               error: err => { console.error(err.error); this.authService.mostrarError('Error al contar las Partidas', err.error) }
            });
         },
         error: err => console.error(err.error)
      });
   }

   get f() { return this.formCertipresu.controls; }

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

   onSubmit() {
      const dto: CertipresuUpdateDTO = {};   // Todos los campos opcionales
      if (this.f['numero'].dirty) { dto.numero = this.f['numero'].value; }
      if (this.f['fecha'].dirty) { dto.fecha = this.f['fecha'].value; }
      if (this.f['intdoc'].dirty) { dto.intdoc = { intdoc: this.f['intdoc'].value }; }
      if (this.f['numdoc'].dirty) { dto.numdoc = this.f['numdoc'].value; }
      if (this.f['idbene']?.dirty) { dto.idbene = { idbene: this.idbene }; }
      if (this.f['idbeneres']?.dirty) { dto.idbeneres = { idbene: this.idbeneres }; }
      if (this.f['descripcion'].dirty) { dto.descripcion = this.f['descripcion'].value; }
      dto.usumodi = this.authService.idusuario;
      dto.fecmodi = new Date();
      this.certiService.updateCertipresu(this.idcerti, dto).subscribe({
         next: (actualizada: Certipresu) => {
            this.authService.swal('success', `Certificación ${actualizada.numero} actualizada con éxito`);
            this.retornar();
         },
         error: err => { console.error('Al actualizar la Certificación: ', err.error); this.authService.mostrarError('Error al actualizar', err.error) }
      });
   }

   retornar() { this.router.navigate(['/certipresu']); }

   // Valida el número
   valNumero(): AsyncValidatorFn {
      return (control: AbstractControl) => {
         const valor = control.value;
         if (valor === null || valor === undefined || valor === '') { return of(null); }
         return this.certiService.valNumero(valor, 1).pipe(
            map(existe => {
               if (existe && valor !== this.antnumero) { return { existe: true }; }
               return null;
            }),
            catchError(() => of(null))
         );
      };
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

export interface CertipresuUpdateDTO {
   numero?: number;
   fecha?: Date;
   descripcion?: String;
   intdoc?: { intdoc: number };
   numdoc?: String;
   idbene?: { idbene: number | null };
   idbeneres?: { idbene: number | null };
   usumodi?: number;
   fecmodi?: Date;
}