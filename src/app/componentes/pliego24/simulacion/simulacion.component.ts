import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { delay } from 'rxjs';
import { ColoresService } from 'src/app/compartida/colores.service';
import { Pliego24 } from 'src/app/modelos/pliego24.model';
import { Pliego24Service } from 'src/app/servicios/pliego24.service';

@Component({
   selector: 'app-simulacion',
   templateUrl: './simulacion.component.html',
   styleUrls: ['./simulacion.component.css']
})
export class SimulacionComponent implements OnInit {

   formBuscar: FormGroup;
   selectedOption: FormControl;
   _pliego24: any;
   _consumos: Pliego24[];
   m3: number;
   total: number
   rubros: number[] = new Array<number>(4);
   antIndice = 0;
   subtotales: number[] = [];
   anio = 1
   formulas: string[] = [];

   constructor(public fb: FormBuilder, private pli24Service: Pliego24Service, private coloresService: ColoresService,
      private router: Router) { }

   ngOnInit(): void {
      sessionStorage.setItem('ventana', '/simulacion');
      let coloresJSON = sessionStorage.getItem('/simulacion');
      if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));
      else this.buscaColor();

      this.selectedOption = new FormControl('1');
      this.formBuscar = this.fb.group({
         selecAnio: this.selectedOption,
         m3: ['0', Validators.required],
      });

      this.calcular();
   }

   async buscaColor() {
      try {
         const datos = await this.coloresService.setcolor(1, 'transaci');
         const coloresJSON = JSON.stringify(datos);
         sessionStorage.setItem('/transaci', coloresJSON);
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

   public listar() {
      this.pli24Service.getTodos().subscribe({
         next: datos => {
            this._pliego24 = datos;
            this.calcular()
         },
         error: err => console.error('Al recuperar el P.Tarifario 2024', err.error)
      });
   }

   onSelectChange(event: any) {
      // Valor seleccionado del formulario
      const valorSeleccionado = this.formBuscar.get('selecAnio')!.value;
      this.anio = valorSeleccionado;
      this.calcular()
   }



   dobleClickOld(e: any, i: number) {
      // Obtenemos el objeto MouseEvent
      const event = e as MouseEvent;
      // Obtenemos la fila de la celda
      const fila = e.row;
      // Obtenemos la columna de la celda
      const columna = e.column;
      console.log('fila: ', fila);
      console.log('columna: ', columna);

      const tagName = e.target.tagName;
      console.log('tagName: ', tagName)

      const id = e.target.getAttribute('id');
      console.log('id: ', id);

      if (tagName == 'TD' && id == 'AP' && i == 0) {
         // console.log('Es TD, Agua y 0');
         console.log('(consumo.idcategoria.fijoagua - 0.1) * consumo.porc')
         console.log('Agua Potable Fijo: ', this._consumos[i].idcategoria.fijoagua)
         console.log('%: ', this._consumos[i].porc)
         console.log('Cálculo: (', this._consumos[i].idcategoria.fijoagua, '- 0.10) *', this._consumos[i].porc)
      }
   }

   regresar() { this.router.navigate(['/pliego24']); }

   calcular() {
      this.m3 = this.formBuscar.value.m3;
      this.pli24Service.getConsumo(this.m3).subscribe({
         next: datos => {
            this._consumos = datos;
            this.subtotal();
            this.calcRubros(this.antIndice)
         },
         error: err => console.error('Al recuperar el Consumo', err.error)
      });
   }

   subtotal() {
      var i = 0;
      this._consumos.forEach(() => {
         let suma = 0;
         if (this.anio == 1) {
            let num1 = Math.round((this._consumos[i].idcategoria.fijoagua - 0.1) * this._consumos[i].porc * 100) / 100;
            let num2 = Math.round((this._consumos[i].idcategoria.fijosanea - 0.5) * this._consumos[i].porc * 100) / 100;
            let num3 = Math.round((this.m3 * this._consumos[i].agua) * this._consumos[i].porc * 100) / 100;
            let num4 = Math.round((this.m3 * this._consumos[i].saneamiento / 2) * this._consumos[i].porc * 100) / 100;
            let num5 = Math.round((this.m3 * this._consumos[i].saneamiento / 2) * this._consumos[i].porc * 100) / 100;
            let num7 = Math.round(0.5 * this._consumos[i].porc * 100) / 100;
            suma = suma + num1 + num2 + num3 + num4 + num5 + 0.1 + num7;
            this.subtotales[i] = suma;
         } else {
            let num1 = Math.round((this._consumos[i].idcategoria.fijoagua - 0.1) * 100) / 100;
            let num2 = Math.round((this._consumos[i].idcategoria.fijosanea - 0.5) * 100) / 100;
            let num3 = Math.round((this.m3 * this._consumos[i].agua) * 100) / 100;
            let num4 = Math.round((this.m3 * this._consumos[i].saneamiento / 2) * 100) / 100;
            let num5 = Math.round((this.m3 * this._consumos[i].saneamiento / 2) * 100) / 100;
            suma = suma + num1 + num2 + num3 + num4 + num5 + 0.1 + 0.5;
            this.subtotales[i] = suma;
         }
         i++;
      });

   }

   calcRubros(indice: number) {
      if (this.anio == 1) {
         this.formulas[0] = ' (' + this._consumos[indice].idcategoria.fijoagua.toString() + ' - 0.10) * ' + this._consumos[indice].porc.toString()
         this.formulas[1] = ' (' + this._consumos[indice].idcategoria.fijosanea.toString() + ' - 0.50) * ' + this._consumos[indice].porc.toString()
         this.formulas[2] = ' (' + this.m3.toString() + ' * ' + this._consumos[indice].agua.toString() + ' ) * ' + this._consumos[indice].porc.toString();
         this.formulas[3] = ' (' + this.m3.toString() + ' * ' + this._consumos[indice].saneamiento.toString() + ' / 2) * ' + this._consumos[indice].porc.toString()
         this.formulas[4] = ' (' + this.m3.toString() + ' * ' + this._consumos[indice].saneamiento.toString() + ' / 2) * ' + this._consumos[indice].porc.toString()
         this.formulas[6] = ' 0.50 ' + ' * ' + this._consumos[indice].porc.toString()
      } else {
         this.formulas[0] = this._consumos[indice].idcategoria.fijoagua.toString() + ' - 0.10 '
         this.formulas[1] = this._consumos[indice].idcategoria.fijosanea.toString() + ' - 0.50 '
         this.formulas[2] = this.m3.toString() + ' * ' + this._consumos[indice].agua.toString()
         this.formulas[3] = this.m3.toString() + ' * ' + this._consumos[indice].saneamiento.toString() + ' / 2 '
         this.formulas[4] = this.m3.toString() + ' * ' + this._consumos[indice].saneamiento.toString() + ' / 2 '
         this.formulas[6] = ' 0.50 '
      }
      let num1: number; let num2: number; let num3: number;
      this.antIndice = indice;
      if (this.anio == 1) {
         num1 = Math.round((this._consumos[indice].idcategoria.fijoagua - 0.1) * this._consumos[indice].porc * 100) / 100;
         num2 = Math.round((this.m3 * this._consumos[indice].agua) * this._consumos[indice].porc * 100) / 100;
         this.rubros[0] = num1 + num2

         num1 = (this._consumos[indice].idcategoria.fijosanea - 0.5) * this._consumos[indice].porc
         num1 = Math.round(num1 * 100) / 100;
         num2 = (this.m3 * this._consumos[indice].saneamiento / 2) * this._consumos[indice].porc
         num2 = Math.round(num2 * 100) / 100;
         num3 = 0.5 * this._consumos[indice].porc
         num3 = Math.round(num3 * 100) / 100;
         this.rubros[1] = num1 + num2 + num3

         num1 = (this.m3 * this._consumos[indice].saneamiento / 2) * this._consumos[indice].porc;
         this.rubros[2] = Math.round(num1 * 100) / 100;

         this.rubros[3] = .1;
         this.total = this.rubros[0] + this.rubros[1] + this.rubros[2] + this.rubros[3]
      } else {
         num1 = Math.round((this._consumos[indice].idcategoria.fijoagua - 0.1) * 100) / 100;
         num2 = Math.round((this.m3 * this._consumos[indice].agua) * 100) / 100;
         this.rubros[0] = num1 + num2

         num1 = this._consumos[indice].idcategoria.fijosanea - 0.5
         num1 = Math.round(num1 * 100) / 100;
         num2 = (this.m3 * this._consumos[indice].saneamiento / 2)
         num2 = Math.round(num2 * 100) / 100;
         num3 = 0.5
         this.rubros[1] = num1 + num2 + num3

         num1 = this.m3 * this._consumos[indice].saneamiento / 2
         this.rubros[2] = Math.round(num1 * 100) / 100;

         this.rubros[3] = .1;
         this.total = this.rubros[0] + this.rubros[1] + this.rubros[2] + this.rubros[3]
      }
   }

}
