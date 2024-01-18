import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CajaService } from 'src/app/servicios/caja.service';

@Component({
   selector: 'app-cajas',
   templateUrl: './cajas.component.html',
   styleUrls: ['./cajas.component.css']
})

export class ListarCajaComponent implements OnInit {

   _cajas: any;
   filtro: string;

   constructor(private cajaService: CajaService, private router: Router) { }

   ngOnInit(): void {
      sessionStorage.setItem('ventana', '/cajas');
      this.setcolor();
      this.listarCajas();
   }

   setcolor() {
      let colores: string[];
      let coloresJSON = sessionStorage.getItem('/cajas');
      if (!coloresJSON) {
         colores = ['rgb(57, 95, 95)', 'rgb(207, 221, 210)'];
         const coloresJSON = JSON.stringify(colores);
         sessionStorage.setItem('/cajas', coloresJSON);
      } else colores = JSON.parse(coloresJSON);

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

}
