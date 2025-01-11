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
   padre: string;
   iAsiento = {} as interfaceAsiento; //Interface para los datos del Asiento
   _transaci: any;
   filtro: string;
   totDebe: number;
   totHaber: number;
   selectedValue: string = "0";
   codcue: String;
   sweliminar: boolean = false;
   inttra: number
   swhay: boolean
   actualizar: boolean = false;

   constructor(private fb: FormBuilder, private router: Router, private coloresService: ColoresService,
      private asiService: AsientosService, private tranService: TransaciService) { }

   ngOnInit(): void {
      sessionStorage.setItem('ventana', '/transaci');
      let coloresJSON = sessionStorage.getItem('/transaci');
      if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));
      else this.buscaColor();

      this.datosAsiento();
      
      const actuAsiento = sessionStorage.getItem('actuAsiento');  //Regresa de modi-transaci para actualizar los totales
      sessionStorage.removeItem('actuAsiento');
      if ( actuAsiento ) { if( actuAsiento == 'true' ){ this.actualizar = true } else { this.actualizar = false} };
      // console.log('this.actualizar: ', this.actualizar)
      this.transacciones( this.actualizar );  //Cuando elimina o modifica (debcre o valor) es true para que actualice totales del asiento
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
         const datos = await this.coloresService.setcolor(1, 'transaci');
         const coloresJSON = JSON.stringify(datos);
         sessionStorage.setItem('/transaci', coloresJSON);
         this.colocaColor(datos);
      } catch (error) {
         console.error(error);
      }
   }

   datosAsiento() {
      let asientoToTransaci = JSON.parse(sessionStorage.getItem("asientoToTransaci")!);
      // sessionStorage.removeItem("asientoToTransaci"); OJO: 
      this.idasiento = asientoToTransaci.idasiento;
      this.padre = asientoToTransaci.padre;

      this.asiService.unAsiento(this.idasiento).subscribe({
         next: datos => {
            this.iAsiento.asiento = datos.asiento;
            this.iAsiento.fecha = datos.fecha;
            this.iAsiento.comprobante = codcomprobante(datos.tipcom) + datos.compro.toString();
            this.iAsiento.beneficiario = datos.idbene.nomben;
            if (datos.intdoc.intdoc == 1) this.iAsiento.documento = datos.numdoc;
            else this.iAsiento.documento = datos.intdoc.nomdoc + ' ' + datos.numdoc;
            this.iAsiento.glosa = datos.glosa;
         },
         error: err => console.error(err.error)
      });
   }

   transacciones(actualizar: boolean) {
      this.tranService.getTransaci(this.idasiento).subscribe({
         next: resp => {
            this._transaci = resp;
            this.swhay = false;
            if (this._transaci.length > 0) this.swhay = true;
            this.total(actualizar);
         },
         error: err => console.error(err.error)
      });
   }

   total(actualizar: boolean) {
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
      this.totDebe = Math.round(sumDebe * 100) / 100;
      this.totHaber = Math.round(sumHaber * 100) / 100;
      if(actualizar) {
         this.asiService.updateTotdebAndTotcre(this.idasiento, +this.totDebe, +this.totHaber).subscribe({
            next: resp => { },
            error: err => console.error(err.error)
         });
      }
   }

   regresar() {
      // this.router.navigate(['/asientos']);
      this.router.navigate([this.padre]);
   }

   changeTiptran() {
      // console.log('Valor seleccionado:', this.selectedValue);
   }

   nuevo() {
      sessionStorage.setItem("datosToAddtransaci", JSON.stringify({ idasiento: this.idasiento, totDebe: this.totDebe, totHaber: this.totHaber }));
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
         // 
      }

   }

   modificar(inttra: number) {
      // sessionStorage.setItem("inttraToModi", inttra.toString());
      sessionStorage.setItem("datosToModitransaci", JSON.stringify({ inttra: inttra, idasiento: this.idasiento, totDebe: this.totDebe, totHaber: this.totHaber }));
      this.router.navigate(['/modi-transaci']);
   }

   eliminar(transaci: Transaci) {
      if (transaci.tiptran == 0) {
         this.sweliminar = true
         this.inttra = transaci.inttra;
      }
      else this.sweliminar = false;
      this.codcue = transaci.codcue;
   }

   elimina() {
      this.tranService.deleteTransaci(this.inttra).subscribe({
         next: datos =>  this.transacciones( true ),
         error: err => console.error('Al eliminar una Transacción: ', err.error)
      });
   }

   imprimir() {
      sessionStorage.setItem("idasientoToImpExp", this.idasiento.toString());
      this.router.navigate(['/imp-transaci']);
   }

}

interface interfaceAsiento {
   asiento: number;
   fecha: Date;
   comprobante: string;
   documento: String;
   beneficiario: String;
   glosa: String;
}

//Código Tipo de Comprobante
function codcomprobante(tipcom: number): string {
   if (tipcom == 1) return 'I-';
   if (tipcom == 2) return 'E-';
   if (tipcom == 3) return 'DC-';
   if (tipcom == 4) return 'DI-';
   if (tipcom == 5) return 'DE-';
   return '';
}
