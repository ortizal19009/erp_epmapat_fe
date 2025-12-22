// import { DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { ColoresService } from 'src/app/compartida/colores.service';
import { Asientos } from 'src/app/modelos/contabilidad/asientos.model';
import { AsientosService } from 'src/app/servicios/contabilidad/asientos.service';
import { RetencionesService } from 'src/app/servicios/contabilidad/retenciones.service';
import { TransaciService } from 'src/app/servicios/contabilidad/transaci.service';

@Component({
   selector: 'app-asientos',
   templateUrl: './asientos.component.html',
   styleUrls: ['./asientos.component.css'],
})

export class AsientosComponent implements OnInit {

   _asientos: any;
   swbuscando: boolean;
   txtbuscar: string = 'Buscar';
   buscarAsientos: { tipcom: number, desdeNum: number, hastaNum: number, desdeFecha: string, hastaFecha: string }
   formBuscar: FormGroup;
   today: number = Date.now();
   date: Date = new Date();
   swdesdehasta: boolean; //Visibilidad Buscar últimos
   iAsiento = {} as interfaceAsiento; //Interface para los datos del Asiento a eliminar
   filtro: string;
   disabTipcom: boolean = true;
   sweliminar: boolean = false;

   constructor(private asiService: AsientosService, private fb: FormBuilder,
      public authService: AutorizaService, private coloresService: ColoresService, private router: Router, private tranService: TransaciService,
      private reteService: RetencionesService) { }

