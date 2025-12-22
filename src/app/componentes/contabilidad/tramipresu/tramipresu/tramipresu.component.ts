import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { ColoresService } from 'src/app/compartida/colores.service';
// import { Tramipresu } from 'src/app/modelos/contabilidad/tramipresu.model';
import { TramipresuService } from 'src/app/servicios/contabilidad/tramipresu.service';

@Component({
   selector: 'app-tramipresu',
   templateUrl: './tramipresu.component.html',
   styleUrls: ['./tramipresu.component.css']
})
export class TramipresuComponent implements OnInit {

   formBuscar: FormGroup;
   filtro: string;
   today: number = Date.now();
   _tramipresu: any;
   buscarTramipresu: { desdeNum: number, hastaNum: number, desdeFecha: string, hastaFecha: string }
   swdesdehasta: boolean; //Visibilidad Buscar últimos
   tramipresu = {} as iTramipresu; //Interface para los datos del Trámite a eliminar
   totmovi: number = 1;  //Por default no puede eliminar

   constructor(private fb: FormBuilder, private router: Router, public authService: AutorizaService, private coloresService: ColoresService,
      private tramiService: TramipresuService) { }

   ngOnInit(): void {
      sessionStorage.setItem('ventana', '/tramipresu');
      let coloresJSON = sessionStorage.getItem('/tramipresu');
      if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));
      else this.buscaColor();

      const fecha = new Date();
      const año = fecha.getFullYear();
      this.formBuscar = this.fb.group({
         desdeNum: 0,
         hastaNum: 0,
         desdeFecha: año + '-01-01',
         hastaFecha: año + '-12-31',
      });

      //Datos de búsqueda: últimos Trámites o guardados
      this.buscarTramipresu = JSON.parse(sessionStorage.getItem("buscarTramipresu")!);
      if (this.buscarTramipresu == null) this.ultimoTramipresu();
      else {
         this.formBuscar.patchValue({
            desdeNum: this.buscarTramipresu.desdeNum,
            hastaNum: this.buscarTramipresu.hastaNum,
            desdeFecha: this.buscarTramipresu.desdeFecha,
            hastaFecha: this.buscarTramipresu.hastaFecha
         });
         this.buscar();
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
         const datos = await this.coloresService.setcolor(this.authService.idusuario, 'tramipresu');
         const coloresJSON = JSON.stringify(datos);
         sessionStorage.setItem('/tramipresu', coloresJSON);
         this.colocaColor(datos);
      } catch (error) { console.error(error); }
   }

   ultimoTramipresu() {
      this.tramiService.ultimoTramipresu().subscribe({
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

   buscar() {
      //Numeros
      let desdeNum: number = 1;
      if (this.formBuscar.value.desdeNum != null) { desdeNum = this.formBuscar.value.desdeNum; }
      let hastaNum: number = 999999999;
      if (this.formBuscar.value.hastaNum != null) { hastaNum = this.formBuscar.value.hastaNum; }
      this.tramiService.getDesdeHasta(desdeNum, hastaNum, this.formBuscar.value.desdeFecha, this.formBuscar.value.hastaFecha).subscribe({
         next: datos => {
            this._tramipresu = datos;
            this.buscarTramipresu = {  //Guarda los datos de búsqueda
               desdeNum: this.formBuscar.value.desdeNum,
               hastaNum: this.formBuscar.value.hastaNum,
               desdeFecha: this.formBuscar.value.desdeFecha,
               hastaFecha: this.formBuscar.value.hastaFecha
            };
            sessionStorage.setItem("buscarTramipresu", JSON.stringify(this.buscarTramipresu));
         },
         error: (err) => console.error(err.error),
      });
   }

   changeDesdeHasta() { this.swdesdehasta = true; }

   busquedainicial() {
      sessionStorage.removeItem('buscarTramipresu');
      this.swdesdehasta = false;
      this.ultimoTramipresu();
   }

   addTramite() { this.router.navigate(['add-tramipresu']); }

   // detallesTramipresu(event: any, d_tramipresu: any) {
   //    if (event.target.classList.contains('dropdown-toggle')) {
   //    } else {
   //       this.router.navigate(['compromiso', d_tramipresu.idtrami]);
   //    }
   // }

   compromisos(event: any, tramipresu: iTramipresu) {
      const tagName = event.target.tagName;
      if (tagName === 'TD') {
         // this.datosBuscar();
         sessionStorage.setItem('idtramiToPrmisoxtrami', tramipresu.idtrami.toString());
         this.router.navigate(['prmisoxtrami']);
      }
   }

   listarTramiPresu() {
      // this.tramiService.getDesdeHasta().subscribe({
      //    next: (datos) => {
      //       console.log(datos);
      //       this.v_tramipresu = datos;
      //    },
      //    error: (e) => console.error(e),
      // });
   }

   // retroceder() { this.targ_partida = true; }

   selectPartidas(partidas: any) {
      // console.log(partidas);
      this.router.navigate(['add-tramipresu', partidas.idparxcer]);
      /*     this.targ_partida = false;
      console.log(partidas)
      this.partida = partidas; */
   }

   modiTramipresu(tramipresu: any) {
      // console.log(tramipresu);
      sessionStorage.setItem("idtramiToModi", tramipresu.idtrami.toString());
      this.router.navigate(['/modi-tramipresu']);
   }

   eliminar(tramipresu: iTramipresu) {
      this.tramipresu.idtrami = tramipresu.idtrami;
      this.tramipresu.numero = tramipresu.numero;
      //this.numero = certipresu.numero;  //Para el mensaje de eliminar
      // this.idcerti = certipresu.idcerti;
      this.totmovi = 1;  //Para que por default no pueda eliminar
      // this.ejecuService.countByIntpre(preing.intpre).subscribe({
      //    next: resp => this.totmovi = resp,
      //    error: err => console.error('Al contar los movimientos de la partida: ', err.error)
      // });
   }

   elimina() {
      // this.tramiService. .deleteCertipresu(this.certipresu.idcerti).subscribe({
      //    next: datos => this.buscar(),
      //    error: err => console.error(err.error)
      // });
   }

}

interface iTramipresu {
   idtrami: number;
   numero: number
}
