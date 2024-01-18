import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { ColoresService } from 'src/app/compartida/colores.service';
import { Transaci } from 'src/app/modelos/contabilidad/transaci.model';
import { AsientosService } from 'src/app/servicios/contabilidad/asientos.service';
import { TransaciService } from 'src/app/servicios/contabilidad/transaci.service';

@Component({
   selector: 'app-transaci',
   templateUrl: './transaci.component.html',
   styleUrls: ['./transaci.component.css']
})
export class TransaciComponent implements OnInit {

   formAsiento: FormGroup;
   idasiento: number;
   iAsiento = {} as interfaceAsiento; //Interface para los datos del Asiento
   _transaci: any;
   filtro: string;
   totDebe: number;
   totHaber: number;
   selectedValue: string = "0";
   codcue: String;
   sweliminar: boolean = false;
   idtransa: number
   swhay: boolean

   constructor(private fb: FormBuilder, private router: Router, private coloresService: ColoresService, private asiService: AsientosService,
      private tranService: TransaciService) { }

   ngOnInit(): void {
      sessionStorage.setItem('ventana', '/transaci');
      let coloresJSON = sessionStorage.getItem('/transaci');
      if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));
      else this.buscaColor();

      this.datosAsiento();
      this.transacciones();
   }

   async buscaColor() {
      try {
         const datos = await this.coloresService.setcolor(1, 'transaci');
         const coloresJSON = JSON.stringify(datos);
         sessionStorage.setItem('/transaci', coloresJSON);
         this.colocaColor(datos);
      } catch (error) {
         console.error(error);
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

   datosAsiento() {
      this.idasiento = +sessionStorage.getItem('idasientoToTransaci')!;
      this.asiService.unAsiento(this.idasiento).subscribe({
         next: datos => {
            this.iAsiento.asiento = datos.asiento;
            this.iAsiento.fecha = datos.fecha;
            this.iAsiento.comprobante = nomcomprobante(datos.tipcom) + datos.compro.toString();
            this.iAsiento.beneficiario = datos.idbene.nomben;
            if (datos.iddocumento.iddocumento == 1) this.iAsiento.documento = datos.numdoc;
            else this.iAsiento.documento = datos.iddocumento.nomdoc + ' ' + datos.numdoc;
         },
         error: err => console.error(err.error)
      });
   }

   transacciones() {
      this.tranService.getTransaci(this.idasiento).subscribe({
         next: resp => {
            this._transaci = resp;
            this.swhay = false;
            if(this._transaci.length > 0 ) this.swhay = true;
            this.total();
         },
         error: err => console.error(err.error)
      });
   }

   total() {
      let sumDebe: number = 0;
      let sumHaber: number = 0;
      let i = 0;
      this._transaci.forEach(() => {
         if (this._transaci[i].debcre == 1) {
            sumDebe += this._transaci[i].valor;
         }
         else {
            sumHaber += this._transaci[i].valor;
         }
         i++;
      });
      this.totDebe = sumDebe;
      this.totHaber = sumHaber;
   }

   regresar() { this.router.navigate(['/asientos']); }

   changeTiptran() {
      // console.log('Valor seleccionado:', this.selectedValue);
   }

   nuevo() {
      const datosToAddtransaci = {
         totDebe: this.totDebe,
         totHaber: this.totHaber,
      };
      sessionStorage.setItem("datosToAddtransaci", JSON.stringify(datosToAddtransaci));
      switch (+this.selectedValue) {
         case 0:
            this.router.navigate(['/add-transaci']);
            break;
         case 2:
         case 3:
         case 4:
         case 5:
         case 6:
         case 7:
            this.router.navigate(['/add-benextran']);
            break;
         case 8:
         case 9:
         case 10:
         case 11:
         case 12:
            this.router.navigate(['/add-liquiacfp']);
            break;
         default:
         // Code to execute if expression is not equal to any of the case values
      }

   }

   eliminar(transaci: Transaci) {
      if (transaci.tiptran == 0) {
         this.sweliminar = true
         this.idtransa = transaci.idtransa;
      }
      else this.sweliminar = false;
      this.codcue = transaci.codcue;
   }

   elimina() {
      this.tranService.deleteTransaci(this.idtransa).subscribe({
         next: datos => {
            this.transacciones();
         },
         error: err => console.error('Al eliminar una Transacción: ', err.error)
      });
   }

}

interface interfaceAsiento {
   asiento: number;
   fecha: Date;
   comprobante: string;
   documento: String;
   beneficiario: String;
}

//Nombre Tipo de Comprobante
function nomcomprobante(tipcom: number): string {
   var rtn: string;
   switch (tipcom) {
      case 1: rtn = 'I-';
         break;
      case 2: rtn = 'E-';
         break;
      case 3: rtn = 'DC-';
         break;
      case 4: rtn = 'DI-';
         break;
      case 5: rtn = 'DE-';
         break;
      default:
         rtn = '';
   }
   return rtn;
}