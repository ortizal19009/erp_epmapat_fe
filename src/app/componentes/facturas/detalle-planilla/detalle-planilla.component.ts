import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Rubroxfac } from 'src/app/modelos/rubroxfac.model';
import { LecturasService } from 'src/app/servicios/lecturas.service';
import { RecaudacionService } from 'src/app/servicios/microservicios/recaudacion.service';
import { RubroxfacService } from 'src/app/servicios/rubroxfac.service';

@Component({
  selector: 'app-detalle-planilla',
  templateUrl: './detalle-planilla.component.html',
  styleUrls: ['./detalle-planilla.component.css'],
})
export class DetallePlanillaComponent implements OnInit {
  @Input() idfactura: any;
  @Output() stateEvent = new EventEmitter<Boolean>();
  _rubros: any;
  _lecturas: any;
  m3: number = 0;
  loading: Boolean = true;
  sumaDetail: number = 0;
  constructor(
    private s_rubroxfac: RubroxfacService,
    private s_lectutas: LecturasService,
    private ms_recaudacion: RecaudacionService
  ) {}

  ngOnInit(): void {
    this.getDatos();
  }
  async getDatos() {
    let _sumaDetail: number = 0;
    await this.s_rubroxfac
      .getByIdfacturaAsync(this.idfactura)
      .then((item: any) => {
        this._rubros = item;
      })
      .catch((e: any) => {
        console.error(e);
      });
    await this.ms_recaudacion.getInteres(this.idfactura).then((item: any) => {
      if (item.body > 0) {
        this._rubros.push({
          cantidad: 1,
          idrubro_rubros: {
            descripcion: 'Interés',
          },
          valorunitario: item.body,
        });
      }
    });
    await this.ms_recaudacion.getImpuestos(this.idfactura).then((item: any) => {
      if (item.body > 0) {
        this._rubros.push({
          cantidad: 1,
          idrubro_rubros: {
            descripcion: 'IVA',
          },
          valorunitario: item.body,
        });
      }
    });
    await this.s_lectutas
      .getByIdfacturaAsync(this.idfactura)
      .then((item: any) => {
        if (item.length > 0) {
          this._lecturas = item[0];
          this.m3 = item[0].lecturaactual - item[0].lecturaanterior;
        } else {
          this.m3 = 0;
        }
      })
      .catch((e: any) => {
        console.error(e);
      });
    this._rubros.forEach((item: any) => {
      console.log(item);
      _sumaDetail += item.cantidad * item.valorunitario;
    });
    this.sumaDetail = _sumaDetail;
    this.loading = false;
  }
  cancelar() {
    this.stateEvent.emit(false);
  }
}
