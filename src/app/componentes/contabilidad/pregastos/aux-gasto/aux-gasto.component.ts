import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { AsientosService } from 'src/app/servicios/contabilidad/asientos.service';
import { EjecucionService } from 'src/app/servicios/contabilidad/ejecucion.service';
import { ReformasService } from 'src/app/servicios/contabilidad/reformas.service';

@Component({
   selector: 'app-aux-gasto',
   templateUrl: './aux-gasto.component.html',
   styleUrls: ['./aux-gasto.component.css']
})
export class AuxGastoComponent implements OnInit {

   formBuscar: FormGroup;
   codpar: string;
   date: Date = new Date();
   today: number = Date.now();
   _ejecucion: any;
   numreg = 0; totalRefo = 0; 
   acumPrmiso=0; acumDevenga = 0; acumPagado = 0;
   salPrmiso = 0; salDevengado = 0; salPagado = 0;
   filtro: string

   constructor(private router: Router, public fb: FormBuilder, private ejecuService: EjecucionService,
      private asieService: AsientosService, private refoService: ReformasService) { }

   ngOnInit(): void {
      sessionStorage.setItem('ventana', '/auxgasto');
      this.setcolor();
      this.codpar = sessionStorage.getItem("codparToAuxgasto")!;

      const fecha = new Date();
      const año = fecha.getFullYear()
      this.formBuscar = this.fb.group({
         desdeFecha: año + '-01-01',
         hastaFecha: año + '-01-31',
         tiprep: 0
      });

   }

   setcolor() {
      let colores: string[];
      let coloresJSON = sessionStorage.getItem('/auxingreso');
      if (!coloresJSON) {
         colores = ['rgb(57, 95, 95)', 'rgb(207, 221, 210)'];
         const coloresJSON = JSON.stringify(colores);
         sessionStorage.setItem('/auxingreso', coloresJSON);
      } else colores = JSON.parse(coloresJSON);

      document.documentElement.style.setProperty('--bgcolor1', colores[0]);
      const cabecera = document.querySelector('.cabecera');
      if (cabecera) cabecera.classList.add('nuevoBG1')
      document.documentElement.style.setProperty('--bgcolor2', colores[1]);
      const detalle = document.querySelector('.detalle');
      if (detalle) detalle.classList.add('nuevoBG2');
   }

   buscar() {
      this.ejecuService.getCodparFecha(this.codpar, this.formBuscar.value.desdeFecha, this.formBuscar.value.hastaFecha).subscribe({
         next: resp => {
            this._ejecucion = resp;

            this.numreg = 0; this.totalRefo = 0; this.acumPrmiso = 0; this.acumDevenga = 0; this.acumPagado = 0;
            this._ejecucion.forEach((ejecucion: { tipeje: number; prmiso: number; devengado: number; cobpagado: number; modifi: number }) => {
               this.numreg = ++this.numreg;
               this.totalRefo = this.totalRefo + ejecucion.modifi;
               this.acumPrmiso = this.acumPrmiso + ejecucion.prmiso;
               this.acumDevenga = this.acumDevenga + ejecucion.devengado;
               this.acumPagado = this.acumPagado + ejecucion.cobpagado;
               if ((ejecucion.tipeje == 3) || (ejecucion.tipeje == 5)) {
                  this.salPrmiso += ejecucion.prmiso;
                  this.salDevengado += ejecucion.devengado;
                  this.salPagado += ejecucion.cobpagado;
                  this.buscar_asiento(ejecucion);
               } else {
                  if (ejecucion.tipeje == 2) {
                     this.buscar_reforma(ejecucion);
                  }
               };
            });
         },
         error: err => console.error(err.error)
      });
   }

   regresar() { this.router.navigate(['/pregastos']); }

   buscar_asiento(ejecucion: any) {
      let tc: String; // Tipo de comprobante
      console.log('ejecucion.idasiento: ', ejecucion.idasiento)
      this.asieService.getById(ejecucion.idasiento).subscribe({
         next: resp => {
            console.log('resp: ', resp)
            ejecucion.asiento = resp.asiento;
            console.log('resp.asiento: ', resp.asiento)
            switch (resp.tipcom) {
               case 1:
                  tc = 'I';
                  break;
               case 2:
                  tc = 'E';
                  break;
               case 3:
                  tc = 'DC';
                  break;
               case 4:
                  tc = 'DI';
                  break;
               case 5:
                  tc = 'DE';
                  break;
               default:
                  tc = '';
                  break;
            };
            ejecucion.compro = tc + "-" + resp.compro;
         },
         error: err => console.error(err.error)
      });
      ejecucion.codificado = ejecucion.idpresupue.inicia;
      ejecucion.saldo_compromiso = ejecucion.codificado - this.acumPrmiso;
      ejecucion.saldo_devengado = ejecucion.codificado - this.acumDevenga;
      ejecucion.saldo_cobpagado = ejecucion.codificado - this.acumPagado;
   }

   buscar_reforma(ejecucion: any) {
      ejecucion.codificado = ejecucion.idpresupue.inicia + ejecucion.modifi;
      ejecucion.saldo_compromiso = ejecucion.codificado - this.acumPrmiso;
      ejecucion.saldo_devengado = ejecucion.codificado - this.acumDevenga;
      ejecucion.saldo_cobpagado = ejecucion.codificado - this.acumPagado;
      this.refoService.getById(ejecucion.idrefo).subscribe({
         next: resp => {
            ejecucion.compro = "RE" + "-" + resp.numero;
         },
         error: err => console.error(err.error)
      })
   }

}
