import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { map } from 'rxjs';
import { Tabla4 } from 'src/app/modelos/administracion/tabla4.model';
import { DocumentosService } from 'src/app/servicios/administracion/documentos.service';
import { Tabla4Service } from 'src/app/servicios/administracion/tabla4.service';
import { DocumentosComponent } from '../documentos/documentos.component';
import { AutorizaService } from 'src/app/compartida/autoriza.service';

@Component({
   selector: 'app-add-documento',
   templateUrl: './add-documento.component.html',
   styleUrls: ['./add-documento.component.css']
})

export class AddDocumentoComponent implements OnInit {

   formDocumento: FormGroup;
   _comprobantes: any;

   tabla4: Tabla4 = new Tabla4;

   constructor(private fb: FormBuilder, private tab4Service: Tabla4Service, private authService: AutorizaService,
      private docuService: DocumentosService, private parent: DocumentosComponent) {
   }

   ngOnInit(): void { this.crearForm(); }

   crearForm() {

      this.tabla4.idtabla4 = 1;
      const fechaHora = new Date();
      const data = { fechaHora: fechaHora.toISOString()};
      this.formDocumento = this.fb.group({
         nomdoc: [null, [Validators.required, Validators.minLength(3), Validators.maxLength(20)], this.valNomdoc.bind(this)],
         tipdoc: 0,
         idtabla4: this.tabla4,
         usucrea: this.authService.idusuario,
         feccrea: fechaHora
      },
         { updateOn: "blur" });

      this.tab4Service.getListaTabla4().subscribe({
         next: resp => {this._comprobantes = resp;
            this.formDocumento.patchValue({ idtabla4: 1 });
         },
         error: err => console.error(err.error)
      });
   }

   get f() { return this.formDocumento.controls; }

   onSubmit() {
      this.tabla4.idtabla4 = this.formDocumento.get('idtabla4')!.value;
      this.formDocumento.value.idtabla4 = this.tabla4;
      this.docuService.saveDocumento(this.formDocumento.value).subscribe({
         next: resp => {
            this.reset()
            this.parent.listarDocumentos()
         },
         error: err => console.error(err.error)
      });
   }

   reset() { this.crearForm() }

   valNomdoc(control: AbstractControl) {
      return this.docuService.getByNomdoc(control.value)
         .pipe(
            map(result => result.length == 1 ? { existe: true } : null)
         );
   }

}
