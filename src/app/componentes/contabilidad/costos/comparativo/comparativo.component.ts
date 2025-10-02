import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
   selector: 'app-comparativo',
   templateUrl: './comparativo.component.html',
   styleUrls: ['./comparativo.component.css']
})
export class ComparativoComponent implements OnInit {

   formBuscar: FormGroup;
   date: Date = new Date();
   today: number = Date.now();
   otraPagina: boolean;
   archExportar: string;
   data: any[] = [
      { name: 'Servicios subcontratados', value1: 0, value2: 0, value3: 0, value5: 0 },
      { name: 'Remuneraciones', value1: 41453.43, value2: 41453.43, value3: 674716.66, value5: 0 },
      { name: 'Otros gastos', value1: 1249.53, value2: 1249.53, value3: 407472.9, value5: 0 },
      { name: 'Materiales e insumos', value1: 0, value2: 0, value3: 194000, value5: 0 },
      { name: 'Gastos de capital', value1: 0, value2: 0, value3: 102300, value5: 0 }
   ];
   columnNames: string[] = ['Name', 'Value 1', 'Value 2', 'Value 3'];
   totales: any[] = [0, 0, 0, 0 ];

   constructor(private fb: FormBuilder, private router: Router) { }

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

   regresar() { this.router.navigate(['/unicostos']); }

   buscar() {

   }

}