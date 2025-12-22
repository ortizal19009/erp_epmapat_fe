import { Component, OnInit } from '@angular/core';
import { AbstractControl, AsyncValidatorFn, FormBuilder, ValidationErrors, Validators } from '@angular/forms';
import { finalize, map, Observable, of, take } from 'rxjs';
import { CategoriaService } from 'src/app/servicios/categoria.service';

@Component({
   selector: 'app-add-categoria',
   templateUrl: './add-categoria.component.html',
   styleUrls: ['./add-categoria.component.css']
})

export class AddCategoriaComponent implements OnInit {

   formCategoria: any;
x: any;

   constructor(private fb: FormBuilder, private cateService: CategoriaService) {
      this.crearForm();
   }

   ngOnInit(): void {
      let date: Date = new Date();
      // this.descricategoria = this.formCategoria.get('descricategoria');
   }

   crearForm() {
      this.formCategoria = this.fb.group({
         descricategoria: [null, [Validators.required, Validators.minLength(3)],
            this.validateEmail.bind(this)],
            // asyncEmailValidatorOk(this.cateService)],
         //  this.validarNombre.bind(this)],
         porcdescuento: [0]
      },
      { updateOn: "blur" }
      );
   }

   // convenience getter for easy access to form fields
   //get f() { return this.formCategoria.controls; }

   guardarReclamo() {
      this.cateService.saveCategoria(this.formCategoria.value).subscribe(datos => {
         //this.retornarListaReclamos()
         //this.mensajeSuccess(this.reclamoForm.value.observacion);
         window.location.reload();
      }, error => console.error(error));
   }

   guardarCategoria() {
      // this.cateService.saveCategoria(this.categoria).subscribe(datos => {
      //    window.location.reload();
      // }, error => console.error(error))
   }

   // retornarListaCategoria() {
   //   this.router.navigate(['/listar-categoria']);
   // }

   //   onSubmit() { this.guardarCategoria(); }

   submit() {
      if (this.formCategoria.valid) {
      }
      else {
         alert("FILL ALL FIELDS")
      }
   }

   onSubmit() {
      console.warn(this.formCategoria.value);

      //this.submitted = true;
   }

   onReset() {
      //this.submitted = false;
      this.formCategoria.reset();
   }

   validarNombre(control: AbstractControl) {
      return this.cateService.valNombre(control.value).subscribe(res => {
         //alert("res = " + res.length)
         console.warn(res)
         return res ? null : { descripcionTaken: true };
      });
   }

   validateEmail(control: AbstractControl)  {
      //const value = control.value;
      return this.cateService.valNombre(control.value)
      .pipe(
        map(res  => {
          const isEmailAvailable = res;
         return isEmailAvailable ?  {notAvailable: true} : null;
         //  return res.descripcion ? { notAvailable: true } : null;
        })
      );
    }

    validateEmail1(control: AbstractControl)  {
      this.x = this.cateService.valNombre(control.value);


    }

}
