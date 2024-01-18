import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Pliego24 } from 'src/app/modelos/pliego24.model';
import { Pliego24Service } from 'src/app/servicios/pliego24.service';

@Component({
   selector: 'app-pliego24',
   templateUrl: './pliego24.component.html',
   styleUrls: ['./pliego24.component.css']
})
export class Pliego24Component implements OnInit {

   formBuscar: FormGroup;
   selectedOption: FormControl;
   filtro: string;
   _pliego24: any;
   _consumos: Pliego24[];
   formSimula: FormGroup;
   m3: number;
   swsimula: boolean = false;
   gradualidad: any;

   constructor(private pli24Service: Pliego24Service, private router: Router, public fb: FormBuilder) { }

   ngOnInit(): void {
      this.selectedOption = new FormControl('1');
      this.formBuscar = this.fb.group({
         selecGradualidad: this.selectedOption,
      });

      sessionStorage.setItem('ventana', '/pliego24');
      this.setcolor();
      this.listar();
      this.formSimula = this.fb.group({
         m3: ['0', Validators.required],
      });
   }

   setcolor() {
      let colores: string[];
      let coloresJSON = sessionStorage.getItem('/pliego24');
      if (!coloresJSON) {
         colores = ['rgb(139, 48, 110)', 'rgb(235, 218, 235)'];
         const coloresJSON = JSON.stringify(colores);
         sessionStorage.setItem('/pliego24', coloresJSON);
      } else colores = JSON.parse(coloresJSON);

      document.documentElement.style.setProperty('--bgcolor1', colores[0]);
      const cabecera = document.querySelector('.cabecera');
      if (cabecera) cabecera.classList.add('nuevoBG1')
      document.documentElement.style.setProperty('--bgcolor2', colores[1]);
      const detalle = document.querySelector('.detalle');
      if (detalle) detalle.classList.add('nuevoBG2');
   }

   public listar() {
      this.gradualidad = this.selectedOption.value;
      this.pli24Service.getTodos().subscribe({
         next: datos => {
            this._pliego24 = datos;
            // this.calcular()
         },
         error: err => console.error('Al recuperar el P.Tarifario 2024', err.error)
      });
   }

   onCellClick(event: any, idpliego: number) {
      const tagName = event.target.tagName;
      if (tagName === 'TD') {
         sessionStorage.setItem('idpliegoToInfo', idpliego.toString());
         this.router.navigate(['info-pliego24']);
      }
   }

   ocultar(index: number): boolean {
      if (index > 0) {
         return this._pliego24[index].idcategoria.descripcion === this._pliego24[index - 1].idcategoria.descripcion;
      }
      return false;
   }

   // calcular() {
   //    this.m3 = this.formSimula.value.m3;
   //    this.pli24Service.getConsumo(this.m3, this.gradualidad).subscribe({
   //       next: datos => {
   //          this._consumos = datos;
   //          this.swsimula = true;
   //       },
   //       error: err => console.error('Al recuperar el Consumo', err.error)
   //    });
   // }

   simulacion() {
      this.router.navigate(['/simulacion']);
   }

   proyeccion() {
      this.router.navigate(['proyeccion']);
   }
}
