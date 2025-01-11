import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { ColoresService } from 'src/app/compartida/colores.service';
import { Asientos } from 'src/app/modelos/contabilidad/asientos.model';
import { AsientosService } from 'src/app/servicios/contabilidad/asientos.service';
import { TransaciService } from 'src/app/servicios/contabilidad/transaci.service';

@Component({
   selector: 'app-egresos',
   templateUrl: './egresos.component.html',
   styleUrls: ['./egresos.component.css']
})
export class EgresosComponent implements OnInit {

   _egresos: any;
   buscaEgresos: { desdeNum: number, hastaNum: number, desdeFecha: string, hastaFecha: string }
   formBuscar: FormGroup;
   today: number = Date.now();
   date: Date = new Date();
   swdesdehasta: boolean; //Visibilidad Buscar últimos
   iAsiento = {} as interfaceEgreso; //Interface para los datos del Egreso
   filtro: string;
   disabTipcom: boolean = true;
   sweliminar: boolean = false;

   constructor(private fb: FormBuilder, private router: Router, private asiService: AsientosService,
      public authService: AutorizaService, private coloresService: ColoresService, private tranService: TransaciService) { }

   ngOnInit(): void {
      sessionStorage.setItem('ventana', '/egresos');
      let coloresJSON = sessionStorage.getItem('/egresos');
      if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));
      else this.buscaColor();

      const fecha = new Date();
      const año = fecha.getFullYear()
      this.formBuscar = this.fb.group({
         desdeNum: '',
         hastaNum: '',
         desdeFecha: año + '-01-01',
         hastaFecha: año + '-12-31',
      });

      //Datos de búsqueda último Egreso o guardados
      this.buscaEgresos = JSON.parse(sessionStorage.getItem("buscaEgresos")!);
      if (this.buscaEgresos == null) {
         this.ultimoEgreso();
      } else {
         this.formBuscar.patchValue({
            desdeNum: this.buscaEgresos.desdeNum,
            hastaNum: this.buscaEgresos.hastaNum,
            desdeFecha: this.buscaEgresos.desdeFecha,
            hastaFecha: this.buscaEgresos.hastaFecha
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
         const datos = await this.coloresService.setcolor(this.authService.idusuario, 'egresos');
         const coloresJSON = JSON.stringify(datos);
         sessionStorage.setItem('/egresos', coloresJSON);
         this.colocaColor(datos);
      } catch (error) { console.error(error); }
   }

   ultimoEgreso() {
      this.asiService.obtenerUltimoCompro(2).subscribe({
         next: resp => {
            let desde = resp - 16;
            if (desde <= 0) desde = 1;
            this.formBuscar.patchValue({
               // tipcom: 0,
               desdeNum: desde,
               hastaNum: resp,
            });
            this.buscar();
         },
         error: err => console.error(err.error)
      });
   }

   buscar() {
      //Guarda los datos de búsqueda
      this.buscaEgresos = {
         desdeNum: this.formBuscar.value.desdeNum,
         hastaNum: this.formBuscar.value.hastaNum,
         desdeFecha: this.formBuscar.value.desdeFecha,
         hastaFecha: this.formBuscar.value.hastaFecha
      };
      sessionStorage.setItem("buscaEgresos", JSON.stringify(this.buscaEgresos));

      //Numeros
      let desdeNum: number = 1;
      if (this.formBuscar.value.desdeNum != null) { desdeNum = this.formBuscar.value.desdeNum; }
      let hastaNum: number = 999999999;
      if (this.formBuscar.value.hastaNum != null) { hastaNum = this.formBuscar.value.hastaNum; }
      //Busca los Egresos
      this.asiService.getComprobantes(2, 2, this.formBuscar.value.desdeNum, this.formBuscar.value.hastaNum,
         this.formBuscar.value.desdeFecha, this.formBuscar.value.hastaFecha).subscribe({
            next: datos => this._egresos = datos,
            error: err => console.error(err.error)
         });
   }


   public listainicial() {
      sessionStorage.removeItem('buscaEgresos');
      this.swdesdehasta = false;
      this.ultimoEgreso();
   }

   changeDesdeHasta() { this.swdesdehasta = true; }

   onCellClick(event: any, asiento: Asientos) {
      const tagName = event.target.tagName;
      if (tagName === 'TD') {
         let asientoToTransaci = {
            idasiento: asiento.idasiento,
            padre: '/egresos',
         };
         sessionStorage.setItem("asientoToTransaci", JSON.stringify(asientoToTransaci));
         this.router.navigate(['transaci']);
      }
   }

   addEgreso() { this.router.navigate(['add-egreso']);   }

   modiEgreso(idasiento: number) {
      sessionStorage.setItem("idasientoToModi", idasiento.toString());
      this.router.navigate(['/modi-egreso']);
   }

   eliminar(asiento: Asientos) {
      this.sweliminar = false;
      this.tranService.porIdasiento(asiento.idasiento).subscribe({
         next: resp => {
            this.sweliminar = !resp
            this.iAsiento.idasiento = asiento.idasiento;
            this.iAsiento.compro = asiento.compro;
         },
         error: err => console.error('Al buscar si el Asiento tiene Transacciones: ', err.error),
      });
   }

   elimina() {
      this.asiService.deleteAsiento(this.iAsiento.idasiento).subscribe({
         next: datos => this.buscar(),
         error: err => console.error(err.error)
      });
   }

   imprimir() {
      sessionStorage.setItem("egresosToImpExp", JSON.stringify(this.buscaEgresos));
      this.router.navigate(['/imp-egresos']);
   }

}

interface interfaceEgreso {
   idasiento: number;
   compro: number
}