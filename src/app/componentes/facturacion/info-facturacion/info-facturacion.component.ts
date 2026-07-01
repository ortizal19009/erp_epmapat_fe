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
  _liquidafac: any[] = [];
  totfac = 0;
  planillasCobradas = 0;
  planillasPendientes = 0;

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
        this._liquidafac = Array.isArray(datos) ? datos : [];
        this.subtotal();
      },
      error: (err) => console.error(err.error)
    });
  }

  subtotal() {
    let suma = 0;
    let cobradas = 0;
    let pendientes = 0;

    this._liquidafac.forEach((liqfac: any) => {
      const factura = liqfac?.idfactura_facturas;
      suma += Number(liqfac?.valor ?? factura?.totaltarifa ?? 0);
      if (Number(factura?.pagado) === 1) {
        cobradas++;
      } else {
        pendientes++;
      }
    });
    this.totfac = suma;
    this.planillasCobradas = cobradas;
    this.planillasPendientes = pendientes;
  }

  get estadoFacturacion(): string {
    if (!this.facturacion.cuotas) {
      return 'Sin planillas';
    }
    if (!this._liquidafac.length) {
      return 'Pendiente de carga';
    }
    if (this.planillasCobradas === this._liquidafac.length) {
      return 'Completada';
    }
    if (this.planillasCobradas > 0) {
      return 'En cobranza';
    }
    return 'Pendiente';
  }

  get estadoFacturacionClass(): string {
    switch (this.estadoFacturacion) {
      case 'Completada':
        return 'badge-soft-success';
      case 'En cobranza':
        return 'badge-soft-warning';
      case 'Pendiente de carga':
        return 'badge-soft-info';
      case 'Sin planillas':
        return 'badge-soft-secondary';
      default:
        return 'badge-soft-danger';
    }
  }

  get avanceCobro(): number {
    if (!this._liquidafac.length) {
      return 0;
    }
    return Math.round((this.planillasCobradas / this._liquidafac.length) * 100);
  }

  get diferenciaTotal(): number {
    return Number(this.facturacion.total || 0) - Number(this.totfac || 0);
  }

  esPlanillaPagada(liqfac: any): boolean {
    return Number(liqfac?.idfactura_facturas?.pagado) === 1;
  }

  getValorPlanilla(liqfac: any): number {
    return Number(liqfac?.valor ?? liqfac?.idfactura_facturas?.totaltarifa ?? 0);
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
  descripcion: string;
  fecha: Date | string | null;
  nomcli: string;
  total: number;
  cuotas: number;
}
