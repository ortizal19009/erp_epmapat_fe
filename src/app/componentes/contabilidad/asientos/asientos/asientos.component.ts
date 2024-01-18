// import { DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Asientos } from 'src/app/modelos/contabilidad/asientos.model';
import { AsientosService } from 'src/app/servicios/contabilidad/asientos.service';
import { TransaciService } from 'src/app/servicios/contabilidad/transaci.service';

@Component({
   selector: 'app-asientos',
   templateUrl: './asientos.component.html',
   styleUrls: ['./asientos.component.css'],
})

export class AsientosComponent implements OnInit {

   buscarAsientos: { asi_com: number, tipcom: number, desdeNum: number, hastaNum: number, desdeFecha: string, hastaFecha: string }
   _asientos: any;
   formBuscar: FormGroup;
   today: number = Date.now();
   date: Date = new Date();
   iAsiento = {} as interfaceAsiento; //Interface para los datos de los Asientos a eliminar
   filtro: string;
   disabTipcom: boolean = true;
   asi_com: number = 1;
   sweliminar: boolean = false;

   constructor(private asientosService: AsientosService, private fb: FormBuilder,
      private router: Router, private tranService: TransaciService) { }

   ngOnInit(): void {
      sessionStorage.setItem('ventana', '/asientos');
      this.setcolor();

      const fecha = new Date();
      const año = fecha.getFullYear()
      this.formBuscar = this.fb.group({
         asi_com: '',
         tipcom: '',
         desdeNum: '',
         hastaNum: '',
         desdeFecha: año + '-01-01',
         hastaFecha: año + '-12-31',
      },
         { updateOn: "blur" });

      this.buscarAsientos = JSON.parse(sessionStorage.getItem("buscarAsientos")!);
      // console.log('this.buscarAsientos: ', this.buscarAsientos)
      if (this.buscarAsientos == null) {
         console.log('Pasa por null')
         this.asientosService.ultimo().subscribe({
            next: resp => {
               let desde = resp.asiento - 10;
               if (desde <= 0) desde = 1;
               this.formBuscar.patchValue({
                  asi_com: 1,
                  tipcom: 0,
                  desdeNum: desde,
                  hastaNum: resp.asiento,
               });
               this.buscar();
            },
            error: err => console.error(err.error)
         }
         );
      } else {
         this.formBuscar.patchValue({
            asi_com: this.buscarAsientos.asi_com,
            tipcom: this.buscarAsientos.tipcom,
            desdeNum: this.buscarAsientos.desdeNum,
            hastaNum: this.buscarAsientos.hastaNum,
            desdeFecha: this.buscarAsientos.desdeFecha,
            hastaFecha: this.buscarAsientos.hastaFecha
         });
         this.buscar();
      }
   }

   setcolor() {
      let colores: string[];
      let coloresJSON = sessionStorage.getItem('/asientos');
      if (!coloresJSON) {
         colores = ['rgb(57, 95, 95)', 'rgb(207, 221, 210)'];
         const coloresJSON = JSON.stringify(colores);
         sessionStorage.setItem('/asientos', coloresJSON);
      } else colores = JSON.parse(coloresJSON);

      document.documentElement.style.setProperty('--bgcolor1', colores[0]);
      const cabecera = document.querySelector('.cabecera');
      if (cabecera) cabecera.classList.add('nuevoBG1')
      document.documentElement.style.setProperty('--bgcolor2', colores[1]);
      const detalle = document.querySelector('.detalle');
      if (detalle) detalle.classList.add('nuevoBG2');
   }

   buscar() {
      this.buscarAsientos = {
         asi_com: this.formBuscar.value.asi_com,
         tipcom: this.formBuscar.value.tipcom,
         desdeNum: this.formBuscar.value.desdeNum,
         hastaNum: this.formBuscar.value.hastaNum,
         desdeFecha: this.formBuscar.value.desdeFecha,
         hastaFecha: this.formBuscar.value.hastaFecha
      };
      sessionStorage.setItem("buscarAsientos", JSON.stringify(this.buscarAsientos));

      if (this.formBuscar.value.asi_com == 1)
         this.asientosService.getAsientos(1, this.formBuscar.value.desdeNum, this.formBuscar.value.hastaNum,
            this.formBuscar.value.desdeFecha, this.formBuscar.value.hastaFecha).subscribe({
               next: datos => {
                  this._asientos = datos;
               },
               error: err => console.error(err.error),
            });
      else {
         let tipcom1: number; let tipcom2: number;
         if (this.formBuscar.value.tipcom == 0) {
            tipcom1 = 1; tipcom2 = 5;
         } else {
            tipcom1 = this.formBuscar.value.tipcom; tipcom2 = tipcom1;
         }
         this.asientosService.getComprobantes(2, tipcom1, tipcom2, this.formBuscar.value.desdeNum, this.formBuscar.value.hastaNum,
            this.formBuscar.value.desdeFecha, this.formBuscar.value.hastaFecha).subscribe({
               next: datos => {
                  this._asientos = datos;
                  // this.datosBuscar();
               },
               error: err => console.error(err.error),
            });
      }
   }

   changeAsi_com() {
      this.formBuscar.get('asi_com')!.valueChanges.subscribe(asi_comValue => {
         // this.asi_com = asi_comValue;
         if (asi_comValue == 1) {
            this.disabTipcom = true;
            this.formBuscar.patchValue({ tipcom: 0 });
         }
         else
            this.disabTipcom = false
      });
   }

   // datosBuscar() {
   //    sessionStorage.setItem('buscaAsi_com', this.formBuscar?.controls['asi_com'].value.toString());
   //    sessionStorage.setItem('buscaTipo', this.formBuscar?.controls['tipcom'].value.toString());
   //    sessionStorage.setItem('buscaDesdeNum', this.formBuscar?.controls['desdeNum'].value.toString());
   //    sessionStorage.setItem('buscaHastaNum', this.formBuscar?.controls['hastaNum'].value.toString());
   //    sessionStorage.setItem('buscaDesdeFecha', this.formBuscar?.controls['desdeFecha'].value.toString());
   //    sessionStorage.setItem('buscaHastaFecha', this.formBuscar?.controls['hastaFecha'].value.toString());
   // }

   onCellClick(event: any, asiento: Asientos) {
      const tagName = event.target.tagName;
      if (tagName === 'TD') {
         sessionStorage.setItem('idasientoToTransaci', asiento.idasiento.toString());
         this.router.navigate(['transaci']);
      }
   }

   addAsiento() {
      // this.datosBuscar();
      this.router.navigate(['add-asiento']);
   }

   modiAsiento(idasiento: number) {
      // this.datosBuscar();
      sessionStorage.setItem("idasientoToModi", idasiento.toString());
      this.router.navigate(['/modi-asiento']);
   }

   modiRetenciones(asiento: number) {
      //    this.datosBuscar();
      sessionStorage.setItem("asientoToRete", asiento.toString());
      this.router.navigate(['/modi-retencion']);
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
      this.asientosService.deleteAsiento(this.iAsiento.idasiento).subscribe({
         next: datos => this.buscar(),
         error: err => console.error(err.error)
      });
   }

}

interface interfaceAsiento {
   idasiento: number;
   asiento: number
}