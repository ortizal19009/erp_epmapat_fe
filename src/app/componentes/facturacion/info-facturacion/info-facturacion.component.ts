import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FacturacionService } from 'src/app/servicios/facturacion.service';
import { LiquidafacService } from 'src/app/servicios/liquidafac.service';

@Component({
  selector: 'app-info-facturacion',
  templateUrl: './info-facturacion.component.html',
  styleUrls: ['./info-facturacion.component.css']
})

export class InfoFacturacionComponent implements OnInit {

  facturacion = {} as Facturacion; //Interface para los datos del registro de la Facturación
  elimdisabled = true;
  _liquidafac: any;
  totfac: number;

  constructor(private factuService: FacturacionService, private router: Router,
    private liqfacService: LiquidafacService) { }

  ngOnInit(): void { this.getDatosFacturacion(); }

  getDatosFacturacion() {
    let idFacturacion = sessionStorage.getItem('idfacturacionToInfo');
    this.factuService.getById(+idFacturacion!).subscribe({
      next: datos => {
        this.facturacion.idfacturacion = datos.idfacturacion;
        this.facturacion.descripcion = datos.descripcion;
        this.facturacion.fecha = datos.feccrea;
        this.facturacion.nomcli = datos.idcliente_clientes.nombre;
        this.facturacion.total = datos.total;
        this.facturacion.cuotas = datos.cuotas;
      },
      error: err => console.log(err.error)
    })
  }

  regresarFacturacion() { this.router.navigate(['/facturacion']); }

  modiFacturacion() {
  }

  liquidafac(idfacturacion: number) {
    this.liqfacService.getByIdfacturacion(idfacturacion).subscribe({
      next: datos => {
        this._liquidafac = datos;
        this.subtotal();
      },
      error: err => console.log(err.error)
    })
  }

  subtotal() {
    let suma: number = 0;
    let i = 0;
    this._liquidafac.forEach(() => {
       suma += this._liquidafac[i].idfactura_facturas.totaltarifa
       i++;
    });
    this.totfac = suma;
 }

}

interface Facturacion {
  idfacturacion: number;
  descripcion: String;
  fecha: Date;
  nomcli: String;
  total: number;
  cuotas: number;
}
