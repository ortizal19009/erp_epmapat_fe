import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { ColoresService } from 'src/app/compartida/colores.service';
import { RubroxfacService } from 'src/app/servicios/rubroxfac.service';

@Component({
   selector: 'app-regrecauda',
   templateUrl: './regrecauda.component.html',
   styleUrls: ['./regrecauda.component.css']
})

export class RegrecaudaComponent implements OnInit {

   formBuscar: FormGroup;
   _cobradas: any[] = [];
   _rubrosanterior: any[] = [];
   swbuscando: boolean;
   txtbuscar: string = 'Buscar';

   constructor(private fb: FormBuilder, private router: Router, private rxfService: RubroxfacService,
      public authService: AutorizaService, private coloresService: ColoresService) { }

   ngOnInit(): void {
      sessionStorage.setItem('ventana', '/regrecauda');
      let coloresJSON = sessionStorage.getItem('/regrecauda');
      if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));
      else this.buscaColor();

      const fechaActual = new Date();
      this.formBuscar = this.fb.group({
         registrar: 1,
         fecha: obtenerFechaActualString( fechaActual ),
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

   async buscaColor() {
      try {
         const datos = await this.coloresService.setcolor(this.authService.idusuario, 'regrecauda');
         const coloresJSON = JSON.stringify(datos);
         sessionStorage.setItem('/regrecauda', coloresJSON);
         this.colocaColor(datos);
      } catch (error) { console.error(error); }
   }

   async buscar() {
      this.swbuscando = true;
      this.txtbuscar = 'Buscando';
      let fecha = this.formBuscar.value.fecha;
      let hasta = '2023-12-31'
      try {
         this._cobradas = await this.rxfService.getTotalRubrosActualAsync(fecha, hasta);
         // console.log('this._cobradas: ', this._cobradas)

         try {
            this._rubrosanterior = await this.rxfService.getTotalRubrosAnteriorAsync(fecha, hasta);
            this.swbuscando = false;
            this.txtbuscar = 'Buscar';

         } catch (error) {
            console.error('Error al obtener los Rubros anteriores:', error);
         }
      } catch (error) {
         console.error('Error al obtener los Rubros actuales:', error);
      }
   }

}

function obtenerFechaActualString(fecha: Date) {
   const milisegundos = fecha.getTime(); // Obtener milisegundos desde la fecha
   const fechaActual = new Date(milisegundos);
   const anio = fechaActual.getFullYear();
   const mes = fechaActual.getMonth() + 1; // Los meses en JavaScript van de 0 a 11
   const dia = fechaActual.getDate();

   // Formatear la fecha a string con el formato deseado
   return `${anio}-${mes.toString().padStart(2, '0')}-${dia.toString().padStart(2, '0')}`;
 }
