import { Component, Input, OnInit } from '@angular/core';
import { Chart, registerables } from 'chart.js';
import { FacturaService } from 'src/app/servicios/factura.service';
import { LecturasService } from 'src/app/servicios/lecturas.service';
import { RubroxfacService } from 'src/app/servicios/rubroxfac.service';

@Component({
  selector: 'app-historialconsumo',
  templateUrl: './historialconsumo.component.html',
  styleUrls: ['./historialconsumo.component.css']
})
export class HistorialconsumoComponent implements OnInit {
  grafic: Boolean = false;
  _lecturas: any;
  idfactura: number;
  _facturas: any
  _rubrosxfac: any;
  totfac: number;
  @Input() abonado: any;
  constructor(private lecService: LecturasService, private facService: FacturaService, private rubxfacService: RubroxfacService) { }

  ngOnInit(): void {
    console.log(this.abonado)
    this.facturasxAbonado(this.abonado);
    this.lecturasxAbonado(this.abonado)
  }
  getRubroxfac(idfactura: number) {
    this.idfactura = idfactura;
    this.rubxfacService.getByIdfactura(+idfactura!).subscribe({
      next: detalle => {
        this._rubrosxfac = detalle;
        this.subtotal()
      },
      error: err => console.log(err.error)
    });
  }
  subtotal() {
    let suma12: number = 0;
    let suma0: number = 0;
    let i = 0;
    this._rubrosxfac.forEach(() => {
      if (this._rubrosxfac[i].idrubro_rubros.swiva == 1) {
        suma12 += this._rubrosxfac[i].cantidad * this._rubrosxfac[i].valorunitario;
      }
      else {
        if (this._rubrosxfac[i].idrubro_rubros.esiva == 0) {
          suma0 += this._rubrosxfac[i].cantidad * this._rubrosxfac[i].valorunitario;
        }
        else {
        }
      }
      i++;
    });
    this.totfac = suma12 + suma0;
  }

  facturasxAbonado(idabonado: number) {
    this.facService.getByIdabonado(idabonado).subscribe({
      next: datos => this._facturas = datos,
      error: err => console.log(err.error)
    });
  }
  lecturasxAbonado(idabonado: number) {
    this.lecService.getLecturasxIdabonado(idabonado).subscribe({
      next: datos => this._lecturas = datos,
      error: err => console.log(err.error)
    });
  }

}
