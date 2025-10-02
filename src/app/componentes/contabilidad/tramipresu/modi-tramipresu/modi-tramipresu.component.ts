import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { map } from 'rxjs';
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
      private docuService: DocumentosService, private tramiService: TramipresuService) { }

   ngOnInit(): void {
      sessionStorage.setItem('ventana', '/tramipresu');
      let coloresJSON = sessionStorage.getItem('/tramipresu');
      if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));

      this.idcerti = +sessionStorage.getItem("idtramiToModi")!;
      let documento: Documentos = new Documentos;
      this.formTramipresu = this.fb.group({
         numero: [null, [Validators.required, Validators.min(1)], this.valNumero.bind(this)],
         fecha: [],
         intdoc: documento,
         numdoc: [null, [Validators.required, Validators.minLength(1)]],
         fecdoc: [null, [Validators.required]],
         idbene: [null, Validators.required],
         descri: [],
         usucrea: 1,
         feccrea: [],
         usumodi: [],
         fecmodi: [],
      });
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

   datosCertipresu() {
      this.tramiService.findById(this.idcerti).subscribe({
         next: datos => {
            this.antnumero = datos.numero;
            this.antidbene = datos.idbene.idbene;
            this.formTramipresu.patchValue({
               numero: datos.numero,
               fecha: datos.fecha,
               descri: datos.descri,
               numdoc: datos.numdoc,
               fecdoc: datos.fecdoc,
               idbene: datos.idbene.nomben,
               intdoc: datos.intdoc,
               usucrea: datos.usucrea,
               feccrea: datos.feccrea,
               usumodi: datos.usumodi,
               fecmodi: datos.fecmodi,
            })
         },
         error: err => console.error(err.error)
      });
   }

   listarxNombre(e: any) {
      if (e.target.value != '') {
         this.beneService.findByNomben(e.target.value).subscribe({
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
            // .findByGrupo(e.target.value, this.gruben)
            .findByNomben(e.target.value)
            .subscribe({
               next: datos => {
                  this.swmodiresp = true;
                  this._responsables = datos;
               },
               error: err => console.error(err.error),
            });
      }
   }

   onSubmit() {
      if (this.swmodibene) this.beneficiario.idbene = this._beneficiarios[0].idbene;
      else this.beneficiario.idbene = this.antidbene;
      this.formTramipresu.value.idbene = this.beneficiario;

      if (this.swmodiresp) this.responsable.idbene = this._responsables[0].idbene;
      else this.responsable.idbene = this.antidbeneres;
      this.formTramipresu.value.idbeneres = this.responsable;
      this.saveCetiPresu();
   }

   saveCetiPresu() {
      this.tramiService.saveTramipresu(this.formTramipresu.value).subscribe({
         next: datos => this.regresar(),
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
            : o1.intdoc === o2.intdoc;
      }
   }

   regresar() { this.router.navigate(['/tramipresu']); }

   valNumero(control: AbstractControl) {
      return this.tramiService.valNumero(control.value)
         .pipe(
            map(result => result != null && control.value != this.antnumero ? { existe: true } : null)
         );
   }

   get f() { return this.formTramipresu.controls; }

}
