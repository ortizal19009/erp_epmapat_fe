import { Component, OnInit } from '@angular/core';
import { AbstractControl, AsyncValidatorFn, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { catchError, map, Observable, of } from 'rxjs';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { Documentos } from 'src/app/modelos/administracion/documentos.model';
import { Beneficiarios } from 'src/app/modelos/contabilidad/beneficiarios.model';
import { Certipresu } from 'src/app/modelos/contabilidad/certipresu.model';
import { DocumentosService } from 'src/app/servicios/administracion/documentos.service';
import { BeneficiariosService } from 'src/app/servicios/contabilidad/beneficiarios.service';
import { CertipresuService } from 'src/app/servicios/contabilidad/certipresu.service';
import { PartixcertiService } from 'src/app/servicios/contabilidad/partixcerti.service';

@Component({
  selector: 'app-modi-reintegrada',
  templateUrl: './modi-reintegrada.component.html',
  styleUrls: ['./modi-reintegrada.component.css']
})
export class ModiReintegradaComponent implements OnInit {

   formReintegrada: FormGroup;
   documentos: Documentos[] = [];
   intdoc: number;
   responsables: Beneficiarios[] = [];;
   idbeneres: number | null;
   idcerti: number;
   antnumero: number;
   partidas: number = 0;

   constructor(private router: Router, private fb: FormBuilder, private beneService: BeneficiariosService,
      private docuService: DocumentosService, private reinteService: CertipresuService, public authService: AutorizaService,
      private parxcerService: PartixcertiService) { }

   ngOnInit(): void {
      if (!this.authService.sessionlog) { this.router.navigate(['/inicio']); }
      sessionStorage.setItem('ventana', '/reintegradas');
      let coloresJSON = sessionStorage.getItem('/reintegradas');
      if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));

      this.idcerti = +sessionStorage.getItem("idcertiToModi")!;
      this.formReintegrada = this.fb.group({
         numero: [null, [Validators.required, Validators.min(1)], this.valNumero()],
         fecha: ['', Validators.required, this.valAño()],
         intdoc: this.documentos,
         numdoc: [null, Validators.required],
         idbeneres: [null, Validators.required, this.valResponsa()],
         descripcion: [],
      }, { updateOn: "blur" });

      this.datosReintegrada();
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

   get f() { return this.formReintegrada.controls; }

   datosReintegrada() {
      this.reinteService.getById(this.idcerti).subscribe({
         next: (reintegrada: Certipresu) => {
            this.antnumero = reintegrada.numero;
            this.intdoc = reintegrada.intdoc.intdoc;
            this.idbeneres = reintegrada.idbeneres.idbene;
            this.formReintegrada.patchValue({
               numero: reintegrada.numero,
               fecha: reintegrada.fecha,
               intdoc: reintegrada.intdoc.intdoc,
               numdoc: reintegrada.numdoc,
               idbene: reintegrada.idbene.nomben,
               idbeneres: reintegrada.idbeneres.nomben,
               descripcion: reintegrada.descripcion,
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
      const dto: ReintegradaUpdateDTO = {};   // Todos los campos opcionales
      if (this.f['numero'].dirty) { dto.numero = this.f['numero'].value; }
      if (this.f['fecha'].dirty) { dto.fecha = this.f['fecha'].value; }
      if (this.f['intdoc'].dirty) { dto.intdoc = { intdoc: this.f['intdoc'].value }; }
      if (this.f['numdoc'].dirty) { dto.numdoc = this.f['numdoc'].value; }
      // if (this.f['idbene']?.dirty) { dto.idbene = { idbene: this.idbene }; }
      if (this.f['idbeneres']?.dirty) { dto.idbeneres = { idbene: this.idbeneres }; }
      if (this.f['descripcion'].dirty) { dto.descripcion = this.f['descripcion'].value; }
      dto.usumodi = this.authService.idusuario;
      dto.fecmodi = new Date();
      this.reinteService.updateCertipresu(this.idcerti, dto).subscribe({
         next: (actualizada: Certipresu) => {
            this.authService.swal('success', `Reintegro de Certificación ${actualizada.numero} actualizado con éxito`);
            this.retornar();
         },
         error: err => { console.error('Al actualizar: ', err.error); this.authService.mostrarError('Error al actualizar', err.error) }
      });
   }

   retornar() { this.router.navigate(['/reintegradas']); }

   // Valida el número
   valNumero(): AsyncValidatorFn {
      return (control: AbstractControl) => {
         const valor = control.value;
         if (valor === null || valor === undefined || valor === '') { return of(null); }
         return this.reinteService.valNumero(valor, 1).pipe(
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

   //Valida que se haya seleccionado un Responsable
   valResponsa(): AsyncValidatorFn {
      return (_control: AbstractControl) => {
         if (this.idbeneres == null) { return of({ invalido: true }); }
         return of(null);
      };
   }

}

export interface ReintegradaUpdateDTO {
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