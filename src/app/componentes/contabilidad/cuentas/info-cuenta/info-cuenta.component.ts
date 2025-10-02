import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { CuentasService } from 'src/app/servicios/contabilidad/cuentas.service';
import { TransaciService } from 'src/app/servicios/contabilidad/transaci.service';

@Component({
   selector: 'app-info-cuenta',
   templateUrl: './info-cuenta.component.html',
   styleUrls: ['./info-cuenta.component.css']
})
export class InfoCuentaComponent implements OnInit {

   formFechas: FormGroup;
   filtro: string;
   swfiltro: boolean;
   _mayor: any;
   codcue: String;
   anterior: number = 0;
   sumdebe: number;
   sumhaber: number;

   constructor(private router: Router, private fb: FormBuilder, private cueService: CuentasService,
      private traService: TransaciService) { }

   ngOnInit(): void {
      sessionStorage.setItem('ventana', '/cuentas');
      let coloresJSON = sessionStorage.getItem('/cuentas');
      if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));

      //codcue enviada desde cuentas
      this.codcue = sessionStorage.getItem('codcueToInfo')!;
      
      //Fechas guardadas o actuales
      let desde: string; let hasta: string;
      const fechasMayorJSON = sessionStorage.getItem('fechasMayor');
      if (fechasMayorJSON) {
         const fechasMayor = JSON.parse(fechasMayorJSON);
         desde = fechasMayor.desde
         hasta = fechasMayor.hasta
      } else {
         const fechaActual = new Date();
         hasta = fechaActual.toISOString().slice(0, 10);
         let fechaRestada: Date = new Date();
         fechaRestada.setMonth(fechaActual.getMonth() - 1);
         desde = fechaRestada.toISOString().slice(0, 10);
      }
      this.formFechas = this.fb.group({
         codcue: this.codcue,
         desde: desde,
         hasta: hasta
      });
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

   async buscar() {
      this.anterior = await this.traService.saldoAsync(this.formFechas.value.codcue, this.formFechas.value.desde);
      this.traService.getByCodcue(this.formFechas.value.codcue, this.formFechas.value.desde, this.formFechas.value.hasta).subscribe({
         next: datos => {
            this._mayor = datos;
            this.total();
            //Guarda las fechas de búsqueda
            let desde = this.formFechas.value.desde;
            let hasta = this.formFechas.value.hasta;
            const fechasMayor = { desde, hasta }
            const fechasMayorJSON = JSON.stringify(fechasMayor);
            sessionStorage.setItem('fechasMayor', fechasMayorJSON);
         },
         error: err => console.error(err.error)
      });
   }

   onFiltroChange() {
      if (this.filtro.trim() !== '') this.swfiltro = true;
      else this.swfiltro = false;
   }


   comprobante(tipcom: number, compro: number): string {
      switch (tipcom) {
         case 1:
            return 'I-' + compro.toString();
         case 2:
            return 'E-' + compro.toString();
         case 3:
            return 'DC-' + compro.toString();
         case 4:
            return 'DI-' + compro.toString();
         case 5:
            return 'DE-' + compro.toString();
         default:
            return '-' + compro.toString();
      }
   }

   debito(debcre: number, valor: number): number {
      if (debcre == 1) return valor;
      else return 0;
   }

   credito(debcre: number, valor: number): number {
      if (debcre == 2) return valor;
      else return 0;
   }

   total() {
      this.sumdebe = 0;
      this.sumhaber = 0;
      let saldo = this.anterior;
      let i = 0;
      this._mayor.forEach(() => {
         if (this._mayor[i].debcre == 1) {
            this.sumdebe += this._mayor[i].valor;
            if (this._mayor[i].codcue.slice(0, 1) == '1' || this._mayor[i].codcue.slice(0, 2) == '63' || this._mayor[i].codcue.slice(0, 2) == '91') saldo = saldo + this._mayor[i].valor;
            else saldo = saldo - this._mayor[i].valor;
         }
         else {
            this.sumhaber += this._mayor[i].valor;
            if (this._mayor[i].codcue.slice(0, 1) == '1' || this._mayor[i].codcue.slice(0, 2) == '63' || this._mayor[i].codcue.slice(0, 2) == '91') saldo = saldo - this._mayor[i].valor;
            else saldo = saldo + this._mayor[i].valor;
         }
         this._mayor[i].saldo = saldo;
         i++;
      });
   }

   regresar() { this.router.navigate(['/cuentas']); }

   imprimir() {
      let codcue = this.formFechas.value.codcue;
      let desde = this.formFechas.value.desde;
      let hasta = this.formFechas.value.hasta;
      const cuenta = { codcue, desde, hasta }
      const cuentaJSON = JSON.stringify(cuenta);
      sessionStorage.setItem('cuentaToImpExp', cuentaJSON);
      this.router.navigate(['/imp-mayor']);
   }

}
