import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
   selector: 'app-imp-unicostos',
   templateUrl: './imp-unicostos.component.html',
   styleUrls: ['./imp-unicostos.component.css']
})

export class ImpUnicostosComponent implements OnInit {

   swimprimir: boolean = true;
   formImprimir: FormGroup;
   opcreporte: number = 1;
   otrapagina: boolean = false;
   swbotones: boolean = false;
   swcalculando: boolean = false;
   txtcalculando = 'Calculando';
   pdfgenerado: string;
   _cuentas: any;
   today: number = Date.now();
   date: Date = new Date();
   nombrearchivo: string;

   constructor(public fb: FormBuilder, private router: Router) { }

   ngOnInit(): void {
      sessionStorage.setItem('ventana', '/unicostos');
      let coloresJSON = sessionStorage.getItem('/unicostos');
      if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));

      this.formImprimir = this.fb.group({
         reporte: '1',
         codcue: '',
         nomcue: '',
         nombrearchivo: ['', [Validators.required, Validators.minLength(3)]],
         otrapagina: ''
      });
   }

   colocaColor(colores: any) {
      document.documentElement.style.setProperty('--bgcolor1', colores[0]);
      const cabecera = document.querySelector('.cabecera');
      if (cabecera) cabecera.classList.add('nuevoBG1')
      document.documentElement.style.setProperty('--bgcolor2', colores[1]);
      const detalle = document.querySelector('.detalle');
      if (detalle) detalle.classList.add('nuevoBG2');
   }
   
   get f() { return this.formImprimir.controls; }

   changeReporte() { this.opcreporte = +this.formImprimir.value.reporte; }

   impriexpor() { this.swimprimir = !this.swimprimir; }

   retornar() { this.router.navigate(['unicostos']); }

   async imprimir() {
      this.swbotones = true;
      this.swcalculando = true;
      let fecha = this.formImprimir.value.fecha;
      switch (this.opcreporte) {
         case 1:  //Lista de cuentas
            try {
               // let codcue = this.formImprimir.value.codcue;
               // let nomcue = this.formImprimir.value.nomcue;
               // this._cuentas = await this.cueService.getByCodigoyNombreAsync(codcue, nomcue)
               // this.swcalculando = false;
               // if (this.swimprimir) this.txtcalculando = 'Mostrar'
               // else this.txtcalculando = 'Descargar'
            } catch (error) {
               console.error('Error al obtener las cuentas:', error);
            }
            break;
         case 2:  //Saldos de las cuentas
         // try {
         //    this._cuentas = await this.facService.getByFechacobroTotAsync(fecha);
         //    // this.sw1 = true;
         //    this.swcalculando = false;
         //    if(this.swimprimir) this.txtcalculando = 'Mostrar'
         //    else this.txtcalculando = 'Descargar'
         // } catch (error) {
         //    console.error('Error al obtener las Planillas:', error);
         // }
         // break;
      }
   }

   imprime() {
      this.swbotones = false; this.swcalculando = false; this.txtcalculando = 'Calculando'
      switch (this.opcreporte) {
         case 1:  //Lista de asientos
            // if (this.swimprimir) this.imprimeCuentas();
            // else this.exportaCuentas();
            break;
         case 2:  //Detalle de asientos
         // if (this.swimprimir) this.imprimirFacturas();
         // else this.exportarFacturas();
         // break;
      }
   }

}
