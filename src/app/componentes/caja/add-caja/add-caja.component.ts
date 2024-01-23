import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Ptoemision } from 'src/app/modelos/ptoemision';
import { CajaService } from 'src/app/servicios/caja.service';
import { PtoemisionService } from 'src/app/servicios/ptoemision.service';

@Component({
   selector: 'app-add-caja',
   templateUrl: './add-caja.component.html',
   styleUrls: ['./add-caja.component.css']
})


export class AddCajaComponent implements OnInit {

   _ptoemision: any;
   formCaja: FormGroup;
   disabled: boolean = true;
   vecvalido: Boolean[] = [false, false];
   rtn1: number = 0; rtn2: number = 0;
   codigos: String;
   descripcion: String;

   ptoEmision: Ptoemision = new Ptoemision();

   constructor(public fb: FormBuilder, private cajaService: CajaService,
      public ptoemiService: PtoemisionService) { }

   ngOnInit(): void {
      let date: Date = new Date();

      this.ptoEmision.idptoemision = 1;

      this.formCaja = this.fb.group({
         descripcion: ['', Validators.required],
         codigo: ['', Validators.required],
         estado: 1,
         idptoemision_ptoemision: this.ptoEmision,
         usucrea: 1,
         feccrea: date,
      });

      this.listarPtoEmision();
      this.valCodigoCaja();
      this.valDescriCaja();
   }

   onSubmit() {
      let idptoemision = this.formCaja.value.idptoemision_ptoemision.idptoemision;
      let h_codigo = document.getElementById("codigo") as HTMLInputElement;
      let l_codigo = h_codigo.value;
      this.findByCodigos(idptoemision, l_codigo);
      let h_descripcion = document.getElementById("descripcion") as HTMLInputElement;
      let l_descripcion = h_descripcion.value;
      this.cajaService.getByDescri(l_descripcion).subscribe(datos => {
         this.rtn2 = 0;
         if (datos.length >= 1) {
            this.rtn2 = 1;
            this.descripcion = l_descripcion;
         }
      }, error => console.log(error));
   }

   findByDescri(descripcion: String) {
      this.cajaService.getByDescri(descripcion).subscribe(datos => {
         this.rtn2 = 0;
         if (datos.length >= 1) {
            this.rtn2 = 1;
            this.descripcion = descripcion;
         }
      }, error => console.log(error));
   }

   guardaCaja() {
      let idptoemision = this.formCaja.value.idptoemision_ptoemision.idptoemision;
      let h_codigo = document.getElementById("codigo") as HTMLInputElement;
      let l_codigo = h_codigo.value;
      this.rtn2 = 0;
      this.findByCodigos(idptoemision, l_codigo);
      let h_descripcion = document.getElementById("descripcion") as HTMLInputElement;
      let l_descripcion = h_descripcion.value;
      this.findByDescri(l_descripcion);
      //alert(" rtn1 y rtn2 =" + this.rtn1 + ' '+this.rtn2)
      if (this.rtn1 == 0 && this.rtn2 == 0) {
         this.guardarCaja();
      }
   }

   guardarCaja(): void {
      // this.cajaService.saveCaja(this.cajaForm.value).subscribe(datos => {
      //    window.location.reload();
      // }, error => console.log(error));
      alert("Guarda")
   }

   valCodigoCaja() {
      let h_codigo = document.getElementById("codigo") as HTMLInputElement;
      h_codigo.addEventListener('keyup', () => {
         let l_value = h_codigo.value;
         if (l_value.length === 3 && +l_value > 0) {
            h_codigo.style.border = '';
            this.vecvalido[0] = true;
         } else {
            h_codigo.style.border = "#F54500 1px solid";
            this.vecvalido[0] = false;
         }
         this.disabled = funvalidar(...this.vecvalido);
      });
   }

   valDescriCaja() {
      let h_descripcion = document.getElementById("descripcion") as HTMLInputElement;
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

   listarPtoEmision() {
      this.ptoemiService.getListaPtoEmision().subscribe({
         next: datos => {
            this._ptoemision = datos
            this.formCaja.patchValue({ idptoemision_ptoemision: 1 });
         },
         error: err => console.error(err.error)
      });
   }

   findByCodigos(idptoemision: number, codigo: String) {
      let rtn = 0;
      this.cajaService.getByCodigos(idptoemision, codigo).subscribe(datos => {
         this.rtn1 = 0;
         if (datos.length >= 1) {
            this.rtn1 = 1;
            rtn = 1;
            this.codigos = datos[0].idptoemision_ptoemision.establecimiento + "." + codigo;
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
