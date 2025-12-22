import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ReformasService } from 'src/app/servicios/contabilidad/reformas.service';

import { Documentos } from 'src/app/modelos/administracion/documentos.model';
import { DocumentosService } from 'src/app/servicios/administracion/documentos.service';


@Component({
   selector: 'app-add-reforma',
   templateUrl: './add-reforma.component.html',
   styleUrls: ['./add-reforma.component.css']
})

export class AddReformaComponent implements OnInit {

   formReforma: FormGroup;
   _documentos: any;
   _reforma: any;
   documentos: Documentos = new Documentos;

   constructor(private fb: FormBuilder, private refoService: ReformasService,
      private docuService: DocumentosService, private router: Router) { }

   ngOnInit(): void {
      sessionStorage.setItem('ventana', '/reformas');
      let coloresJSON = sessionStorage.getItem('/reformas');
      if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));

      this.formReforma = this.fb.group({
         numero: ['', [Validators.required, Validators.min(1)]],
         fecha: (new Date().toISOString().substring(0, 10)),
         tipo: 'G',
         intdoc: this.documentos,
         numdoc: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(12)]],
         concepto: '',
         valor: 0,
         usucrea: 1,
         feccrea: (new Date().toISOString().substring(0, 10))
      },
         { updateOn: "blur" });

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
         next: (datos) => {
            this._documentos = datos;
            this.formReforma.controls['intdoc'].setValue(1);
         },
         error: (err) => console.error(err.error)
      });
   }

   //OJO: Deberia tambien recuperar la 'ultima fecha (está colocando la actual)
   ultimo() {
      this.refoService.siguienteNumero().subscribe({
         next: num => this.formReforma.patchValue({ numero: num }),
         error: err => console.error(err.error)
      });
   }

   get f() { return this.formReforma.controls; }

   onSubmit() {
      this.refoService.saveReformas(this.formReforma.value).subscribe({
         next: resp => {
            sessionStorage.setItem('buscaReformasHasta', this.formReforma?.controls['numero'].value.toString());
            this.regresar();
         },
         error: err => console.error(err.error)
      });
   }

   regresar() { this.router.navigate(['/reformas']); }

}
