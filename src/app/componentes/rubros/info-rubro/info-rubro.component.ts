import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CatalogoitemService } from 'src/app/servicios/catalogoitem.service';
import { RubrosService } from 'src/app/servicios/rubros.service';
import { RubroxfacService } from 'src/app/servicios/rubroxfac.service';

@Component({
   selector: 'app-info-rubro',
   templateUrl: './info-rubro.component.html',
   styleUrls: ['./info-rubro.component.css']
})
export class InfoRubroComponent implements OnInit {

   rubro = {} as Rubro; //Interface para los datos del Rubro
   elimdisabled = true;
   noMovimientos: boolean;
   _catalogoitems: any;
   _rubroxfac: any;
   _cuentas: any;
   idrubro: number;  //Id del Rubro que se informa

   constructor(private router: Router, private rubService: RubrosService,
      private cataiService: CatalogoitemService, private rxfacService: RubroxfacService) { }

   ngOnInit(): void {
      this.idrubro = +sessionStorage.getItem('idrubroToInfo')!;

      this.datosRubro()
   }

   datosRubro() {
      this.rubService.getRubroById(this.idrubro).subscribe({
         next: resp => {
            this.rubro.idrubro = resp.idrubro;
            this.rubro.descripcion = resp.descripcion;
            this.rubro.valor = resp.valor;
            this.rubro.calculable = resp.calculable;
            this.rubro.swiva = resp.swiva;
            this.rubro.facturable = resp.facturable;
            this.rubro.tipo = resp.tipo;
            this.rubro.nommodulo = resp.idmodulo_modulos.descripcion;
         },
         error: err => console.error(err.error),
      });
      this.catalogoitemsxRub();
   }

   //Catalogoitems por Rubro
   catalogoitemsxRub() {
      this.cataiService.getByIdrubro(this.idrubro).subscribe({
         next: datos => {
            this._catalogoitems = datos;
            if (this._catalogoitems.length == 0) { this.noMovimientos = true; }
         },
         error: err => console.error(err.error)
      })
   }

   regresar() { this.router.navigate(['/rubros']); }

   modiRubro() {
      sessionStorage.setItem("idrubroToModi", this.rubro.idrubro.toString());
      this.router.navigate(['/modi-rubro']);
   }

   eliminarRubro() {
      if (this.rubro.idrubro != null) {
         this.rubService.deleteRubro(this.rubro.idrubro).subscribe({
            next: resp => this.router.navigate(['/rubros']),
            error: err => console.error(err.error),
         })
      }
   }

   movxidrubro() {
      this.rxfacService.getByIdrubro(this.idrubro).subscribe({
         next: resp => {
            this._rubroxfac = resp;
            console.warn("this._rubroxfac.length= " + this._rubroxfac.length)
            if (this._rubroxfac.length == 0) this.noMovimientos = true;
            else this.noMovimientos = false;
         },
         error: err => console.error(err.error)
      })
   }

}

interface Rubro {
   idrubro: number;
   descripcion: String;
   valor: number;
   calculable: Boolean;
   swiva: Boolean;
   nommodulo: String;
   facturable: number;
   tipo: number;
}
