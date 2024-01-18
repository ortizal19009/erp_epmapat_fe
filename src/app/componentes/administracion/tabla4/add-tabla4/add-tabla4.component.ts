import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, Validators } from '@angular/forms';
import { map } from 'rxjs';
import { Tabla4Service } from 'src/app/servicios/administracion/tabla4.service';
import { Tabla4Component } from '../tabla4/tabla4.component';

@Component({
   selector: 'app-add-tabla4',
   templateUrl: './add-tabla4.component.html',
   styleUrls: ['./add-tabla4.component.css']
})
export class AddTabla4Component implements OnInit {

   tab4Form: any;

   constructor(private fb: FormBuilder, private tab4Service: Tabla4Service,
      private parent: Tabla4Component) { }

   ngOnInit(): void { this.crearForm(); }

   crearForm() {
      let date: Date = new Date();
      this.tab4Form = this.fb.group({
         tipocomprobante: [null, [Validators.required, Validators.minLength(2), Validators.maxLength(2)], this.valTipocomprobante.bind(this)],
         nomcomprobante: [null, [Validators.required, Validators.minLength(3), Validators.maxLength(100)], this.valNomcomprobante.bind(this)],
         usucrea: 1,
         feccrea: date
      },
         { updateOn: "blur" }
      );
   }

   onSubmit() {
      this.tab4Service.saveTabla4(this.tab4Form.value).subscribe(datos => {
         // console.log("Graba Ok")
         this.parent.listarTabla4();
      }, error => console.log(error));
   }

   reset() { this.crearForm(); }

   get tipocomprobante() { return this.tab4Form.get('tipocomprobante'); }
   get nomcomprobante() { return this.tab4Form.get('nomcomprobante'); }
   
   //Valida el código de comprobante
   valTipocomprobante(control: AbstractControl) {
      return this.tab4Service.getByTipocomprobante(control.value)
         .pipe(
            map(result => result.length == 1 ? { existe: true } : null)
         );
   }
   //Valida el nombre de comprobante
   valNomcomprobante(control: AbstractControl) {
      return this.tab4Service.getByNomcomprobante(control.value)
         .pipe(
            map(result => result.length == 1 ? { existe: true } : null)
         );
   }
}