import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { Facturas } from 'src/app/modelos/facturas.model';
import { FacturaService } from 'src/app/servicios/factura.service';

@Component({
   selector: 'app-facturas',
   templateUrl: './facturas.component.html',
   styleUrls: ['./facturas.component.css']
})

export class FacturasComponent implements OnInit {

   formBuscar: FormGroup;
   _facturas: any;
   filtro: string;
   swbusca: boolean;

   constructor(private facServicio: FacturaService, private router: Router, private fb: FormBuilder) { }

   ngOnInit(): void {
      let desde = sessionStorage.getItem("desdePlanillas");
      let hasta = sessionStorage.getItem("hastaPlanillas");
      this.formBuscar = this.fb.group({
         desde: [desde],
         hasta: [hasta],
      });
      this.buscar();
      // this.listar();
   }

   // public inicia() {
   //    this.swbusca = false;
   // }

   public listar() {
      this.swbusca = false;
      // this.inicia();
      this.facServicio.getLista().subscribe({ 
         next: datos => this._facturas = datos, 
         error: err => console.log(err.error)
      })
   }

   public buscar() {

      let desde = this.formBuscar.value.desde;
      let hasta = this.formBuscar.value.hasta;
      let desdeE = document.getElementById("desde") as HTMLInputElement;
      let hastaE = document.getElementById("hasta") as HTMLInputElement;
      if (desde == '' || hasta == '' || desde == null || hasta == null) {
         sessionStorage.setItem("desdePlanillas", '');
         sessionStorage.setItem("hastaPlanillas", '');
         this.listar();
      } else if (desde != null && hasta != null) {
         if ((+desdeE.value!) > (+hastaE.value!) || (+hastaE.value!) - (+desdeE.value!) > 100) {
            desdeE.style.border = "#f50000 1px solid";
            hastaE.style.border = "#f50000 1px solid";
         } else {
            desdeE.style.border = "";
            hastaE.style.border = "";
            this.swbusca = true;
            this.facServicio.getDesdeHasta(desde, hasta).subscribe({
               next: datos => this._facturas = datos,
               error: err => console.log(err.error)
            })
         }
      }
   }

   public info(facturas: Facturas) {
      if (this.formBuscar.controls['desde'].value > 0 && this.formBuscar.controls['hasta'].value > 0) {
         sessionStorage.setItem('desdePlanillas', this.formBuscar.controls['desde'].value.toString());
         sessionStorage.setItem('hastaPlanillas', this.formBuscar.controls['hasta'].value.toString());
      }
      sessionStorage.setItem('idfacturaToInfo', facturas.idfactura.toString());
      this.router.navigate(['info-planilla']);
   }

}
