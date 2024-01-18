import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ClasificadorService } from 'src/app/servicios/clasificador.service';

@Component({
  selector: 'app-add-clasificador',
  templateUrl: './add-clasificador.component.html',
  styleUrls: ['./add-clasificador.component.css']
})

export class AddClasificadorComponent implements OnInit{

  clasificadorForm: FormGroup;
  disabled: boolean = true;
  vecvalido: Boolean[] = [false, false];
  rtn1: number = 0; rtn2: number = 0;
  codigos: String;
  codpar: String;
  nompar: String;

  constructor(public fb: FormBuilder, private clasificadorService: ClasificadorService,
   public router: Router) { }

  ngOnInit(): void {
   let date: Date = new Date();
     this.clasificadorForm = this.fb.group({
      codpar: ['', Validators.required],
      nivpar: 0,
      grupar: [''],
      nompar: ['', Validators.required],
      despar: [''],
      cueejepresu: [''],
      presupuesto: 0,
      ejecucion: 0,
      devengado: 0,
      reforma: 0,
      asigna_ini: 0,
      usucrea: "1",
      feccrea: date,
      usumodi: null,
      fecmodi: null,
      grupo: null,
      balancostos: 0

     });
     this.valCodigoCuenta();
     this.valDescriCuenta();
  }

  regresar() { this.router.navigate(['/clasificador']); }

  onSubmit() { 
   let h_codigo = document.getElementById("codpar") as HTMLInputElement;
   let l_codigo = h_codigo.value;
   this.findByCodigos(l_codigo);

   let h_descripcion = document.getElementById("nompar") as HTMLInputElement;
   let l_descripcion = h_descripcion.value;

   this.clasificadorService.getByNombre(l_descripcion).subscribe(datos => {
      this.rtn2= 0;
      if (datos.length >= 1) {
         this.rtn2= 1;
         this.nompar = l_descripcion;
      }
   }, error => console.log(error));
   this.guardarCuenta();
  }

  guardaCuenta() {

   let h_codigo = document.getElementById("codpar") as HTMLInputElement;
   let l_codigo = h_codigo.value;
   this.rtn2 = 0;
   this.findByCodigos(l_codigo);
   if (this.rtn1 == 0 ) {
      this.guardarCuenta();
   }
}


guardarCuenta(): void {
   this.clasificadorService.saveClasificador(this.clasificadorForm.value).subscribe(datos => {
      this.router.navigate(['/clasificador']);
    }, error => console.log(error));

}

valCodigoCuenta() {
   let h_codigo = document.getElementById("codpar") as HTMLInputElement;

   h_codigo.addEventListener('keyup', () => {
      let l_value = h_codigo.value;
      if (+l_value > 0) {
         h_codigo.style.border = '';
         this.vecvalido[0] = true;
      } else {
         h_codigo.style.border = "#F54500 1px solid";
         this.vecvalido[0] = false;
      }
      this.disabled = funvalidar(...this.vecvalido);
   });
}

valDescriCuenta() {
   let h_descripcion = document.getElementById("nompar") as HTMLInputElement;
   h_descripcion.addEventListener('keyup', () => {
      let l_value = h_descripcion.value;
      if (l_value.length >= 3) {
         h_descripcion.style.border = '';
         this.vecvalido[1] = true;
         this.disabled = funvalidar(...this.vecvalido);
      } else {
         h_descripcion.style.border = "#F54500 1px solid";
         this.vecvalido[1] = false;
         this.disabled = funvalidar(...this.vecvalido);
      }
   });
}
findByCodigos(codpar: String) {
   let rtn = 0;

   this.clasificadorService.getByDescripcion(codpar).subscribe(datos => {
      this.rtn1 = 0;
      if (datos.length >= 1) {
         this.rtn1 = 1;
         rtn = 1;
         this.codigos = datos[0].codpar + "." + codpar;
      }
      return rtn;
   }, error => console.log(error));
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
