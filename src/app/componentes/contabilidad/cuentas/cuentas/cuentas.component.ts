import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { ColoresService } from 'src/app/compartida/colores.service';
import { Cuentas } from 'src/app/modelos/contabilidad/cuentas.model';
import { ReportesjrService } from 'src/app/servicios/administracion/reportesjr.service';
import { CuentasService } from 'src/app/servicios/contabilidad/cuentas.service';
import { TransaciService } from 'src/app/servicios/contabilidad/transaci.service';
import { DatasetReportRequest } from 'src/app/utileria/dataset-report-request';

@Component({
   selector: 'app-cuentas',
   templateUrl: './cuentas.component.html',
   styleUrls: ['./cuentas.component.css']
})

export class CuentasComponent implements OnInit {

   cuentas: Cuentas[] = [];
   filtro: string;
   formBuscar: FormGroup;
   swbuscando: boolean;
   txtbuscar: string = 'Buscar';
   buscarCuentas = { codcue: String, nomcue: String }
   cuenta = {} as Cuentas;
   sweliminar: boolean;
   opcionModal: number;
   msgeliminar: string;
   ultIdSelec: number = -1;

   constructor(public fb: FormBuilder, private cueService: CuentasService, private router: Router,
      public authService: AutorizaService, private coloresService: ColoresService, private tranService: TransaciService,
      private repojrService: ReportesjrService) { }

