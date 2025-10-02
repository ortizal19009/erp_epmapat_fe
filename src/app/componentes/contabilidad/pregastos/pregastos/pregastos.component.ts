import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { ColoresService } from 'src/app/compartida/colores.service';
import { Presupue } from 'src/app/modelos/contabilidad/presupue.model';
import { EjecucionService } from 'src/app/servicios/contabilidad/ejecucio.service';
import { PregastoService } from 'src/app/servicios/contabilidad/pregasto.service';

@Component({
   selector: 'app-pregastos',
   templateUrl: './pregastos.component.html',
   styleUrls: ['./pregastos.component.css']
})
export class PregastosComponent implements OnInit {

   _partidas: any;
   buscarPregasto = { codpar: String, nompar: String }
   pargasto = {} as Presupue;
   filtro: string;
   formBuscar: FormGroup;
   swfiltro: boolean;
   swbuscando: boolean;
   txtbuscar: string = 'Buscar';
   totCodificado = 0; totInicia = 0; totModifi = 0;
   totales = false;
   sweliminar: boolean;

   constructor(public fb: FormBuilder, private pregasService: PregastoService, private router: Router,
      public authService: AutorizaService, private coloresService: ColoresService, private ejecuService: EjecucionService) { }

   ngOnInit(): void {
      sessionStorage.setItem('ventana', '/pregastos');
      let coloresJSON = sessionStorage.getItem('/pregastos');
      if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));
      else this.buscaColor();

      this.formBuscar = this.fb.group({
         codpar: '',
         nompar: '',
      });
      //Datos de búsqueda: guardados o toda el Preingreso
      this.buscarPregasto = JSON.parse(sessionStorage.getItem("buscarPregasto")!);
      if (this.buscarPregasto != null) {
         this.formBuscar.patchValue({
            codpar: this.buscarPregasto.codpar,
            nompar: this.buscarPregasto.nompar
         });
         if (this.formBuscar.value.codpar != '' || this.formBuscar.value.nompar != '') this.buscar();
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

   async buscaColor() {
      try {
         const datos = await this.coloresService.setcolor(this.authService.idusuario, 'pregastos');
         const coloresJSON = JSON.stringify(datos);
         sessionStorage.setItem('/pregastos', coloresJSON);
         this.colocaColor(datos);
      } catch (error) { console.error(error); }
   }

   buscar() {
      this.swbuscando = true;
      this.txtbuscar = 'Buscando'
      let codpar = '';
      if (this.formBuscar.value.codpar != null) codpar = this.formBuscar.value.codpar;
      let nompar = '';
      if (this.formBuscar.value.nompar != null) nompar = this.formBuscar.value.nompar.toLowerCase();
      this.pregasService.getPregasto(2, codpar, nompar).subscribe({
         next: resp => {
            this._partidas = resp;
            this.buscarPregasto = {
               codpar: this.formBuscar.value.codpar,
               nompar: this.formBuscar.value.nompar
            };
            sessionStorage.setItem("buscarPregasto", JSON.stringify(this.buscarPregasto));
            // sessionStorage.setItem('busPregasCodpar', this.formBuscar.controls['codpar'].value == null ? '' : this.formBuscar.controls['codpar'].value);
            // sessionStorage.setItem('busPregasNompar', this.formBuscar.controls['nompar'].value == null ? '' : this.formBuscar.controls['nompar'].value);
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
      this.swbuscando = false;
      this.txtbuscar = 'Buscar'
   }

   onInputChange() {
      if (this.filtro.trim() !== '') {
         this.swfiltro = true;
      } else {
         this.swfiltro = false;
      }
   }

   onCellClick(event: any, pargas: Presupue) {
      const tagName = event.target.tagName;
      if (tagName === 'TD') {
         //Guarda los datos a enviar a aux-gasto
         let codpar = pargas.codpar;
         let nompar = pargas.nompar;
         let inicia = pargas.inicia;
         sessionStorage.setItem("pargasToAuxiliar", JSON.stringify( { codpar, nompar, inicia } ));
         this.router.navigate(['aux-gasto']);
      }
   }

   addPregasto() { this.router.navigate(['/add-pregasto']); }

   modiPregasto(intpre: number) {
      sessionStorage.setItem("intpreGToModi", intpre.toString());
      this.router.navigate(['/modi-pregasto']);
   }

   eliminar(partida: Presupue) {
      this.sweliminar = false;
      this.ejecuService.tieneEjecucio(partida.codpar.toString()).subscribe({
         next: resp => {
            this.sweliminar = !resp
            this.pargasto.intpre = partida.intpre;
            this.pargasto.codpar = partida.codpar;
         },
         error: err => console.error('Al buscar la Ejecucuón de la Partida: ', err.error),
      });
   }

   elimina() {
      this.pregasService.deletePregasto(this.pargasto.intpre).subscribe({
         next: resp => this.buscar(),
         error: err => console.error('Al eliminar la Partida de Gastos: ', err.error),
      });
   }

   imprimir() {
      sessionStorage.setItem("pregastoToImpExp", JSON.stringify(this.buscarPregasto));
      this.router.navigate(['/imp-pregasto']);
   }
}
