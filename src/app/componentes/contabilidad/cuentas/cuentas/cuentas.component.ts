import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { Cuentas } from 'src/app/modelos/contabilidad/cuentas.model';
import { CuentasService } from 'src/app/servicios/contabilidad/cuentas.service';
import { TransaciService } from 'src/app/servicios/contabilidad/transaci.service';

@Component({
   selector: 'app-cuentas',
   templateUrl: './cuentas.component.html',
   styleUrls: ['./cuentas.component.css']
})

export class CuentasComponent implements OnInit {

   _cuentas: any;
   filtro: string;
   formBuscar: FormGroup;
   disabled = false;
   cuenta = {} as Cuentas;
   sweliminar: boolean;
   opcionModal: number;

   constructor(public fb: FormBuilder, private cueService: CuentasService, private router: Router,
      private tranService: TransaciService) { }

   ngOnInit(): void {
      sessionStorage.setItem('ventana', '/cuentas');
      this.setcolor();

      this.formBuscar = this.fb.group({
         codcue: '',
         nomcue: '',
         filtro: '',
      });

      let busCuentasCodcue = sessionStorage.getItem("busCuentasCodcue") == null ? '' : sessionStorage.getItem("busCuentasCodcue");
      let busCuentasNomcue = sessionStorage.getItem("busCuentasNomcue") == null ? '' : sessionStorage.getItem("busCuentasNomcue");
      this.formBuscar.patchValue({
         codcue: busCuentasCodcue,
         nomcue: busCuentasNomcue
      });
      if (busCuentasCodcue != '' || busCuentasNomcue != '') this.buscar();
   }

   setcolor() {
      let colores: string[];
      let coloresJSON = sessionStorage.getItem('/cuentas');
      if (!coloresJSON) {
         colores = ['rgb(83, 93, 43)', 'rgb(209, 250, 132)'];
         const coloresJSON = JSON.stringify(colores);
         sessionStorage.setItem('/cuentas', coloresJSON);
      } else colores = JSON.parse(coloresJSON);

      document.documentElement.style.setProperty('--bgcolor1', colores[0]);
      const cabecera = document.querySelector('.cabecera');
      if (cabecera) cabecera.classList.add('nuevoBG1')
      document.documentElement.style.setProperty('--bgcolor2', colores[1]);
      const detalle = document.querySelector('.detalle');
      if (detalle) detalle.classList.add('nuevoBG2');
   }

   buscar() {
      let codcue = '';
      if (this.formBuscar.value.codcue != null) codcue = this.formBuscar.value.codcue;
      let nomcue = '';
      if (this.formBuscar.value.nomcue != null) nomcue = this.formBuscar.value.nomcue.toLowerCase();
      this.cueService.getByCodigoyNombre(codcue, nomcue).subscribe({
         next: resp => {
            this._cuentas = resp
            sessionStorage.setItem('busCuentasCodcue', this.formBuscar.controls['codcue'].value == null ? '' : this.formBuscar.controls['codcue'].value);
            sessionStorage.setItem('busCuentasNomcue', this.formBuscar.controls['nomcue'].value == null ? '' : this.formBuscar.controls['nomcue'].value);
         },
         error: err => console.error(err.error)
      })
   }

   public info(idcuenta: number) {
      sessionStorage.setItem('idcuentaToInfo', idcuenta.toString());
      this.router.navigate(['info-cuenta']);
   }

   // onCellClick(event: any, presupue: Presupue) {
   //    const tagName = event.target.tagName;
   //    if (tagName === 'TD') {
   //       sessionStorage.setItem('codparToAuxgasto', presupue.codpar.toString());
   //       sessionStorage.setItem('nomparToAuxiliar', presupue.nompar.toString());
   //       sessionStorage.setItem('iniciaToAuxiliar', presupue.inicia.toString());
   //       this.router.navigate(['aux-gasto']);
   //    }
   // }

   addCuenta(grucue: string, nomgru: string, idnivel: number, movcue: number) {
      if (!movcue) {
         idnivel = idnivel + 1;  //El nivel de la nueva cuenta es el siguiente al grupo
         sessionStorage.setItem('newGrucue', grucue);
         sessionStorage.setItem('newNomgru', nomgru);
         sessionStorage.setItem('newIdnivel', idnivel.toString());
         this.router.navigate(['/add-cuenta']);
      } else {
         this.opcionModal = 1;
      }
   }

   eliminar(cuenta: Cuentas) {
      this.sweliminar = false;
      this.tranService.tieneTransaci(cuenta.codcue.toString()).subscribe({
         next: resp => {
            this.opcionModal = 2;
            this.sweliminar = !resp
            this.cuenta.idcuenta = cuenta.idcuenta;
            this.cuenta.codcue = cuenta.codcue;
         },
         error: err => console.error('Al buscar si la Cuenta tiene Transacciones: ', err.error),
      });
   }

   elimina() {
      this.cueService.deleteCuenta(this.cuenta.idcuenta).subscribe({
         next: resp => this.buscar(),
         error: err => console.error('Al eliminar la Cuenta: ', err.error),
      });
   }

}
