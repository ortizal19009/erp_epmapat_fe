import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { ClasificadorService } from 'src/app/servicios/clasificador.service';
import { PresupueService } from 'src/app/servicios/contabilidad/presupue.service';

@Component({
   selector: 'app-info-clasificador',
   templateUrl: './info-clasificador.component.html',
   styleUrls: ['./info-clasificador.component.css']
})

export class InfoClasificadorComponent implements OnInit {

   formBuscar: FormGroup;
   opcion: number = 1;
   iclasificador = {} as iClasificador; //Interface para los datos del Clasificador
   date: Date = new Date();
   today: number = Date.now();
   _partidas: any;
   suminicia: number = 0;
   swsuminicia: boolean = false;
   _movimientos: any;
   codpar: String;

   constructor(public fb: FormBuilder, private router: Router,
      private presuService: PresupueService, private clasifService: ClasificadorService) { }

   ngOnInit(): void {
      sessionStorage.setItem('ventana', '/clasificador');
      let coloresJSON = sessionStorage.getItem('/clasificador');
      if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));

      const fecha = new Date();
      const año = fecha.getFullYear()
      this.formBuscar = this.fb.group({
         codpar: '',
         nompar: '',
         desdeFecha: año + '-01-01',
         hastaFecha: año + '-01-31',
         tiprep: 0
      });
      this.datosClasificador();

   }

   colocaColor(colores: any) {
      document.documentElement.style.setProperty('--bgcolor1', colores[0]);
      const cabecera = document.querySelector('.cabecera');
      if (cabecera) cabecera.classList.add('nuevoBG1')
      document.documentElement.style.setProperty('--bgcolor2', colores[1]);
      const detalle = document.querySelector('.detalle');
      if (detalle) detalle.classList.add('nuevoBG2');
   }

   datosClasificador() {
      let intcla = sessionStorage.getItem('intclaToInfo');
      this.clasifService.getById(+intcla!).subscribe({
         next: resp => {
            this.formBuscar.patchValue({
               codpar: resp.codpar,
               nompar: resp.nompar
            });
            this.iclasificador.intcla = resp.intcla;
            this.iclasificador.codpar = resp.codpar;
            this.iclasificador.nivpar = resp.nivpar;
            this.iclasificador.grupar = resp.grupar;
            this.iclasificador.nompar = resp.nompar;
            this.iclasificador.despar = resp.despar;
            this.buscar();
         },
         error: err => console.error(err.error),
      })
   }

   opciones(opcion: number) {
      this.opcion = opcion;
   }

   regresar() { this.router.navigate(['/clasificador']); }

   buscar() {
      if (this.opcion == 1) {
         this.presuService.getClasificador(this.iclasificador.codpar).subscribe({
            next: datos => {
               this._partidas = datos;
               this.totinicia();
            },
            error: err => console.error(err.error),
         });
      }
      if (this.opcion == 2) {
         
      }
   }

   totinicia() {
      this.suminicia = 0;
      this.swsuminicia = false;
      this._partidas.forEach((partida: any) => {
         this.suminicia = this.suminicia + partida.inicia;
         this.swsuminicia = true;
      });
   }

}

interface iClasificador {
   intcla: number;
   codpar: String;
   nivpar: number;
   grupar: String;
   nompar: String;
   despar: String;
}