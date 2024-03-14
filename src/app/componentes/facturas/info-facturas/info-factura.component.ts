import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FacturaService } from 'src/app/servicios/factura.service';
import { RubroxfacService } from 'src/app/servicios/rubroxfac.service';

@Component({
  selector: 'app-info-factura',
  templateUrl: './info-factura.component.html',
  styleUrls: ['./info-factura.component.css']
})

export class InfoFacturasComponent implements OnInit {

  idFactura: number;
  planilla = {} as Planilla; //Interface para los datos del registro de la Facturación
  _rubroxfac: any;
  suma12: number;
  suma0: number;
  valoriva: number;

  constructor(private facService: FacturaService, private router: Router, private rxfService: RubroxfacService) { }

  ngOnInit(): void {
    this.idFactura = +sessionStorage.getItem('idfacturaToInfo')!;
    sessionStorage.removeItem('idfacturaToInfo');

    this.datosPlanilla();
  }

  datosPlanilla() {
    this.facService.getById(this.idFactura!).subscribe({
      next: resp => {
        this.planilla.idfactura = resp.idfactura;
        this.planilla.modulo = resp.idmodulo.descripcion;
        this.planilla.fecha = resp.feccrea;
        this.planilla.nomcli = resp.idcliente.nombre;
        this.planilla.nrofactura = resp.nrofactura;
        this.planilla.fechacobro = resp.fechacobro;
        this.planilla.totaltarifa = resp.totaltarifa;
        this.planilla.valorbase = resp.valorbase;
        this.getRubroxfac();
      },
      error: err => console.error(err.error)
    });
  }

  getRubroxfac() {
    this.rxfService.getByIdfactura(this.idFactura!).subscribe({
      next: datos => {
        this._rubroxfac = datos;
        this.subtotal();
      },
      error: err => console.error(err.error)
    })
  }

  regresar() { this.router.navigate(['/facturas']); }

  subtotal() {
    let suma12: number = 0;
    let suma0: number = 0;
    let valoriva = 0;
    let i = 0;
    this._rubroxfac.forEach(() => {
      if (this._rubroxfac[i].idrubro_rubros.swiva == 1) {
        suma12 += this._rubroxfac[i].cantidad * this._rubroxfac[i].valorunitario;
        valoriva += this._rubroxfac[i].cantidad * this._rubroxfac[i].valorunitario * .12;
      }
      else {
        if (this._rubroxfac[i].idrubro_rubros.esiva == 0) {
          suma0 += this._rubroxfac[i].cantidad * this._rubroxfac[i].valorunitario;
        }
        else {
          // this.valoriva = this.rubroxfac[i].valorunitario;
        }
      }
      i++;
    });
    this.suma12 = suma12;
    this.suma0 = suma0;
    this.valoriva = valoriva;
  }

}

interface Planilla {
  idfactura: number;
  modulo: String;
  fecha: Date;
  nomcli: String;
  nrofactura: String;
  fechacobro: Date;
  totaltarifa: number;
  valorbase: number;
}