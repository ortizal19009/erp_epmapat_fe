import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { Documentos } from 'src/app/modelos/administracion/documentos.model';
import { DocumentosService } from 'src/app/servicios/administracion/documentos.service';
import { BeneficiariosService } from 'src/app/servicios/contabilidad/beneficiarios.service';
import { EjecucionService } from 'src/app/servicios/contabilidad/ejecucion.service';
import { TramipresuService } from 'src/app/servicios/contabilidad/tramipresu.service';

@Component({
   selector: 'app-add-tramipresu',
   templateUrl: './add-tramipresu.component.html',
   styleUrls: ['./add-tramipresu.component.css']
})

export class AddTramipresuComponent implements OnInit {

   formTramipresu: FormGroup;
   documentos: any;
   _beneficiarios: any[] = [];
   titulo: string = 'Nuevo Trámite Presupuestario (compromiso)';
   date: Date = new Date();
   today: number = Date.now();
   idbene: number | null;

   constructor(
      private s_documentos: DocumentosService, private fb: FormBuilder,
      private s_tramipresu: TramipresuService, private beneService: BeneficiariosService,
      private s_ejecucion: EjecucionService, private router: Router) { }

   ngOnInit(): void {
      this.setcolor();
      const fecha = new Date();
      const año = fecha.getFullYear();
      this.formTramipresu = this.fb.group({
         numero: '',
         fecha: '',
         iddocumento: '',
         numdoc: '',
         fecdoc: '',
         totmiso: 0,
         idbene: ['', [Validators.required], [this.valBenefi.bind(this)]],
         descripcion: '',
         swreinte: true,
         usucrea: 1,
         feccrea: this.date
      },
      { updateOn: "blur" });

      this.listarDocumentos();
      this.setValores();
      // this.listarBene('ninguno');
   }

   setcolor() {
      let colores: string[];
      let coloresJSON = sessionStorage.getItem('/tramipresu');
      if (!coloresJSON) {
         colores = ['rgb(70, 70, 70)', 'rgb(186, 186, 186)'];
         const coloresJSON = JSON.stringify(colores);
         sessionStorage.setItem('/tramipresu', coloresJSON);
      } else colores = JSON.parse(coloresJSON);

      document.documentElement.style.setProperty('--bgcolor1', colores[0]);
      const cabecera = document.querySelector('.cabecera');
      if (cabecera) cabecera.classList.add('nuevoBG1')
      document.documentElement.style.setProperty('--bgcolor2', colores[1]);
      const detalle = document.querySelector('.detalle');
      if (detalle) detalle.classList.add('nuevoBG2');
   }

   onSubmit() {
      this.formTramipresu.value.idbene = this.idbene;
      console.log(this.formTramipresu.value);
      this.guardatTramipresu();
   }

   compareDocumentos(o1: Documentos, o2: Documentos): boolean {
      if (o1 === undefined && o2 === undefined) {
         return true;
      } else {
         return o1 === null || o2 === null || o1 === undefined || o2 === undefined
            ? false
            : o1.iddocumento == o2.iddocumento;
      }
   }

   get f() { return this.formTramipresu.controls; }

   setValores() {
      this.s_tramipresu.findMax().subscribe({
         next: (datos) => {
            this.formTramipresu.patchValue({
               numero: +datos.numero! + 1,
               fecha: datos.fecha,
               fecdoc: datos.fecha,
            });
         },
         error: (e) => console.error(e),
      });
   }

   // listarBeneficiarios(e: any) {
   //    this.listarBene(e.target.value);
   // }

   // listarBene(nomben: string) {
   //    this.beneService.findByNombre(nomben).subscribe({
   //       next: (datos) => {
   //          this._beneficiarios = datos;
   //       },
   //       error: (e) => console.error(e),
   //    });
   // }

   listarDocumentos() {
      this.s_documentos.getListaDocumentos().subscribe({
         next: (datos) => {
            this.documentos = datos;
            this.formTramipresu.patchValue({ iddocumento: this.documentos[1] });
         },
         error: (e) => console.error(e),
      });
   }

   iresponsaxNombre(e: any) {
      if (e.target.value != '') {
         this.beneService.findByNombre(e.target.value).subscribe({
            next: datos => this._beneficiarios = datos,
            error: err => console.error(err.error),
         });
      }
   }
   onIresponsableSelected(e: any) {
      const selectedOption = this._beneficiarios.find((x: { nomben: any; }) => x.nomben === e.target.value);
      if (selectedOption) this.idbene = selectedOption.idbene;
      else this.idbene = null;
      console.log('this.idbene:', this.idbene);
   }

   guardatTramipresu() {
      this.s_tramipresu.saveTramipresu(this.formTramipresu.value).subscribe({
         next: (datos) => {
            this.router.navigate(['tramipresu']);
         },
         error: (e) => console.error(e),
      });
   }

   retroceder() { this.router.navigate(['tramipresu']); }

   //Valida que se haya seleccionado un Beneficiario
   valBenefi(control: AbstractControl) {
      if (this.idbene == null) return of({ 'invalido': true });
      else return of(null);
   }
   
}
