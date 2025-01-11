import { Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { ColoresService } from 'src/app/compartida/colores.service';
import { UnicostosService } from 'src/app/servicios/contabilidad/unicostos.service';

@Component({
   selector: 'app-unicostos',
   templateUrl: './unicostos.component.html',
   styleUrls: ['./unicostos.component.css']
})
export class UnicostosComponent implements OnInit {

   _unicostos: any[];
   sumagua: number;
   sumaguaprod: number;
   sumalcanta: number;

   constructor(public fb: FormBuilder, private router: Router,
      public authService: AutorizaService, private coloresService: ColoresService,
      private unicostService: UnicostosService   ) { }

   ngOnInit(): void {
      sessionStorage.setItem('ventana', '/unicostos');
      let coloresJSON = sessionStorage.getItem('/unicostos');
      if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));
      else this.buscaColor();

      this.busca();
   }

   colocaColor(colores: any) {
      document.documentElement.style.setProperty('--bgcolor1', colores[0]);
      const cabecera = document.querySelector('.cabecera');
      if (cabecera) cabecera.classList.add('nuevoBG1')
      document.documentElement.style.setProperty('--bgcolor2', colores[1]);
      const detalle = document.querySelector('.detalle');
      if (detalle) detalle.classList.add('nuevoBG2');
   }

   async buscaColor() {
      try {
         const datos = await this.coloresService.setcolor(this.authService.idusuario, 'unicostos');
         const coloresJSON = JSON.stringify(datos);
         sessionStorage.setItem('/unicostos', coloresJSON);
         this.colocaColor(datos);
      } catch (error) { console.error(error); }
   }

   busca(){
      this.unicostService.getAll().subscribe({
         next: datos =>{
            this._unicostos = datos;
            this.totales();
         },
         error: err => console.error(err.error)
      })
   }

   totales() {
      this.sumagua = 0; this.sumaguaprod = 0; this.sumalcanta = 0;
      this._unicostos.forEach(async (item, index) => {
         this.sumagua = this.sumagua + item.agua;
         this.sumaguaprod = this.sumaguaprod + item.aguaprod;
         this.sumalcanta = this.sumalcanta + item.alcanta;
      });
   }

   cuecostos(){      this.router.navigate(['/cuecostos']);   }

   comparativo(){      this.router.navigate(['/comparativo']);   }

   resulcostos(){      this.router.navigate(['/resulcostos']);   }
   
   imprimir() {      this.router.navigate(['/imp-unicostos']);   }
   
}
