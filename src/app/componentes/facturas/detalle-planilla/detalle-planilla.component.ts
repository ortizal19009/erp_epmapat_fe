import { Component, OnChanges, OnInit, Input, Output, EventEmitter, SimpleChanges } from '@angular/core';
import { Rubroxfac } from 'src/app/modelos/rubroxfac.model';
import { LecturasService } from 'src/app/servicios/lecturas.service';
import { RubroxfacService } from 'src/app/servicios/rubroxfac.service';

@Component({
  selector: 'app-detalle-planilla',
  templateUrl: './detalle-planilla.component.html',
  styleUrls: ['./detalle-planilla.component.css'],
})
export class DetallePlanillaComponent implements OnInit, OnChanges {
  @Input() idfactura: any;
  @Output() stateEvent = new EventEmitter<Boolean>();
  @Input() addRubro: any;
  _rubros: any;
  _lecturas: any;
  m3: number = 0;
  loading: Boolean = false;
  sumaDetail: number = 0;
  private currentLoadId = 0;
  constructor(
    private s_rubroxfac: RubroxfacService,
    private s_lectutas: LecturasService
  ) {}

  ngOnInit(): void {
    this.getDatos();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['idfactura'] && !changes['idfactura'].firstChange) ||
        (changes['addRubro'] && !changes['addRubro'].firstChange)) {
      this.getDatos();
    }
  }
  async getDatos() {
    const facturaId = Number(this.idfactura);
    if (!facturaId) {
      this._rubros = [];
      this._lecturas = null;
      this.m3 = 0;
      this.sumaDetail = 0;
      return;
    }

    const loadId = ++this.currentLoadId;
    this.loading = true;
    this._rubros = [];
    this._lecturas = null;
    this.m3 = 0;
    this.sumaDetail = 0;
    let _sumaDetail: number = 0;
    const rubrosAdicionales = Array.isArray(this.addRubro) ? this.addRubro : [];
    await this.s_rubroxfac
      .getDetalleByIdfacturaAsync(facturaId)
      .then((item: any) => {
        if (loadId !== this.currentLoadId) {
          return;
        }
        this._rubros = [...item, ...rubrosAdicionales];
      })
      .catch((e: any) => {
        console.error(e);
        this._rubros = [...rubrosAdicionales];
      });
    await this.s_lectutas
      .getByIdfacturaAsync(facturaId)
      .then((item: any) => {
        if (loadId !== this.currentLoadId) {
          return;
        }
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

    if (loadId !== this.currentLoadId) {
      return;
    }

    (this._rubros || []).forEach((item: any) => {
      _sumaDetail += Number(item?.cantidad || 0) * Number(item?.valorunitario || 0);
    });
    this.sumaDetail = _sumaDetail;
    this.loading = false;
  }
  cancelar() {
    this.stateEvent.emit(false);
  }
}
