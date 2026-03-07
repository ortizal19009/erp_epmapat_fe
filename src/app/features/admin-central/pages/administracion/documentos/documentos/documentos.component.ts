import { Component } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { Documentos } from 'src/app/modelos/administracion/documentos.model';

import { DocumentosService } from 'src/app/servicios/administracion/documentos.service';

@Component({
   selector: 'app-documentos',
   templateUrl: './documentos.component.html',
   styleUrls: ['./documentos.component.css']
})

export class DocumentosComponent {

   _documentos: any;
   filtro: string;
   formBuscar: FormGroup;

   constructor(public fb: FormBuilder, private documentosService: DocumentosService, private router: Router) { }

   ngOnInit(): void { this.listarDocumentos();   }

   public listarDocumentos() {
      this.documentosService.getListaDocumentos().subscribe({
         next: datos => this._documentos = datos,
         error: err => console.error(err.error)
      });
   }

   public infoDocumento(documentos: Documentos) {
      sessionStorage.setItem('iddocumentoToInfo', documentos.iddocumento.toString());
      this.router.navigate(['info-documento']);
   }

}
