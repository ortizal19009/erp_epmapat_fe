import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { map, of } from 'rxjs';
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
   _documentos: any;
   _beneficiarios: any[] = [];
   date: Date = new Date();
   idbene: number | null;

   documento: Documentos = new Documentos;
   beneficiario: Beneficiarios = new Beneficiarios;
   
   constructor(
      private s_documentos: DocumentosService, private fb: FormBuilder, private router: Router,
      public authService: AutorizaService, private tramiService: TramipresuService, private beneService: BeneficiariosService) { }

   ngOnInit(): void {
      sessionStorage.setItem('ventana', '/tramipresu');
      let coloresJSON = sessionStorage.getItem('/tramipresu');
      if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));

      this.formTramipresu = this.fb.group({
         numero: ['', [Validators.required, Validators.min(1)], this.valNumero.bind(this)],
         fecha: ['', [Validators.required], this.valFecha.bind(this)],
         intdoc: '',
         numdoc: ['', Validators.required],
         fecdoc: ['', Validators.required],
         totmiso: 0,
         idbene: ['', [Validators.required], [this.valBenefi.bind(this)] ],
         descripcion: '',
         swreinte: 0,
         usucrea: 1,
         feccrea: this.date
      },
         { updateOn: "blur" });

      this.listarDocumentos();
      this.setValores();
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

   setValores() {
      this.tramiService.ultimoTramipresu().subscribe({
         next: datos => {
            this.formTramipresu.patchValue({
               numero: +datos.numero! + 1,
               fecha: datos.fecha,
               fecdoc: datos.fecha,
            });
         },
         error: err => console.error(err.error),
      });
   }

   listarDocumentos() {
      this.s_documentos.getListaDocumentos().subscribe({
         next: datos => {
            this._documentos = datos;
            this.formTramipresu.controls['intdoc'].setValue(1);
         },
         error: err => console.error(err.error),
      });
   }

   benefixNombre(e: any) {
      if (e.target.value != '') {
         this.beneService.findByNomben(e.target.value).subscribe({
            next: datos => this._beneficiarios = datos,
            error: err => console.error(err.error),
         });
      }
   }
   onBenefiSelected(e: any) {
      const selectedOption = this._beneficiarios.find((x: { nomben: any; }) => x.nomben === e.target.value);
      if (selectedOption) this.idbene = selectedOption.idbene;
      else this.idbene = null;
   }

   guardar() {
      this.documento.intdoc = this.formTramipresu.value.intdoc
      this.formTramipresu.value.intdoc = this.documento;

      this.beneficiario.idbene = this.idbene!;
      this.formTramipresu.value.idbene = this.beneficiario;

      this.tramiService.saveTramipresu(this.formTramipresu.value).subscribe({
         next: datos => this.router.navigate(['tramipresu']),
         error: err => console.error(err.error),
      });
   }

   regresar() { this.router.navigate(['tramipresu']); }

   //Valida Numero
   valNumero(control: AbstractControl) {
      return this.tramiService.valNumero(control.value).pipe(
         map(result => result ? { existe: true } : null)
      );
   }

   //Valida periodo
   valFecha(control: AbstractControl) {
      // let anio  = control.value.slice(0,4)
      // console.log('fecha en valFecha: ', fecha )
      if ( control.value.slice(0,4)  != 2024) return of({ 'invalido': true });
      else return of(null);
   }

   //Valida que se haya seleccionado un Beneficiario
   valBenefi(control: AbstractControl) {
      if (this.idbene == null) return of({ 'invalido': true });
      else return of(null);
   }

}
