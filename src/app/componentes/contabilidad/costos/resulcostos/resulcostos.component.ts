import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { CuentasService } from 'src/app/servicios/contabilidad/cuentas.service';

@Component({
   selector: 'app-resulcostos',
   templateUrl: './resulcostos.component.html',
   styleUrls: ['./resulcostos.component.css']
})
export class ResulcostosComponent implements OnInit {

   formBuscar: FormGroup;
   date: Date = new Date();
   today: number = Date.now();
   otraPagina: boolean;
   archExportar: string;
   _resulcostos: any;
   // arreglo: any[] = [];
   arr: any;
   _tmp: any;
   _cuecostos: any;

   constructor(private fb: FormBuilder, private router: Router, private cueService: CuentasService) { }

   ngOnInit(): void {
      sessionStorage.setItem('ventana', '/unicostos');
      let coloresJSON = sessionStorage.getItem('/unicostos');
      if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));

      this.formBuscar = this.fb.group({
         numnivel: 1,
         desdeFecha: '2024-01-31',
      });
   }

   colocaColor(colores: any) {
      document.documentElement.style.setProperty('--bgcolor1', colores[0]);
      const cabecera = document.querySelector('.cabecera');
      if (cabecera) cabecera.classList.add('nuevoBG1')
      document.documentElement.style.setProperty('--bgcolor2', colores[1]);
      const detalle = document.querySelector('.detalle');
      if (detalle) detalle.classList.add('nuevoBG2');
   }

   busca() {
      this.cueService.getCuecostos().subscribe({
         next: datos => {
            // this._cuecostos = datos;
            this._cuecostos = datos.filter(item =>
               item.codcue.startsWith('13') );
            // this.totales();
         },
         error: err => console.error(err.error)
      });
   }

   buscar() {

      this.cueService.getCuecostos().subscribe({
         next: datos => {
            this._tmp = datos;
            this.arr = datos;
            // this.arr = datos;

            this._cuecostos = datos.filter(data =>
               data.codcue.startsWith('6') );
            // this.arreglo2 = this._cuentas;

            // this.arreglo = this._resulcostos;

            // this._resulcostos = datos.sort((a, b) => a.codcue.localeCompare(b.codcue));
            // this.arreglo.sort((a, b) => a.codcue.localeCompare(b.codcue));
            // this.calcular();
         },
         error: err => console.error(err.error)
      });
   }

   regresar() { this.router.navigate(['/unicostos']); }

   calcular(){
      for (let i = 0; i <= this._resulcostos.length - 1; i++) {
         this._resulcostos[i].ingresoM = i;
         this._resulcostos[i].costoM = 0;
         this._resulcostos[i].ingresoA = i;
         this._resulcostos[i].costoA = 0;
      }
   }

}
