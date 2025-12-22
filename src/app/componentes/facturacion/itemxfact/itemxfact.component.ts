import { Component, OnInit } from '@angular/core';
import { ItemxfactService } from 'src/app/servicios/itemxfact.service';

@Component({
  selector: 'app-itemxfact',
  templateUrl: './itemxfact.component.html',
  styleUrls: ['./itemxfact.component.css'],
})
export class ItemxfactComponent implements OnInit {
  _itemxfact: any;
  idfacturacion: number;
  usoitem: String;
  totfac: number;
  totiva: number;

  constructor(private ixfServicio: ItemxfactService) {}

  ngOnInit(): void {
    this.idfacturacion = +sessionStorage.getItem('idfacturacionToInfo')!;
    this.listar();
  }

  public listar() {
    this.ixfServicio.getByIdfacturacion(this.idfacturacion).subscribe({
      next: (datos: any) => {
        console.log(datos);
        this._itemxfact = datos;
        this.usoitem =
          this._itemxfact[0].idcatalogoitems_catalogoitems.idusoitems_usoitems.descripcion;
        this.subtotal();
      },
      error: (err) => console.error(err.error),
    });
  }

  // subtotal() {
  //    let suma12: number = 0;
  //    let suma0: number = 0;
  //    let i = 0;
  //    this._itemxfact.forEach(() => {
  //       suma0 += this._itemxfact[i].cantidad * this._itemxfact[i].valorunitario;
  //       i++;
  //    });
  //    this.totfac = suma12 + suma0;
  // }

  subtotal() {
    let suma = 0;
    let sumiva = 0;
    let i = 0;
    this._itemxfact.forEach(() => {
      suma += this._itemxfact[i].cantidad * this._itemxfact[i].valorunitario;
      if (
        this._itemxfact[i].idcatalogoitems_catalogoitems.idrubro_rubros.swiva ==
        1
      ) {
        sumiva +=
          this._itemxfact[i].cantidad * this._itemxfact[i].valorunitario * 0.15;
      }
      i++;
    });
    this.totfac = suma;
    this.totiva = sumiva;
  }
}
