import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CatalogoitemService } from 'src/app/servicios/catalogoitem.service';
import { ItemxfactService } from 'src/app/servicios/itemxfact.service';

@Component({
   selector: 'app-info-catalogoitems',
   templateUrl: './info-catalogoitems.component.html',
   styleUrls: ['./info-catalogoitems.component.css']
})
export class InfoCatalogoitemsComponent implements OnInit {

   producto = {} as Catalogoitems; //Interface para los datos del Producto (catalogoitems)
   elimdisabled = true;
   noMovimientos: true;
   _movxproducto: any;
   idcatalogoitems: number;
   _producto: any;

   constructor(private router: Router, private prodService: CatalogoitemService, private ixfService: ItemxfactService ) { }

   ngOnInit(): void {
      this.idcatalogoitems = +sessionStorage.getItem('idcatalogoitemsToInfo')!;
      this.datosProducto()
   }

   //Datos del Producto
   datosProducto() {
      this.prodService.getById(this.idcatalogoitems).subscribe({
         next: resp => {
            this._producto = resp;
            this.producto.idcatalogoitems = resp.idcatalogoitems;
            this.producto.descripcion = resp.descripcion;
            this.producto.nommodulo = resp.idusoitems_usoitems.idmodulo_modulos.descripcion;
            this.producto.uso = resp.idusoitems_usoitems.descripcion;
            this.producto.rubro = resp.idrubro_rubros.descripcion;
         },
         error: err => console.error(err.error),
      });
      this.movxProducto();
   }

   //Movimientos (facturacion) por Producto
   movxProducto(){
      this.ixfService.getByIdcatalogoitems(this.idcatalogoitems).subscribe({
         next: resp => this._movxproducto = resp,
         error: err => console.error(err.error)
      });
   }

   regresar() { this.router.navigate(['/catalogoitems']); }

   modiProducto() {
      sessionStorage.setItem("idproductoToModi", this.idcatalogoitems.toString());
      this.router.navigate(['/modi-catalogoitems']);
   }

}

interface Catalogoitems {
   idcatalogoitems: number;
   descripcion: String;
   nommodulo: String;
   uso: String;
   rubro: String;
}
