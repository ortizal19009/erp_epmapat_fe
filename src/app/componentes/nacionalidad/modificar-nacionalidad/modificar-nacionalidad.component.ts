import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Nacionalidad } from 'src/app/modelos/nacionalidad';
import { NacionalidadService } from 'src/app/servicios/nacionalidad.service';

@Component({
   selector: 'app-modificar-nacionalidad',
   templateUrl: './modificar-nacionalidad.component.html',
   styleUrls: ['./modificar-nacionalidad.component.css']
})

export class ModificarNacionalidadComponent implements OnInit {

   nacionalidad: Nacionalidad = new Nacionalidad();
   nacionalidadForm: FormGroup;
   rtn: number;   //0=Ok, 1=Vacio, 2=Ya existe
   descripcion: String;
   disabled: boolean = true;

   constructor(public fb: FormBuilder, private nacService: NacionalidadService, private router: Router) { }

   ngOnInit() {
      this.nacionalidadForm = this.fb.group({
         idnacionalidad: [''],
         descripcion: ['', Validators.required]
      });
      this.iniciar();
   }

   iniciar() {
      let idnacionalidad = localStorage.getItem("idnacionalidad");
      this.nacService.getById(+idnacionalidad!).subscribe(datos => {
         this.nacionalidadForm.setValue({
            idnacionalidad: datos.idnacionalidad,
            descripcion: datos.descripcion
         })
      });
   }

   onKeypressEvent(event: any) {
      this.disabled = false;
   }

   onSubmit() {
      this.actualizarNacionalidad();
   }

   actualizarNacionalidad() {
      let i_descripcion = document.getElementById("descripcion") as HTMLInputElement;
      i_descripcion.addEventListener('keyup', () => {
         i_descripcion.style.border = "";
         this.disabled = false;
      });
      if (i_descripcion.value === '') {
         i_descripcion.style.border = "#F54500 1px solid";
         this.rtn = 1;
      } else {
         this.nacService.getNacionalidadByDescripcion(i_descripcion.value).subscribe(datos => {
            console.log(datos);
            if (datos.length == 0) {
               this.rtn = 0;
               this.nacService.updateNacionalidad(this.nacionalidadForm.value).subscribe(datos => {
                  window.location.reload();
               }, error => console.error(error));
               this.retornarListaNacionalidad();
            } else {
               i_descripcion.style.border = "#F54500 1px solid";
               this.descripcion = i_descripcion.value;
               this.rtn = 2;
            }
         });
      }
   }

   retornarListaNacionalidad() {
      this.router.navigate(['/nacionalidades']);
   }

}
