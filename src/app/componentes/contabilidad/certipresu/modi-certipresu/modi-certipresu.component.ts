import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { BeneficiariosService } from 'src/app/servicios/contabilidad/beneficiarios.service';
import { CertipresuService } from 'src/app/servicios/contabilidad/certipresu.service';
import { DocumentosService } from 'src/app/servicios/administracion/documentos.service';
import { Documentos } from 'src/app/modelos/administracion/documentos.model';
import { Beneficiarios } from 'src/app/modelos/contabilidad/beneficiarios.model';
import { map } from 'rxjs';

@Component({
   selector: 'app-modi-certipresu',
   templateUrl: './modi-certipresu.component.html',
   styleUrls: ['./modi-certipresu.component.css'],
})

export class ModiCertipresuComponent implements OnInit {

   formCertipresu: FormGroup;
   gruben: number = 4;
   _responsables: any;
   _beneficiarios: any;
   _documentos: any;
   idcerti: number;
   antnumero: number;
   swmodibene: boolean = false;
   antidbene: number;
   swmodiresp: boolean = false;
   antidbeneres: number;

   beneficiario: Beneficiarios = new Beneficiarios;
   responsable: Beneficiarios = new Beneficiarios;

   constructor(private beneService: BeneficiariosService, private router: Router, private fb: FormBuilder,
      private docuService: DocumentosService, private certiService: CertipresuService) { }

   ngOnInit(): void {
      this.idcerti = +sessionStorage.getItem("idcertiToModi")!;
      let documento: Documentos = new Documentos;
      this.formCertipresu = this.fb.group({
         tipo: 1,
         numero: [null, [Validators.required, Validators.min(1)], this.valNumero.bind(this) ],
         valor: 0,
         fecha: [],
         iddocumento: documento,
         numdoc: [null, [Validators.required, Validators.minLength(1) ]],
         idbene: [null, Validators.required],
         idbeneres: [null, Validators.required],
         descripcion: [],
         usucrea: 1,
         feccrea: [],
         usumodi: [],
         fecmodi: [],
      });
      this.datosCertipresu();
      this.listarDocumentos();
   }

   datosCertipresu() {
      this.certiService.getById(this.idcerti).subscribe({
         next: datos => {
            this.antnumero = datos.numero;
            this.antidbene = datos.idbene.idbene;
            this.antidbeneres = datos.idbeneres.idbene;
            this.formCertipresu.setValue({
               tipo: datos.tipo,
               numero: datos.numero,
               fecha: datos.fecha,
               valor: datos.valor,
               descripcion: datos.descripcion,
               numdoc: datos.numdoc,
               idbene: datos.idbene.nomben,
               idbeneres: datos.idbeneres.nomben,
               iddocumento: datos.iddocumento,
               usucrea: datos.usucrea,
               feccrea: datos.feccrea,
               usumodi: datos.usumodi,
               fecmodi: datos.fecmodi,
            })
         },
         error: err => console.log(err.error)
      });
   }

   listarxNombre(e: any) {
      if (e.target.value != '') {
         this.beneService.findByNombre(e.target.value).subscribe({
            next: datos => {
               this.swmodibene = true;
               this._beneficiarios = datos;
            },
            error: err => console.error(err.error),
         });
      }
   }

   listarResponsables(e: any) {
      if (e.target.value != '') {
         this.beneService
            .findByGrupo(e.target.value, this.gruben)
            .subscribe({
               next: datos => {
                  this.swmodiresp = true;
                  this._responsables = datos;
               },
               error: err => console.error(err.error),
            });
      }
   }

   get f() { return this.formCertipresu.controls; }

   onSubmit() {
      if(this.swmodibene) this.beneficiario.idbene = this._beneficiarios[0].idbene;
      else this.beneficiario.idbene = this.antidbene;
      this.formCertipresu.value.idbene = this.beneficiario;

      if(this.swmodiresp) this.responsable.idbene = this._responsables[0].idbene;
      else this.responsable.idbene = this.antidbeneres;
      this.formCertipresu.value.idbeneres = this.responsable;
      this.saveCetiPresu();
   }

   saveCetiPresu() {
      this.certiService.updateCerti(this.idcerti, this.formCertipresu.value).subscribe({
         next: datos => {
            this.retornar();
         },
         error: err => console.error(err.error),
      });
   }

   listarDocumentos() {
      this.docuService.getListaDocumentos().subscribe({
         next: datos => {
            this._documentos = datos;
         },
         error: err => console.error(err.error),
      });
   }

   compararDocumentos(o1: Documentos, o2: Documentos): boolean {
      if (o1 === undefined && o2 === undefined) {
         return true;
      } else {
         return o1 === null || o2 === null || o1 === undefined || o2 === undefined
            ? false
            : o1.iddocumento === o2.iddocumento;
      }
   }

   retornar() { this.router.navigate(['/certipresu']); }

   valNumero(control: AbstractControl) {
      return this.certiService.getNumero(control.value)
         .pipe(
            map(result => result != null && control.value != this.antnumero ? { existe: true } : null)
         );
   }

}
