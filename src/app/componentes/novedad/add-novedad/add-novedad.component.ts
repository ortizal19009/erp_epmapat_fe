import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { Novedad } from 'src/app/modelos/novedad.model';
//import { Novedad } from 'src/app/modelos/novedad.model';
import { NovedadesService } from 'src/app/servicios/novedades.service';

@Component({
   selector: 'app-add-novedad',
   templateUrl: './add-novedad.component.html'
})

export class AddNovedadComponent implements OnInit {

   novedad: Novedad = new Novedad();
   disabled = true;
   novedadForm: FormGroup;
   vecvalido: Boolean[] = [false];
   rtn1: number = 0;
   descripcion: String;

   constructor(public fb: FormBuilder, private novService: NovedadesService, private authService: AutorizaService) { }

   ngOnInit(): void { 
      let date: Date = new Date();
      this.novedad.estado = 1;
      this.novedad.usucrea = 12345;
      this.novedad.feccrea = date;
      this.novedadForm = this.fb.group({
         descripcion: ['', Validators.required, Validators.minLength(3)]
         // estado: 1,
         // usucrea: this.authService.idusuario,,
         // feccrea: date,
      });
      this.rtn1 = 0;
      this.valDescriNovedad();
   }

   onSubmit() { 
      let h_descripcion = document.getElementById("descripcion") as HTMLInputElement;
      let l_descripcion = h_descripcion.value;
      this.novService.findByDescripcion(l_descripcion).subscribe(datos => {
         this.rtn1 = 0;
         if (datos.length >= 1){
//            alert("datos.length =" + datos.length)
            this.rtn1 = 1;
            this.descripcion  = l_descripcion;
         }else{ 
            this.rtn1 = 0;
            this.guardarNovedad()}
      }, error => console.log(error));
   }

   guardarNovedad(): void {
      this.novService.saveNovedad(this.novedad).subscribe(datos => {
         window.location.reload();
       }, error => console.log(error));
      //alert("Guarda")
     // this.novService.create(this.novedadForm.value).subscribe(datos => {
      //    window.location.reload();
     // }, error => console.log(error));
      
   }

   valDescriNovedad() {
      let h_descripcion = document.getElementById("descripcion") as HTMLInputElement;
      h_descripcion.addEventListener('keyup', () => {
         this.rtn1 = 0;
         let l_value = h_descripcion.value;
         if (l_value.length >= 3) {
            h_descripcion.style.border = '';
            this.vecvalido[0] = true;
            this.disabled = funvalidar(...this.vecvalido);
         } else {
            h_descripcion.style.border = "#F54500 1px solid";
            this.vecvalido[0] = false;
            this.disabled = funvalidar(...this.vecvalido);
         }
      });
   }

}

//Recorre el vector de validación para verificar si todos los campos son válidos
function funvalidar(...vector: Boolean[]) {
   for (let i = 0; i < vector.length; i++) {
      if (vector[i] == false) {
         return true
      }
   }
   return false
}
