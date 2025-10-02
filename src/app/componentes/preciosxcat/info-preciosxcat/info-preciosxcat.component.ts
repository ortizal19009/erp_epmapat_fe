import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { PreciosxcatService } from 'src/app/servicios/preciosxcat.service';
import { RubrosService } from 'src/app/servicios/rubros.service';

@Component({
   selector: 'app-info-preciosxcat',
   templateUrl: './info-preciosxcat.component.html',
   styleUrls: ['./info-preciosxcat.component.css']
})

export class InfoPreciosxcatComponent implements OnInit {

   precioxcat = {} as Precioxcat;
   elimdisabled = true;
   _rubEmision: any;
   total: number;
   rubros: any = [];
   rubrosFilter: any;

   constructor(private router: Router, private rubService: RubrosService, private pxcatService: PreciosxcatService) { }

   ngOnInit(): void {
      this.datosPrecioxcat();
      setTimeout(() => {
         this.rubEmision();
      }, 500);
   }

   datosPrecioxcat() {
      let idprecioxcat = +sessionStorage.getItem('idprecioxcatToInfo')!;
      this.pxcatService.getByIdprecioxcat(idprecioxcat).subscribe({
         next: datos => {
            this.precioxcat.idprecioxcat = datos.idprecioxcat;   //Usado en eliminar
            this.precioxcat.categoria = datos.idcategoria_categorias.descripcion
            this.precioxcat.m3 = datos.m3;
            this.precioxcat.preciobase = datos.preciobase;
            this.precioxcat.precioadicional = datos.precioadicional;
         },
         error: err => console.error(err.error)
      });
   }

   //Obtiene los Rubros de Emisión
   rubEmision() {
      this.rubService.getRubrosEmision().subscribe({
         next: resp => {
            this._rubEmision = resp;
            this.valores();
         },
         error: err => console.error(err.error)
      })
   }

   valores() {
      let i = 0;
      let valor: number;
      this._rubEmision.forEach(() => {
         let idrubro = this._rubEmision[i].idrubro;
         switch (idrubro) {
            case 1: valor = this.precioxcat.precioadicional; break;
            case 2: valor = this.precioxcat.precioadicional * .5; break;
            case 7: valor = this._rubEmision[i].valor; break;
            case 295: valor = this._rubEmision[i].valor; break;
            case 296: valor = this.precioxcat.precioadicional * .7; break;
            default: valor = 0;
         }
         this.rubros.push([this._rubEmision[i].descripcion, valor]);
         i++;
      });
      this.rubrosFilter = this.rubros.filter((row: number[]) => row[1] != 0)
      this.sumtotal();
   }

   regresar() { this.router.navigate(['/pliego']); }

   public sumtotal() {
      let alcanta = this.precioxcat.precioadicional * 0.5;
      let suma = this.precioxcat.precioadicional + (this.precioxcat.precioadicional * 0.5) + 1.1 + (this.precioxcat.precioadicional * 0.7);
      this.total = suma;
   }

}

interface Precioxcat {
   idprecioxcat: number;
   categoria: String;
   m3: number;
   preciobase: number;
   precioadicional: number;
}
