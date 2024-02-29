import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { ColoresService } from 'src/app/compartida/colores.service';

import { CajaService } from 'src/app/servicios/caja.service';

@Component({
   selector: 'app-cajas',
   templateUrl: './cajas.component.html',
   styleUrls: ['./cajas.component.css']
})

export class ListarCajaComponent implements OnInit {

   _cajas: any;
   filtro: string;
   otraPagina: boolean = false;

   constructor(private cajaService: CajaService, private router: Router,
      public authService: AutorizaService, private coloresService: ColoresService) { }

   ngOnInit(): void {
      sessionStorage.setItem('ventana', '/cajas');
      let coloresJSON = sessionStorage.getItem('/cajas');
      if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));
      else this.buscaColor();
      this.listarCajas();
   }

   async buscaColor() {
      try {
         console.log(this.authService.idusuario)
         const datos = await this.coloresService.setcolor(+this.authService.idusuario!, 'cajas');
         const coloresJSON = JSON.stringify(datos);
         sessionStorage.setItem('/cajas', coloresJSON);
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

   public listarCajas() {
      this.cajaService.getListaCaja().subscribe(datos => {
         this._cajas = datos;
      });
   }

   public info(idcaja: number) {
      sessionStorage.setItem('idcajaToInfo', idcaja.toString());
      this.router.navigate(['info-caja']);
   }

   onCellClick(event: any, idcaja: number) {
      const tagName = event.target.tagName;
      if (tagName === 'TD') {
         sessionStorage.setItem('idcajaToInfo', idcaja.toString());
         this.router.navigate(['info-caja']);
      }
   }

   // definircolor() {
   //    sessionStorage.setItem('ventana', '/cajas');
   //    this.router.navigate(['colores']);
   // }

   pdf(){
      
   }

}