import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { PreingresoService } from 'src/app/servicios/contabilidad/preingreso.service';
import { ColoresService } from 'src/app/compartida/colores.service';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { EjecucionService } from 'src/app/servicios/contabilidad/ejecucio.service';

@Component({
   selector: 'app-preingresos',
   templateUrl: './preingresos.component.html',
   styleUrls: ['./preingresos.component.css']
})
export class PreingresosComponent implements OnInit {

   _presupuei: any;
   formBuscar: FormGroup;
   buscarPreingreso = { codpar: String, nompar: String }
   filtro: string;
   swfiltro: boolean;
   disabled = false;
   totmovi: number = 1;  //Por default no puede eliminar
   intpre: number;
   antcodpar: string;
   swbuscando: boolean;
   txtbuscar: string = 'Buscar';
   totCodificado = 0; totInicia = 0; totModifi = 0;
   totales = false;
   otraPagina: boolean = false;
   archExportar: string;

   constructor(public fb: FormBuilder, private preingService: PreingresoService, private router: Router,
      public authService: AutorizaService, private coloresService: ColoresService, private ejecuService: EjecucionService) { }

   ngOnInit(): void {
      sessionStorage.setItem('ventana', '/preingresos');
      let coloresJSON = sessionStorage.getItem('/preingresos');
      if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));
      else this.buscaColor();

      this.formBuscar = this.fb.group({
         codpar: '',
         nompar: '',
         filtro: '',
      });

      //Datos de búsqueda: guardados o toda el Preingreso
      this.buscarPreingreso = JSON.parse(sessionStorage.getItem("buscarPreingreso")!);
      if (this.buscarPreingreso != null) {
         this.formBuscar.patchValue({
            codpar: this.buscarPreingreso.codpar,
            nompar: this.buscarPreingreso.nompar
         });
      }
      this.buscar();
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
         const datos = await this.coloresService.setcolor(this.authService.idusuario, 'preingresos');
         const coloresJSON = JSON.stringify(datos);
         sessionStorage.setItem('/preingresos', coloresJSON);
         this.colocaColor(datos);
      } catch (error) { console.error(error); }
   }

   buscar() {
      this.swbuscando = true;
      this.txtbuscar = 'Buscando'
      this.preingService.getParingreso(this.formBuscar.value.codpar, this.formBuscar.value.nompar).subscribe({
         next: resp => {
            this._presupuei = resp;
            this.buscarPreingreso = {  //Guarda los datos de búsqueda (por default se buscan todas las partidas)
               codpar: this.formBuscar.value.codpar,
               nompar: this.formBuscar.value.nompar
            };
            sessionStorage.setItem("buscarPreingreso", JSON.stringify(this.buscarPreingreso));
            this.totales = true;
            this.total()
         },
         error: err => console.error(err.error)
      });
   }

   total() {
      let sumInicia: number = 0;
      let sumModifi: number = 0;
      let i = 0;
      this._presupuei.forEach(() => {
         sumInicia += this._presupuei[i].inicia;
         sumModifi += this._presupuei[i].totmod;
         i++;
      });
      this.totInicia = sumInicia;
      this.totModifi = sumModifi;
      this.totCodificado = sumInicia + sumModifi;
      this.swbuscando = false;
      this.txtbuscar = 'Buscar'
   }

   onInputChange() {
      if (this.filtro.trim() !== '') this.swfiltro = true;
      else this.swfiltro = false;
   }

   onCellClick(event: any, paring: any) {
      const tagName = event.target.tagName;
      if (tagName === 'TD') {
         //Guarda los datos a enviar a aux-ingreso
         sessionStorage.setItem('paringToAuxiliar', JSON.stringify( { codpar: paring.codpar, nompar: paring.nompar } ));
         this.router.navigate(['aux-ingreso']);
      }
   }

   nuevo() { this.router.navigate(['/add-preingreso']); }

   modificar(intpre: number) {
      sessionStorage.setItem("intpreToModi", intpre.toString());
      this.router.navigate(["/modi-preingreso"]);
   }

   eliminar(preing: any) {
      this.antcodpar = preing.codpar;  //Para el mensaje de eliminar
      this.intpre = preing.intpre;
      this.totmovi = 1;  //Para que por default no pueda eliminar
      this.ejecuService.countByIntpre(preing.intpre).subscribe({
         next: resp => this.totmovi = resp,
         error: err => console.error('Al contar los movimientos de la partida: ', err.error)
      });
   }

   elimina() {
      if (this.intpre != null) {
         this.preingService.deletePreingreso(this.intpre).subscribe({
            next: resp => this.buscar(),
            error: err => console.error('Al eliminar Partida de INgresos: ', err.error),
         });
      }
   }

   imprimir() {
      sessionStorage.setItem("preingresoToImpExp", JSON.stringify(this.buscarPreingreso));
      this.router.navigate(['/imp-preingreso']);
   }

}
