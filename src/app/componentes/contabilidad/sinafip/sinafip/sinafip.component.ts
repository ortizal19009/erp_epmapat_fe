import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, Validators } from '@angular/forms';
import { ColoresService } from 'src/app/compartida/colores.service';

@Component({
   selector: 'app-sinafip',
   templateUrl: './sinafip.component.html',
   styleUrls: ['./sinafip.component.css']
})
export class SinafipComponent implements OnInit {

   formSinafip: any;

   constructor(private fb: FormBuilder, private coloresService: ColoresService) { }

   ngOnInit(): void {
      sessionStorage.setItem('ventana', '/sinafip');
      let coloresJSON = sessionStorage.getItem('/sinafip');/*  */
      if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));
      else this.buscaColor();

      this.formSinafip = this.fb.group({
         archivo: '',
         nombre: ['', [Validators.required, Validators.minLength(3)]],
         tipo: '',
         periodo: ''
      });
      // { updateOn: "blur" });
   }

   async buscaColor() {
      try {
         const datos = await this.coloresService.setcolor(1, 'sinafip');
         const coloresJSON = JSON.stringify(datos);
         sessionStorage.setItem('/sinafip', coloresJSON);
         this.colocaColor(datos);
      } catch (error) {
         console.error(error);
      }
   }

   colocaColor(colores: any) {
      document.documentElement.style.setProperty('--bgcolor1', colores[0]);
      const cabecera = document.querySelector('.cabecera');
      if (cabecera) cabecera.classList.add('nuevoBG1')
      document.documentElement.style.setProperty('--bgcolor2', colores[1]);
      const detalle = document.querySelector('.detalle');
      if (detalle) detalle.classList.add('nuevoBG2');
   }

   get f() { return this.formSinafip.controls; }

   generar() {

   }

}
