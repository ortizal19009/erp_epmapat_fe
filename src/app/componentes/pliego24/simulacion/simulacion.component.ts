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
   porcResidencial: number[] = [0.777, 0.78, 0.78, 0.78, 0.78, 0.778, 0.778, 0.778, 0.78, 0.78, 0.78, 0.68, 0.68, 0.678, 0.68, 0.68, 0.678, 0.678, 0.68,
      0.68, 0.678, 0.676, 0.678, 0.678, 0.678, 0.68, 0.647, 0.65, 0.65, 0.647, 0.647, 0.65, 0.65, 0.647, 0.647, 0.65, 0.65, 0.65,
      0.65, 0.65, 0.65, 0.7, 0.7, 0.7, 0.7, 0.7, 0.7, 0.7, 0.7, 0.7, 0.7, 0.7, 0.7, 0.7, 0.7, 0.7, 0.7, 0.7, 0.7, 0.7, 0.7, 0.7,
      0.7, 0.7, 0.7, 0.7, 0.7, 0.7, 0.7, 0.7, 0.7]

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
         let num1 = 0;
         if (this.anio == 1) {

            if (this._consumos[i].idcategoria.idcategoria == 1) { num1 = Math.round((this._consumos[i].idcategoria.fijoagua - 0.1) * this.porcResidencial[this.m3] * 100) / 100; }
            else { num1 = Math.round((this._consumos[i].idcategoria.fijoagua - 0.1) * this._consumos[i].porc * 100) / 100; }

            let num2 = Math.round((this._consumos[i].idcategoria.fijosanea - 0.5) * this._consumos[i].porc * 100) / 100;
            let num3 = Math.round((this.m3 * this._consumos[i].agua) * this._consumos[i].porc * 100) / 100;
            let num4 = Math.round((this.m3 * this._consumos[i].saneamiento / 2) * this._consumos[i].porc * 100) / 100;
            let num5 = Math.round((this.m3 * this._consumos[i].saneamiento / 2) * this._consumos[i].porc * 100) / 100;
            let num7 = Math.round(0.5 * this._consumos[i].porc * 100) / 100;
            suma = suma + num1 + num2 + num3 + num4 + num5 + 0.1 + num7;

            this.subtotales[i] = suma;
            this.subtotales[4] = this.subtotales[0] / 2; //Categoria 9 (Especial) no tiene tarifario es el 50% de la residencial

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
         if (this._consumos[indice].idcategoria.idcategoria == 1) { this.formulas[0] = ' (' + this._consumos[indice].idcategoria.fijoagua.toString() + ' - 0.10) * ' + this.porcResidencial[this.m3].toString() }
         else { this.formulas[0] = ' (' + this._consumos[indice].idcategoria.fijoagua.toString() + ' - 0.10) * ' + this._consumos[indice].porc.toString() }

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
      let num1: number = 0; let num2: number; let num3: number;
      this.antIndice = indice;
      if (this.anio == 1) {
         if (this._consumos[indice].idcategoria.idcategoria != 9) {
            if (this._consumos[indice].idcategoria.idcategoria == 1) { num1 = Math.round((this._consumos[indice].idcategoria.fijoagua - 0.1) * this.porcResidencial[this.m3] * 100) / 100; }
            else { num1 = Math.round((this._consumos[indice].idcategoria.fijoagua - 0.1) * this._consumos[indice].porc * 100) / 100; }

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
         } else {  //Categoria 9 Especial 50% de Residencial (No tiene tarifario propio)
            let indEspecial = 0;
            let x1 = Math.round((this._consumos[indEspecial].idcategoria.fijoagua - 0.1) * this.porcResidencial[this.m3] * 100) / 100;
            let x2 = Math.round((this.m3 * this._consumos[indEspecial].agua) * this._consumos[indEspecial].porc * 100) / 100;
            let rubros0 = Math.round((x1 + x2) * 100) / 100

            let x3 = Math.round((this._consumos[indEspecial].idcategoria.fijosanea - 0.5) * this._consumos[indEspecial].porc * 100) / 100
            let x4 = Math.round((this.m3 * this._consumos[indEspecial].saneamiento / 2) * this._consumos[indEspecial].porc * 100) / 100
            let x5 = Math.round(0.5 * this._consumos[indEspecial].porc * 100) / 100;
            let rubros1 = Math.round((x3 + x4 + x5) * 100) / 100

            let x6 = Math.round((this.m3 * this._consumos[indEspecial].saneamiento / 2) * this._consumos[indEspecial].porc * 100) / 100 ;
            let rubros2 = x6;

            let rubros3 = .1;

            this.total = Math.round((rubros0 + rubros1 + rubros2 + rubros3) / 2 * 100) / 100;
            this.rubros[1] = Math.round(rubros1 / 2 * 100) / 100
            this.rubros[2] = Math.round(rubros2 / 2 * 100) / 100
            this.rubros[3] = .1;
            // this.rubros[0] = Math.round((this.total - this.rubros[1] - this.rubros[2] - this.rubros[3] ) * 100) / 100;
            this.rubros[0] = this.total - this.rubros[1] - this.rubros[2] - this.rubros[3]
         }

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
