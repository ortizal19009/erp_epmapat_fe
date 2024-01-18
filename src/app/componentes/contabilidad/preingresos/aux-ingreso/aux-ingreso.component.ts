import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { AsientosService } from 'src/app/servicios/contabilidad/asientos.service';
import { CuentasService } from 'src/app/servicios/contabilidad/cuentas.service';
import { EjecucionService } from 'src/app/servicios/contabilidad/ejecucion.service';
import { PreingresoService } from 'src/app/servicios/contabilidad/preingreso.service';
import { ReformasService } from 'src/app/servicios/contabilidad/reformas.service';
import { TransaciService } from 'src/app/servicios/contabilidad/transaci.service';

@Component({
   selector: 'app-aux-ingreso',
   templateUrl: './aux-ingreso.component.html',
   styleUrls: ['./aux-ingreso.component.css']
})
export class AuxIngresoComponent implements OnInit {

   _ejecucion: any;
   _presupue: any;
   filtro: string;
   formBuscar: FormGroup;
   formTransa: FormGroup;
   disabled = false;
   swvalido = 1;
   totalModfi: number = 0;
   idtransa = 0;
   elimdisabled = false;
   date: Date = new Date();
   today: number = Date.now();
   dFecha: Date;
   numreg = 0;
   totalRefo: number;
   totalDeve: number;
   totalCobp: number;
   codpar: String;
   nombre: String;
   tiprep: number = 0;
   cuenta: String;
   saldo_ini = 0;

   _cuenta: any;

   cta_cla: String;
   nom_cla: String;
   codifica: number = 0;
   sal_deve: number = 0;
   sal_cob: number = 0;

   opcrep: String;
   archExportar: string;

   constructor(public fb: FormBuilder, private ejecucionService: EjecucionService,
      private router: Router, private transaciService: TransaciService, private reformaService: ReformasService,
      private asientoService: AsientosService, private cuentaService: CuentasService, private preingService: PreingresoService) { }

   ngOnInit(): void {
      const fecha = new Date();
      const año = fecha.getFullYear()
      this.formBuscar = this.fb.group({
         desdeFecha: año + '-01-01',
         hastaFecha: año + '-01-31',
         tiprep: 0
      });
      let buscaDesdeFecha = año + '-01-01';
      let buscaHastaFecha = año + '-01-31';
      this.formBuscar.patchValue({
         desdeFecha: buscaDesdeFecha,
         hastaFecha: buscaHastaFecha
      });
      sessionStorage.setItem('ventana', '/auxingreso');
      this.setcolor();
      this.codpar = sessionStorage.getItem("codparToAuxiliar")!;
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

   tipo_aux() {
      this.tiprep = +this.formBuscar.value.tiprep;
      let codpar: String = sessionStorage.getItem("codparToAuxiliar")!;
      let nompar = sessionStorage.getItem("nomparToAuxiliar")!;
      let inicia: number = +sessionStorage.getItem("iniciaToAuxiliar")!;
      this.cuenta = codpar;
      this.nombre = nompar;
      this.saldo_ini = inicia;
      switch (+this.formBuscar.value.tiprep) {
         case 0:
            this.totalRefo = 0;
            this.opcrep = "Auxiliar Presupuestario Ingreso";
            this.archExportar = 'Aux_Ingresos'
            this.buscar();
            break;
         case 1:
            this.opcrep = "Cuentas Asociadas";
            this.archExportar = 'Aux_CtasAsociadas'
            this.asocia();
            break;
         case 2:
            this.opcrep = "Datos de la Partida";
            this.archExportar = 'Aux_DatosPartida'
            this.buscar();
            break;
         case 3:
            this.opcrep = "Saldos de la Partida";
            this.archExportar = 'Aux_SaldosPartida'
            // this.saldos_ing();
            break;
         case 4:
            this.opcrep = "Cédula Presupuestaria de Ingreso";
            this.archExportar = 'Aux_CedulaPartida'
            // this.saldos_ing();
            break;
         default:
            this.regresar()
            break;
      };
   }

   buscar() {
      this.ejecucionService.getCodparFecha(this.codpar, this.formBuscar.value.desdeFecha, this.formBuscar.value.hastaFecha).subscribe({
         next: resp => {
            this._ejecucion = resp;
            
            this.numreg = 0; this.totalRefo=0; this.totalDeve=0; this.totalCobp=0;
            this._ejecucion.forEach((ejecucion: { tipeje: number; devengado: number; cobpagado: number; modifi: number }) => {
              this.numreg = ++this.numreg; 
              this.totalRefo = this.totalRefo + ejecucion.modifi;
              this.totalDeve = this.totalDeve + ejecucion.devengado;
              this.totalCobp = this.totalCobp + ejecucion.cobpagado;
              if ((ejecucion.tipeje == 3) || (ejecucion.tipeje == 4)) {
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

   regresar() { this.router.navigate(['/preingresos']); }

   asocia() {
      let codpar: String = sessionStorage.getItem("codparToAuxiliar")!;
      this.cuentaService.getByAsoHaber(codpar).subscribe({
         next: resp => {
            this._cuenta = resp;
         },
         error: err => console.error(err.error)
      });
   }

   buscar_asiento(ejecucion: any) {
      let tc: String; // Tipo de comprobante
      // console.log('ejecucion.idasiento: ', ejecucion.idasiento)
      this.asientoService.getById(ejecucion.idasiento).subscribe({
         next: resp => {
            // console.log('resp: ', resp)
            ejecucion.asiento = resp.asiento;
            // console.log('resp.asiento: ', resp.asiento)
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
      ejecucion.saldo_devengado = ejecucion.codificado - this.totalDeve;
      ejecucion.saldo_cobpagado = ejecucion.codificado - this.totalCobp;
   }

   buscar_reforma(ejecucion: any) {
      ejecucion.codificado = ejecucion.idpresupue.inicia + ejecucion.modifi;
      ejecucion.saldo_devengado = ejecucion.codificado - this.totalDeve;
      ejecucion.saldo_cobpagado = ejecucion.codificado - this.totalCobp;
      this.reformaService.getById(ejecucion.idrefo).subscribe({
         next: resp => {
            ejecucion.compro = "RE" + "-" + resp.numero;
         },
         error: err => console.error(err.error)
      })
   }

}
