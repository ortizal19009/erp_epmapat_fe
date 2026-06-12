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
  facturacion = {} as FacturacionView;
  elimdisabled = true;
  _liquidafac: any;
  totfac: number;

  constructor(
    private factuService: FacturacionService,
    private router: Router,
    private liqfacService: LiquidafacService
  ) {}

  ngOnInit(): void {
    this.getDatosFacturacion();
  }

  getDatosFacturacion() {
    const idFacturacion = sessionStorage.getItem('idfacturacionToInfo');
    this.factuService.getById(+idFacturacion!).subscribe({
      next: (datos: any) => {
        this.facturacion.idfacturacion = Number(datos?.idfacturacion || 0);
        this.facturacion.descripcion = datos?.descripcion || '';
        this.facturacion.fecha = datos?.feccrea || datos?.fecha || null;
        this.facturacion.nomcli = this.resolveNombreCliente(datos);
        this.facturacion.total = Number(datos?.total || 0);
        this.facturacion.cuotas = Number(datos?.cuotas || 0);
      },
      error: (err) => console.error(err.error)
    });
  }

  regresarFacturacion() {
    this.router.navigate(['/facturacion']);
  }

  modiFacturacion() {}

  liquidafac(idfacturacion: number) {
    this.liqfacService.getByIdfacturacion(idfacturacion).subscribe({
      next: (datos) => {
        this._liquidafac = datos;
        this.subtotal();
      },
      error: (err) => console.error(err.error)
    });
  }

  subtotal() {
    let suma = 0;
    let i = 0;
    this._liquidafac.forEach(() => {
      suma += Number(this._liquidafac[i]?.idfactura_facturas?.totaltarifa || 0);
      i++;
    });
    this.totfac = suma;
  }

  private resolveNombreCliente(datos: any): string {
    return (
      datos?.idcliente_clientes?.nombre ||
      datos?.nomcli ||
      datos?.cliente ||
      ''
    );
  }
}

interface FacturacionView {
  idfacturacion: number;
  descripcion: String;
  fecha: Date | string | null;
  nomcli: String;
  total: number;
  cuotas: number;
}
