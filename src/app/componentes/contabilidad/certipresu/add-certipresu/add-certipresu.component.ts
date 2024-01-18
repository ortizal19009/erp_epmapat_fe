import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { BeneficiariosService } from 'src/app/servicios/contabilidad/beneficiarios.service';
import { CertipresuService } from 'src/app/servicios/contabilidad/certipresu.service';
import { DocumentosService } from 'src/app/servicios/administracion/documentos.service';
import { map, of } from 'rxjs';
import { Documentos } from 'src/app/modelos/administracion/documentos.model';
import { Beneficiarios } from 'src/app/modelos/contabilidad/beneficiarios.model';

@Component({
   selector: 'app-add-certipresu',
   templateUrl: './add-certipresu.component.html',
   styleUrls: ['./add-certipresu.component.css'],
})

export class AddCertipresuComponent implements OnInit {

   formCertipresu: FormGroup;
   _documentos: any[] = [];
   idgrupoResp: number = 1;
   _beneficiarios: any[] = [];
   idbene: number | null = 1;
   _responsables: any[] = [];
   idbeneres: number | null;
   date: Date = new Date();

   beneficiario: Beneficiarios = new Beneficiarios;
   responsable: Beneficiarios = new Beneficiarios;
   documento: Documentos = new Documentos;

   constructor(private beneService: BeneficiariosService, private router: Router,
      private fb: FormBuilder, private docuService: DocumentosService, private certiService: CertipresuService) { }

   ngOnInit(): void {
      this.documento.iddocumento = 1;
      this.formCertipresu = this.fb.group({
         tipo: 1,
         numero: ['', [Validators.required, Validators.min(1)], this.valNumero.bind(this)],
         valor: 0,
         fecha: [],
         iddocumento: this.documento,
         numdoc: ['', [Validators.required]],
         idbene: ['(Ninguno)', [Validators.required], [this.valBenefi.bind(this)] ],
         idbeneres: ['', [Validators.required], [this.valResponsa.bind(this)] ],
         descripcion: [],
         usucrea: 1,
         feccrea: this.date,
         usumodi: [],
         fecmodi: [],
      },
         { updateOn: "blur" });

      this.listarDocumentos();
      this.ultimo();

   }

   listarDocumentos() {
      console.log('Inicia listarDocumentos')
      this.docuService.getListaDocumentos().subscribe({
         next: (datos) => {
            this._documentos = datos;
            this.formCertipresu.controls['iddocumento'].setValue(1);
         },
         error: (err) => console.error(err.error)
      });
   }

   ultimo() {
      this.certiService.ultimo().subscribe({
         next: datos => {
            let x = datos.numero + 1;
            this.formCertipresu.patchValue({ numero: x, fecha: datos.fecha });
         },
         error: err => console.error(err.error),
      });
   }

   benefixNombre(e: any) {
      if (e.target.value != '') {
         this.beneService.findByNombre(e.target.value).subscribe({
            next: datos => this._beneficiarios = datos,
            error: err => console.error(err.error),
         });
      }
   }
   onBeneficiarioSelected(e: any) {
      const selectedOption = this._beneficiarios.find((x: { nomben: any; }) => x.nomben === e.target.value);
      if (selectedOption) this.idbene = selectedOption.idbene;
      else this.idbene = null;
      // console.log('this.idbene:', this.idbene);
   }

   responsaxNombre(e: any) {
      if (e.target.value != '') {
         this.beneService.findByGrupo(e.target.value, this.idgrupoResp).subscribe({
            next: datos => {
               this._responsables = datos;
            },
            error: err => console.error(err.error),
         });
      }
   }
   onResponsableSelected(e: any) {
      const selectedOption = this._responsables.find((x: { nomben: any; }) => x.nomben === e.target.value);
      if (selectedOption) this.idbeneres = selectedOption.idbene;
      else this.idbeneres = null;
      // console.log('this.idbeneres:', this.idbene);
   }

   get f() { return this.formCertipresu.controls; }

   onSubmit() {
      this.documento.iddocumento = this.formCertipresu.value.iddocumento
      this.formCertipresu.value.iddocumento = this.documento;
      this.beneficiario.idbene = this.idbene!;
      this.formCertipresu.value.idbene = this.beneficiario;
      this.responsable.idbene = this.idbeneres!;
      this.formCertipresu.value.idbeneres = this.responsable;

      this.certiService.saveCertiPresu(this.formCertipresu.value).subscribe({
         next: datos => {
            let buscaDesdeNum = this.f['numero'].value - 10;
            if (buscaDesdeNum <= 0) buscaDesdeNum = 1;
            sessionStorage.setItem('buscaDesdeNum', buscaDesdeNum.toString());
            sessionStorage.setItem('buscaHastaNum', this.f['numero'].value);
            this.regresar();
         },
         error: err => console.error(err.error),
      });
   }

   regresar() { this.router.navigate(['/certipresu']); }

   valNumero(control: AbstractControl) {
      return this.certiService.getNumero(control.value)
         .pipe(
            map(result => result != null ? { existe: true } : null)
         );
   }

   //Valida que se haya seleccionado un Beneficiario
   valBenefi(control: AbstractControl) {
      if (this.idbene == null) return of({ 'invalido': true });
      else return of(null);
   }

   //Valida que se haya seleccionado un Responsable
   valResponsa(control: AbstractControl) {
      if (this.idbeneres == null) return of({ 'invalido': true });
      else return of(null);
   }

}
