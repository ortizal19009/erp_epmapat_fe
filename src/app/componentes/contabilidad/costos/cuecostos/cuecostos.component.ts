import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { CuentasService } from 'src/app/servicios/contabilidad/cuentas.service';

@Component({
   selector: 'app-cuecostos',
   templateUrl: './cuecostos.component.html',
   styleUrls: ['./cuecostos.component.css']
})
export class CuecostosComponent implements OnInit {

   _cuecostos: any;
   filtro: string;
   formModificar: FormGroup;

   constructor(private router: Router, private fb: FormBuilder,
      public authService: AutorizaService, private cueService: CuentasService) { }

   ngOnInit(): void {
      sessionStorage.setItem('ventana', '/unicostos');
      let coloresJSON = sessionStorage.getItem('/unicostos');
      if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));

      this.formModificar = this.fb.group({
         codcue: '',
         nomcue: '',
         balancostos: 0,
         resulcostos: 0
      });

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

   busca() {
      this.cueService.getCuecostos().subscribe({
         next: datos => {
            this._cuecostos = datos;
            // this.totales();
         },
         error: err => console.error(err.error)
      });
   }

   regresar() { this.router.navigate(['/unicostos']); }

   comparativo(balancostos: number) {
      if (balancostos == 0) return '(Ninguno)';
      if (balancostos == 1) return 'Remuneraciones';
      if (balancostos == 2) return 'Servicios subcontratados';
      if (balancostos == 3) return 'Materiales e insumos';
      if (balancostos == 4) return 'Otros gastos';
      if (balancostos == 5) return 'Gastos de capital';
      return '(Ninguno)';
   }

   resultados(resulcostos: number) {
      switch (resulcostos) {
         case 0:
            return '(Ninguno)';
         case 1:
            return 'Agua potable';
         case 2:
            return 'Alcantarillado';
         case 9:
            return 'Costos';
         default:
            return '(Ninguno)';
      }
   }

   handleClick(cuenta: any) {
      this.formModificar.patchValue({
         codcue: cuenta.codcue,
         nomcue: cuenta.nomcue,
         balancostos: 0,
         resulcostos: 0
      })
   }

   crearForm() {
      this.formModificar = this.fb.group({
         codcue: '',
         nomcue: '',
         balancostos: 0,
         resulcostos: 0
      });
   }

   actualizar() {

   }

}
