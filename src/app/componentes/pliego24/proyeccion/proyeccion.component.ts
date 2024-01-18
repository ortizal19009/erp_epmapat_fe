import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { Lecturas } from 'src/app/modelos/lecturas.model';
import { LecturasService } from 'src/app/servicios/lecturas.service';
import { Pliego24Service } from 'src/app/servicios/pliego24.service';
import { RutasxemisionService } from 'src/app/servicios/rutasxemision.service';

@Component({
   selector: 'app-proyeccion',
   templateUrl: './proyeccion.component.html',
   styleUrls: ['./proyeccion.component.css']
})
export class ProyeccionComponent implements OnInit {

   formBuscar: FormGroup;
   selectedOption: FormControl;
   _rutasxemi: any;
   _lecturas: any;
   formCalcular: FormGroup;
   contador = 0;
   progreso = 0;
   totlecturas: number;
   idrutaxemision: number;
   index: number;
   gradualidad: number;
   ruta: String;
   solicitudCompletada = false; // Variable de bandera
   boton = 1;

   constructor(private ruxemiService: RutasxemisionService, private lecService: LecturasService, public fb: FormBuilder,
      private pli24Service: Pliego24Service, private router: Router) { }

   ngOnInit(): void {
      this.selectedOption = new FormControl('1');
      this.formBuscar = this.fb.group({
         selecGradualidad: this.selectedOption,
      });
      this.formCalcular = this.fb.group({
         m3: ['0'],
      });
      this.setcolor();
      this.rutasxemision();
   }

   setcolor() {
      let colores: string[];
      let coloresJSON = sessionStorage.getItem('/proyeccion');
      if (!coloresJSON) {
         colores = ['rgb(57, 95, 95)', 'rgb(207, 221, 210)'];
         const coloresJSON = JSON.stringify(colores);
         sessionStorage.setItem('/proyeccion', coloresJSON);
      } else colores = JSON.parse(coloresJSON);

      document.documentElement.style.setProperty('--bgcolor1', colores[0]);
      const cabecera = document.querySelector('.cabecera');
      if (cabecera) cabecera.classList.add('nuevoBG1')
      document.documentElement.style.setProperty('--bgcolor2', colores[1]);
      const detalle = document.querySelector('.detalle');
      if (detalle) detalle.classList.add('nuevoBG2');
   }

   rutasxemision() {
      this.ruxemiService.getByIdEmision(213).subscribe({
         next: datos => {
            this._rutasxemi = datos;
         },
         error: err => console.error(err.error)
      });
   }

   private continuarPromise: () => void;

   async iniciar() {
      for (let i = 0; i < this._rutasxemi.length; i++) {
         this.index = i;
         this.solicitudCompletada = false;
         if (this.boton != 1) {
            await this.esperarContinuación();
         }
         this.boton = 0
         this.lecService.getLecturas(this._rutasxemi[i].idrutaxemision).subscribe({
            next: datos => {
               this._lecturas = datos;
               this.ruta = this._rutasxemi[i].idruta_rutas.descripcion;
               this.totlecturas = this._lecturas.length;
               this.solicitudCompletada = true;
               this.progreso = 0;
            },
            error: err => {
               console.error(err.error);
               this.solicitudCompletada = true;
            }
         });
         // console.log(`Iteración ${i}`);
      }
   }

   esperarContinuación(): Promise<void> {
      return new Promise<void>((resolve) => {
         this.continuarPromise = resolve;
      });
   }

   continua() {

      if (this.continuarPromise) {
         this.continuarPromise(); // Resuelve la promesa para continuar
      }
   }

   //Boton Continuar
   continuar() {
      this.continua();
      this.calcula();
      this.boton = 2;
   }

   cancelar() { this.boton = 1 }

   regresar() { this.router.navigate(['/pliego24']); }

   calcula() {
      let totalm3 = 0;
      this.contador = 0;

      for (let j = 0; j < this._lecturas.length; j++) {
         this.contador++;
         this.progreso = (this.contador / this._lecturas.length) * 100;
         let idlectura = this._lecturas[j].idlectura;
         let idcategoria = this._lecturas[j].idcategoria;
         let m3 = this._lecturas[j].lecturaactual - this._lecturas[j].lecturaanterior;
         totalm3 = totalm3 + m3;
         if (idcategoria == 9 && m3 > 34) { }
         else {
            this.gradualidad = +this.selectedOption.value;
            this.pli24Service.getBloque(idcategoria, m3).subscribe({
               next: datos => {
                  const tarifa = datos;
                  let total = 0;
                  switch (this.gradualidad) {
                     case 1:

                        let num1 = Math.round((tarifa[0].idcategoria.fijoagua - 0.1) * tarifa[0].porc * 100) / 100;
                        let num2 = Math.round((tarifa[0].idcategoria.fijosanea - 0.5) * tarifa[0].porc * 100) / 100;
                        
                        let num3 = Math.round(( m3 * tarifa[0].agua) * tarifa[0].porc * 100) / 100;
                        let num4 = Math.round(( m3 * tarifa[0].saneamiento / 2) * tarifa[0].porc * 100) / 100;
                        let num5 = Math.round(( m3 * tarifa[0].saneamiento / 2) * tarifa[0].porc * 100) / 100;
                        let num7 = Math.round(0.5 * tarifa[0].porc * 100) / 100;
                        // suma = suma + num1 + num2 + num3 + num4 + num5 + 0.1 + num7;
                        // console.log('m3 y categoria: ', m3, idcategoria);
                        // console.log('num1, num2: ', num1, num2, num3, num4, num5, num7);
                        total = num1 + num2 + num3 + num4 + num5 + 0.1 + num7;;
                        break;
                     case 2:
                        total = tarifa[0].idcategoria.fijo31 + tarifa[0].idcategoria.fijo31 + (m3 * tarifa[0].agua) + (m3 * tarifa[0].saneamiento) + 0.10;
                        break;
                     default:
                        console.log('Gradualidad incorrecta')
                  }

                  this.lecService.getByIdlectura(idlectura).subscribe({
                     next: resp => {
                        const lectura = resp;
                        switch (this.gradualidad) {
                           case 1:
                              lectura.total1 = total;
                              break;
                           case 2:
                              lectura.total31 = total;
                              break;
                        }
                        this.lecService.updateLectura(idlectura, lectura).subscribe({
                           next: nex => { },
                           error: err => console.error('Al actualizar la Lectura: ', err.error)
                        });
                     }
                  });
               },
               error: err => console.error('Al obtener la Tarifa: ', err.error)
            });
         }
      }  //Next j
      this.solicitudCompletada = false;
      this.boton = 3;
      // this.contador = 0;
      this._rutasxemi[this.index - 1].m3 = 1;

      //Actualiza rutasxemi.m3 y rutasxemi.total
      // this.ruxemiService.getById(this.idrutaxemision).subscribe({
      //    next: resp => {
      //       const rutaxemision = resp;
      //       rutaxemision.m3 = totalm3;
      //       // rutaxemision.total = sumtotal;
      //       this.ruxemiService.updateRutaxemision(this.idrutaxemision, rutaxemision).subscribe({
      //          next: nex => { this._rutasxemi[this.index].m3 = totalm3 },
      //          error: err => console.error('Al actualizar los m3 de la rutaxemision: ', err.error)
      //       });
      //    }
      // });
   }

}