   ngOnInit(): void {
      sessionStorage.setItem('ventana', '/cuentas');
      let coloresJSON = sessionStorage.getItem('/cuentas');
      if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));
      else this.buscaColor();

      //Campos guardados o ''
      this.ultIdSelec = sessionStorage.getItem('ultidcuenta') ? Number(sessionStorage.getItem('ultidcuenta')) : 0;
      let codcue: string; let nomcue: string;
      const buscaCuentasJSON = sessionStorage.getItem('buscaCuentas');
      if (buscaCuentasJSON) {
         const buscaCuentas = JSON.parse(buscaCuentasJSON);
         codcue = buscaCuentas.codcue;
         nomcue = buscaCuentas.nomcue;
      } else {
         codcue = '';
         nomcue = '';
      }
      this.formBuscar = this.fb.group({
         codcue: codcue,
         nomcue: nomcue,
         filtro: '',
      });
      if (codcue != '' || nomcue != '') this.buscar();
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
         const datos = await this.coloresService.setcolor(this.authService.idusuario, 'cuentas');
         const coloresJSON = JSON.stringify(datos);
         sessionStorage.setItem('/cuentas', coloresJSON);
         this.colocaColor(datos);
      } catch (error) { console.error(error); }
   }

   buscar() {
      this.swbuscando = true;
      this.txtbuscar = 'Buscando';
      let codcue = '';
      if (this.formBuscar.value.codcue != null) codcue = this.formBuscar.value.codcue;
      let nomcue = '';
      if (this.formBuscar.value.nomcue != null) nomcue = this.formBuscar.value.nomcue.toLowerCase();
      this.cueService.getByCodigoyNombre(codcue, nomcue).subscribe({
         next: (cuentas: Cuentas[]) => {
            this.cuentas = cuentas;
            //Guarda los campos de búsqueda
            this.buscarCuentas = {
               codcue: this.formBuscar.value.codcue,
               nomcue: this.formBuscar.value.nomcue
            };
            sessionStorage.setItem('buscaCuentas', JSON.stringify(this.buscarCuentas));
            this.swbuscando = false;
            this.txtbuscar = 'Buscar';
         },
         error: err => console.error(err.error)
      })
   }

   onCellClick(event: any, cuenta: Cuentas) {
      const tagName = event.target.tagName;
      this.ultIdSelec = cuenta.idcuenta;
      sessionStorage.setItem('ultidcuenta', this.ultIdSelec.toString());
      if (tagName === 'TD') {
         sessionStorage.setItem('codcueToInfo', cuenta.codcue.toString());
         this.router.navigate(['info-cuenta']);
      }
   }

   addCuenta(cuenta: any) {
      if (cuenta.movcue == 1) {
         let addCuenta = {
            grucue: cuenta.codcue,
            nomgru: cuenta.nomcue,
            nivcue: cuenta.nivcue.toString()
         }
         sessionStorage.setItem('addCuenta', JSON.stringify(addCuenta));
         this.router.navigate(['/add-cuenta']);
      } else {
         this.opcionModal = 1;
      }
   }

   modiCuenta(cuenta: Cuentas) {
      sessionStorage.setItem('cuentaToModi', JSON.stringify(cuenta));
      this.router.navigate(['/modi-cuenta']);
   }

   eliminar(cuenta: Cuentas) {
      this.sweliminar = false;
      if (cuenta.movcue != 2) {
         this.opcionModal = 2;
         this.cuenta.idcuenta = cuenta.idcuenta;
         this.cuenta.codcue = cuenta.codcue;
         this.msgeliminar = 'Es cuenta de Grupo!'
      }
      else {
         this.tranService.tieneTransaci(cuenta.codcue.toString()).subscribe({
            next: resp => {
               this.opcionModal = 2;
               this.sweliminar = !resp
               this.cuenta.idcuenta = cuenta.idcuenta;
               this.cuenta.codcue = cuenta.codcue;
               this.msgeliminar = 'Tiene movimientos!'
            },
            error: err => console.error('Al buscar si la Cuenta tiene Transacciones: ', err.error),
         });
      }
   }

   elimina() {
      this.cueService.deleteCuenta(this.cuenta.idcuenta).subscribe({
         next: nex => this.buscar(),
         error: err => console.error('Al eliminar la Cuenta: ', err.error),
      });
   }

   // Imprime el reporte (vista actual) en una nueva pestaña
   generaJasperDataset() {
      let dtoCuentas: repoCuentas[] = [];
      dtoCuentas = this.cuentas.map(p => ({
         codcue: p.codcue,
         nomcue: p.nomcue,
         grucue: p.grucue,
         movcue: p.movcue,
         sigef: p.sigef,
         tiptran: p.tiptran,
         asodebe: p.asodebe,
         asohaber: p.asohaber,
      }));

      // console.log('dtoPreingresos: ', dtoPreingresos)
      const nomrep = 'cuentas';
      this.repojrService.valNomrep(nomrep).subscribe({
         next: sw => {
            if (sw) {
               // const datosEmpresa = this.authService.getDatosEmpresa()
               // const empresa = datosEmpresa?.empresa;
               // const codcue = this.buscarCuentas.codcue;
               const empresa = 'EpmapaT';
               const dto: DatasetReportRequest = {
                  reportName: nomrep,
                  extension: 'pdf',
                  parameters: [
                     { name: 'empresa', type: 'string', value: empresa },
                     { name: 'codcue', type: 'string', value: this.buscarCuentas.codcue },
                     { name: 'nomcue', type: 'string', value: this.buscarCuentas.nomcue }
                  ],
                  data: dtoCuentas
               };
               
               this.cueService.reporteCuentas(dto).subscribe({
                  next: (data: Blob) => {
                     const fileURL = URL.createObjectURL(data);
                     window.open(fileURL);
                  },
                  error: err => {
                     console.error('Error al generar el reporte', err);
                     this.authService.mostrarError(`Error al generar el reporte: ${nomrep}.jasper`, err);
                  }
               });

            } else {
               this.authService.swal('warning', `No existe el reporte: ${nomrep}.jasper`)
            }
         },
         error: err => {
            console.error(err.error);
            this.authService.mostrarError(`Error al generar el reporte: ${nomrep}.jasper`, err.error);
         }
      });
   }

   imprimir() {
      sessionStorage.setItem("cuentasToImpExp", JSON.stringify(this.buscarCuentas));
      this.router.navigate(['/imp-cuentas']);
   }

   imprimirj() {
      const cuentasToImpExp = {Codigo: this.buscarCuentas.codcue, Nombre: this.buscarCuentas.nomcue, codcue: this.buscarCuentas.codcue}
      sessionStorage.setItem("cuentasToImpExp", JSON.stringify(cuentasToImpExp));
      this.router.navigate(['/impj-cuentas']);
   }

   cerrar() { this.router.navigate(['/inicio']); }

}

interface repoCuentas {
   codcue: String;
   nomcue: String;
   grucue: String;
}