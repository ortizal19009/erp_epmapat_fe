import { Component } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { ColoresService } from 'src/app/compartida/colores.service';
import { Reformas } from 'src/app/modelos/contabilidad/reformas.model';
import { EjecucionService } from 'src/app/servicios/contabilidad/ejecucio.service';
import { ReformasService } from 'src/app/servicios/contabilidad/reformas.service';

@Component({
   selector: 'app-reformas',
   templateUrl: './reformas.component.html',
   styleUrls: ['./reformas.component.css']
})

export class ReformasComponent {
   formBuscar: FormGroup;
   _reformas: any;
   swdesdehasta: boolean; //Visibilidad Buscar últimos
   buscarReformas: { desdeNum: number, hastaNum: number, desdeFecha: string, hastaFecha: string }
   today: number = Date.now();
   filtro: string;
   // elimdisabled = false;
   disabled = false;
   idrefo: number;
   ireforma = {} as iReforma; //Interface para los datos de la Reforma a eliminar
   totmovi: number = 1;  //Por default no puede eliminar

   constructor(public fb: FormBuilder, private refoService: ReformasService, private router: Router,
      public authService: AutorizaService, private coloresService: ColoresService, private ejecuService: EjecucionService) { }

   ngOnInit(): void {
      sessionStorage.setItem('ventana', '/reformas');
      let coloresJSON = sessionStorage.getItem('/reformas');
      if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));
      else this.buscaColor();

      const fecha = new Date();
      const año = fecha.getFullYear();
      this.formBuscar = this.fb.group({
         desdeNum: '',
         hastaNum: '',
         desdeFecha: año + '-01-01',
         hastaFecha: año + '-12-31',
      });

      //Datos de búsqueda: últimas Reformas o guardadas
      this.buscarReformas = JSON.parse(sessionStorage.getItem("buscarReformas")!);
      if (this.buscarReformas == null) this.ultimaReforma();
      else {
         this.formBuscar.patchValue({
            desdeNum: this.buscarReformas.desdeNum,
            hastaNum: this.buscarReformas.hastaNum,
            desdeFecha: this.buscarReformas.desdeFecha,
            hastaFecha: this.buscarReformas.hastaFecha
         });
         this.buscar();
      }

      // let buscaReformasHasta = '';
      // let buscaReformasDesde = '';
      // if (!sessionStorage.getItem("buscaReformasHasta")) {
      //    this.refoService.ultimaReforma().subscribe({
      //       next: datos => {
      //          buscaReformasHasta = datos.numero.toString();
      //          if (+buscaReformasHasta - 15 < 0) buscaReformasDesde = '1';
      //          else buscaReformasDesde = (+buscaReformasHasta - 15).toString();
      //          this.formBuscar.patchValue({
      //             desde: buscaReformasDesde,
      //             hasta: buscaReformasHasta,
      //          });
      //          this.buscar();
      //       },
      //       error: err => console.error('Al buscar la última Reforma: ', err.error)
      //    });
      // } else {
      //    buscaReformasHasta = sessionStorage.getItem("buscaReformasHasta")!;
      //    buscaReformasDesde = sessionStorage.getItem("buscaReformasDesde")!;
      //    this.formBuscar.patchValue({
      //       desde: buscaReformasDesde,
      //       hasta: buscaReformasHasta,
      //    });
      //    this.buscar();
      // }
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
         const datos = await this.coloresService.setcolor(this.authService.idusuario, 'reformas');
         const coloresJSON = JSON.stringify(datos);
         sessionStorage.setItem('/reformas', coloresJSON);
         this.colocaColor(datos);
      } catch (error) { console.error(error); }
   }

   ultimaReforma() {
      this.refoService.ultimaReforma().subscribe({
         next: resp => {
            let desde = resp.numero - 16;
            if (desde <= 0) desde = 1;
            this.formBuscar.patchValue({
               desdeNum: desde,
               hastaNum: resp.numero,
            });
            this.buscar();
         },
         error: err => console.error(err.error)
      });
   }

   changeDesdeHasta() { this.swdesdehasta = true; }

   busquedainicial() {
      sessionStorage.removeItem('buscarReformas');
      this.swdesdehasta = false;
      this.ultimaReforma();
   }

   buscar() {
      this.refoService.buscaByNumfec(this.formBuscar.value.desdeNum, this.formBuscar.value.hastaNum).subscribe({
         next: datos => {
            this._reformas = datos;
            //Guarda los datos de búsqueda
            this.buscarReformas = {
               desdeNum: this.formBuscar.value.desdeNum,
               hastaNum: this.formBuscar.value.hastaNum,
               desdeFecha: this.formBuscar.value.desdeFecha,
               hastaFecha: this.formBuscar.value.hastaFecha
            };
            sessionStorage.setItem("buscarReformas", JSON.stringify(this.buscarReformas));
         },
         error: err => console.error('Al buscar las Reformas: ', err.error)
      });
   }

   onCellClick(event: any, reformas: Reformas) {
      const tagName = event.target.tagName;
      if (tagName === 'TD') {
         sessionStorage.setItem('idrefoToEjecucion', reformas.idrefo.toString());
         this.router.navigate(['ejecucion']);
      }
   }

   onCellClick1(reformas: Reformas) {
      this.idrefo = reformas.idrefo;
   };

   addReforma() {
      this.router.navigate(['add-reforma']);
   }

   modiReforma(reformas: Reformas) {
      sessionStorage.setItem("idrefoToModi", reformas.idrefo.toString());
      this.router.navigate(['/modi-reforma']);
   }

   eliminar(reforma: Reformas) {
      this.ireforma.idrefo = reforma.idrefo;
      this.ireforma.numero = reforma.numero;
      this.totmovi = 1;  //Para que por default no pueda eliminar
      // this.ejecuService.getByIdrefo( this.ireforma.idrefo ).subscribe({
      //    next: resp => this.totmovi = resp,
      //    error: err => console.error('Al contar las partidas de la Reforma: ', err.error)
      // });
   }

   elimina() {
      this.refoService.deleteReforma(this.ireforma.idrefo).subscribe({
         next: datos => this.buscar(),
         error: err => console.error(err.error)
      });
   }

}

interface iReforma {
   idrefo: number;
   numero: number
}
