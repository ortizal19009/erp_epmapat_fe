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

   constructor(private fb: FormBuilder, private refoService: ReformasService,
      private docuService: DocumentosService, private router: Router) { }

   ngOnInit(): void {
      this.refoService.siguienteNumero().subscribe({
         next: x => this.formReforma.patchValue({ numero: x }),
         error: err => console.log(err.error)
      }
      );

      let documentos: Documentos = new Documentos;
      documentos.iddocumento = 1;

      this.formReforma = this.fb.group({
         numero: ['', [Validators.required, Validators.min(1)]],
         fecha: (new Date().toISOString().substring(0, 10)),
         tipo: 'G',
         iddocumento: [documentos, Validators.required],
         numdoc: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(12)]],
         concepto: [null, [Validators.required]],
         valor: 0,
         usucrea: 1,
         feccrea: (new Date().toISOString().substring(0, 10))
      },
         { updateOn: "blur" })

      this.docuService.getListaDocumentos().subscribe({
         next: resp => this._documentos = resp,
         error: err => console.error(err.error)
      });
      setTimeout(() => {
         let opcDocumento = document.getElementById(`iddocumento_1`) as HTMLElement;
         if (opcDocumento != null) opcDocumento.setAttribute("selected", "");
      }, 900);
   }

   get f() { return this.formReforma.controls; }

   onSubmit() {
      this.refoService.saveReformas(this.formReforma.value).subscribe({
         next: resp => {
            sessionStorage.setItem('buscaReformasHasta', this.formReforma?.controls['numero'].value.toString());
            this.regresar();
         },
         error: err => console.log(err.error)
      });
   }

   regresar() { this.router.navigate(['/reformas']); }

}