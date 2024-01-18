import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { Presupue } from 'src/app/modelos/contabilidad/presupue.model';
import { EjecucionService } from 'src/app/servicios/contabilidad/ejecucion.service';
import { PregastoService } from 'src/app/servicios/contabilidad/pregasto.service';

@Component({
   selector: 'app-pregastos',
   templateUrl: './pregastos.component.html',
   styleUrls: ['./pregastos.component.css']
})
export class PregastosComponent implements OnInit {

   _partidas: any;
   pargasto = {} as Presupue;
   filtro: string;
   formBuscar: FormGroup;
   swfiltro: boolean;
   totCodificado = 0; totInicia = 0; totModifi = 0;
   totales = false;
   sweliminar: boolean;

   constructor(public fb: FormBuilder, private pregasService: PregastoService, private router: Router,
      private ejecuService: EjecucionService) { }

   ngOnInit(): void {
      sessionStorage.setItem('ventana', '/pregastos');
      this.setcolor();

      this.formBuscar = this.fb.group({
         codpar: '',
         nompar: '',
      });

      let busPregasCodpar = sessionStorage.getItem("busPregasCodpar") == null ? '' : sessionStorage.getItem("busPregasCodpar");
      let busPregasNompar = sessionStorage.getItem("busPregasNompar") == null ? '' : sessionStorage.getItem("busPregasNompar");
      this.formBuscar.patchValue({
         codpar: busPregasCodpar,
         nompar: busPregasNompar
      });
      if (busPregasCodpar != '' || busPregasNompar != '') this.buscar();
   }

   setcolor() {
      let colores: string[];
      let coloresJSON = sessionStorage.getItem('/pregastos');
      if (!coloresJSON) {
         colores = ['rgb(80, 83, 54)', 'rgb(228, 248, 205)'];
         const coloresJSON = JSON.stringify(colores);
         sessionStorage.setItem('/pregastos', coloresJSON);
      } else colores = JSON.parse(coloresJSON);

      document.documentElement.style.setProperty('--bgcolor1', colores[0]);
      const cabecera = document.querySelector('.cabecera');
      if (cabecera) cabecera.classList.add('nuevoBG1')
      document.documentElement.style.setProperty('--bgcolor2', colores[1]);
      const detalle = document.querySelector('.detalle');
      if (detalle) detalle.classList.add('nuevoBG2');
   }

   buscar() {
      let codpar = '';
      if (this.formBuscar.value.codpar != null) codpar = this.formBuscar.value.codpar;
      let nompar = '';
      if (this.formBuscar.value.nompar != null) nompar = this.formBuscar.value.nompar.toLowerCase();
      this.pregasService.getByTipoCodigoyNombre(2, codpar, nompar).subscribe({
         next: resp => {
            this._partidas = resp;
            sessionStorage.setItem('busPregasCodpar', this.formBuscar.controls['codpar'].value == null ? '' : this.formBuscar.controls['codpar'].value);
            sessionStorage.setItem('busPregasNompar', this.formBuscar.controls['nompar'].value == null ? '' : this.formBuscar.controls['nompar'].value);
            this.totales = true;
            this.total();
         },
         error: err => console.error('Al buscar las Partidas de Gastos: ', err.error)
      });
   }

   total() {
      let sumInicia: number = 0;
      let sumModifi: number = 0;
      let i = 0;
      this._partidas.forEach(() => {
         sumInicia += this._partidas[i].inicia;
         sumModifi += this._partidas[i].totmod;
         i++;
      });
      this.totInicia = sumInicia;
      this.totModifi = sumModifi;
      this.totCodificado = sumInicia + sumModifi;
   }

   onInputChange() {
      if (this.filtro.trim() !== '') {
         this.swfiltro = true;
      } else {
         this.swfiltro = false;
      }
   }

   onCellClick(event: any, presupue: Presupue) {
      const tagName = event.target.tagName;
      if (tagName === 'TD') {
         sessionStorage.setItem('codparToAuxgasto', presupue.codpar.toString());
         sessionStorage.setItem('nomparToAuxiliar', presupue.nompar.toString());
         sessionStorage.setItem('iniciaToAuxiliar', presupue.inicia.toString());
         this.router.navigate(['aux-gasto']);
      }
   }

   addPregasto() { this.router.navigate(['/add-pregasto']); }

   modiPregasto(idpresupue: number) {
      sessionStorage.setItem("idpresupueGToModi", idpresupue.toString());
      this.router.navigate(['/modi-pregasto']);
   }

   eliminar(partida: Presupue) {
      this.sweliminar = false;
      this.ejecuService.tieneEjecucion(partida.codpar.toString()).subscribe({
         next: resp => {
            this.sweliminar = !resp
            this.pargasto.idpresupue = partida.idpresupue;
            this.pargasto.codpar = partida.codpar;
         },
         error: err => console.error('Al buscar la Ejecucuón de la Partida: ', err.error),
      });
   }

   elimina() {
      this.pregasService.deletePregasto(this.pargasto.idpresupue).subscribe({
         next: resp => this.buscar(),
         error: err => console.error('Al eliminar la Partida de Gastos: ', err.error),
      });
   }

}