   ngOnInit(): void {
      sessionStorage.setItem('ventana', '/asientos');
      let coloresJSON = sessionStorage.getItem('/asientos');
      if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));
      else this.buscaColor();

      const fecha = new Date();
      const año = fecha.getFullYear()
      this.formBuscar = this.fb.group({
         tipcom: '',
         desdeNum: '',
         hastaNum: '',
         desdeFecha: año + '-01-01',
         hastaFecha: año + '-12-31',
      });

      //Datos de búsqueda último asiento o guardados
      this.buscarAsientos = JSON.parse(sessionStorage.getItem("buscarAsientos")!);
      if (this.buscarAsientos == null) this.ultimoAsiento();
      else {
         this.formBuscar.patchValue({
            tipcom: this.buscarAsientos.tipcom,
            desdeNum: this.buscarAsientos.desdeNum,
            hastaNum: this.buscarAsientos.hastaNum,
            desdeFecha: this.buscarAsientos.desdeFecha,
            hastaFecha: this.buscarAsientos.hastaFecha
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
         const datos = await this.coloresService.setcolor(this.authService.idusuario, 'asientos');
         const coloresJSON = JSON.stringify(datos);
         sessionStorage.setItem('/asientos', coloresJSON);
         this.colocaColor(datos);
      } catch (error) { console.error(error); }
   }

   ultimoAsiento() {
      this.asiService.ultimo().subscribe({
         next: resp => {
            let desde = resp.asiento - 16;
            if (desde <= 0) desde = 1;
            this.formBuscar.patchValue({
               tipcom: 0,
               desdeNum: desde,
               hastaNum: resp.asiento,
            });
            this.buscar();
         },
         error: err => console.error(err.error)
      });
   }

   changeTipcom() {
      if (this.formBuscar.value.tipcom == 0) this.ultimoAsiento();
      else {
         this.asiService.obtenerUltimoCompro(this.formBuscar.value.tipcom).subscribe({
            next: resp => {
               let desde = resp - 16;
               if (desde <= 0) desde = 1;
               this.formBuscar.patchValue({
                  desdeNum: desde,
                  hastaNum: resp,
               });
               this.buscar();
            },
            error: err => console.error(err.error)
         });
      }
   }

   buscar() {
      this.swbuscando = true;
      this.txtbuscar = 'Buscando';
      //Guarda los datos de búsqueda
      this.buscarAsientos = {
         tipcom: this.formBuscar.value.tipcom,
         desdeNum: this.formBuscar.value.desdeNum,
         hastaNum: this.formBuscar.value.hastaNum,
         desdeFecha: this.formBuscar.value.desdeFecha,
         hastaFecha: this.formBuscar.value.hastaFecha
      };
      sessionStorage.setItem("buscarAsientos", JSON.stringify(this.buscarAsientos));

      //Numeros
      let desdeNum: number = 1;
      if (this.formBuscar.value.desdeNum != null) { desdeNum = this.formBuscar.value.desdeNum; }
      let hastaNum: number = 999999999;
      if (this.formBuscar.value.hastaNum != null) { hastaNum = this.formBuscar.value.hastaNum; }
      //Busca Asientos
      if (this.formBuscar.value.tipcom == 0)
         this.asiService.getAsientos(1, desdeNum, hastaNum,
            this.formBuscar.value.desdeFecha, this.formBuscar.value.hastaFecha).subscribe({
               next: datos => {
                  this._asientos = datos;
                  this.swbuscando = false;
                  this.txtbuscar = 'Buscar';
               },
               error: err => console.error(err.error)
            });
      else {   //Busca Comprobantes
         this.asiService.getComprobantes(2, this.formBuscar.value.tipcom, this.formBuscar.value.desdeNum, this.formBuscar.value.hastaNum,
            this.formBuscar.value.desdeFecha, this.formBuscar.value.hastaFecha).subscribe({
               next: datos => {
                  this._asientos = datos;
                  this.swbuscando = false;
                  this.txtbuscar = 'Buscar';
               },
               error: err => console.error(err.error)
            });
      }
   }

   comprobante(tipcom: number, compro: number) {
      if (tipcom == 1) return 'I-' + compro.toString();
      if (tipcom == 2) return 'E-' + compro.toString();
      if (tipcom == 3) return 'DC-' + compro.toString();
      if (tipcom == 4) return 'DI-' + compro.toString();
      if (tipcom == 5) return 'DE-' + compro.toString();
      return compro.toString();
   }

   public busquedainicial() {
      sessionStorage.removeItem('buscarAsientos');
      this.swdesdehasta = false;
      this.ultimoAsiento();
   }

   changeDesdeHasta() { this.swdesdehasta = true; }

   onCellClick(event: any, asiento: Asientos) {
      const tagName = event.target.tagName;
      if (tagName === 'TD') {
         // let asientoToTransaci = { idasiento: asiento.idasiento, padre: '/asientos' };
         // sessionStorage.setItem("asientoToTransaci", JSON.stringify(asientoToTransaci));
         sessionStorage.setItem("asientoToTransaci", JSON.stringify({ idasiento: asiento.idasiento, padre: '/asientos' }));
         this.router.navigate(['transaci']);
      }
   }

   addAsiento() { this.router.navigate(['add-asiento']); }

   modiAsiento(idasiento: number) {
      sessionStorage.setItem("idasientoToModi", idasiento.toString());
      this.router.navigate(['/modi-asiento']);
   }

   retenciones(idasiento: number) {
      this.reteService.getByAsiento(idasiento).subscribe({
         next: datos => {
            const totrete = datos.length;
            switch (totrete) {
               case 0:
                  sessionStorage.setItem("idasientoToRete", idasiento.toString());
                  this.router.navigate(['/add-retencion']);
                  break;
               case 1:
                  // let retencionToModifi: { idasiento: number, idrete: number}
                  let idrete = datos[0].idrete;
                  let retencionToModifi = { idasiento: idasiento, idrete: idrete}
                  // sessionStorage.setItem("retencionToModifi", JSON.stringify(retencionToModifi));
                  sessionStorage.setItem("retencionToModifi", JSON.stringify({ idasiento: idasiento, idrete: idrete}));
                  this.router.navigate(['/modi-retencion']);
                  break;
               default:
                  if (totrete > 1) {
                     let idrete = datos[0].idrete;
                     sessionStorage.setItem("idasientoToRete", idrete.toString());
                     this.router.navigate(['/modi-retencion']);
                  } else {
                     console.error(`Total de retencines no válido (${totrete})`);
                  }
            }
         },
         error: err => console.error('Al buscar la(s) retenciones: ', err.error)
      });
   }

   eliminar(asiento: Asientos) {
      this.sweliminar = false;
      this.tranService.porIdasiento(asiento.idasiento).subscribe({
         next: resp => {
            this.sweliminar = !resp
            this.iAsiento.idasiento = asiento.idasiento;
            this.iAsiento.asiento = asiento.asiento;
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
      sessionStorage.setItem("asientosToImpExp", JSON.stringify(this.buscarAsientos));
      this.router.navigate(['/imp-asientos']);
   }

}

interface interfaceAsiento {
   idasiento: number;
   asiento: number
}
