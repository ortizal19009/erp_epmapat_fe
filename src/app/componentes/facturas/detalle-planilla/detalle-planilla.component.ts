import { Component, OnChanges, OnInit, Input, Output, EventEmitter, SimpleChanges } from '@angular/core';
import { Rubroxfac } from 'src/app/modelos/rubroxfac.model';
import { FacturaService } from 'src/app/servicios/factura.service';
import { ImpuestosService } from 'src/app/servicios/impuestos.service';
import { InteresesService } from 'src/app/servicios/intereses.service';
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
  suma12: number = 0;
  suma0: number = 0;
  subtotalSinIva: number = 0;
  valoriva: number = 0;
  interes: number = 0;
  impuestoActual: any = null;
  planilla: any = null;
  private currentLoadId = 0;
  constructor(
    private s_rubroxfac: RubroxfacService,
    private s_lectutas: LecturasService,
    private facturaService: FacturaService,
    private impuestosService: ImpuestosService,
    private interesesService: InteresesService
  ) {}

  ngOnInit(): void {
    this.cargarImpuestoActual();
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
      this.suma12 = 0;
      this.suma0 = 0;
      this.subtotalSinIva = 0;
      this.valoriva = 0;
      this.interes = 0;
      this.planilla = null;
      return;
    }

    const loadId = ++this.currentLoadId;
    this.loading = true;
    this._rubros = [];
    this._lecturas = null;
    this.m3 = 0;
    this.sumaDetail = 0;
    this.suma12 = 0;
    this.suma0 = 0;
    this.subtotalSinIva = 0;
    this.valoriva = 0;
    this.interes = 0;
    this.planilla = null;
    const rubrosAdicionales = Array.isArray(this.addRubro) ? this.addRubro : [];
    await this.facturaService
      .getById(facturaId)
      .toPromise()
      .then((item: any) => {
        if (loadId !== this.currentLoadId) {
          return;
        }
        this.planilla = item;
      })
      .catch((e: any) => {
        console.error(e);
      });
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

    this.interes = await this.interesesService.getInteresFactura(facturaId);
    if (loadId !== this.currentLoadId) {
      return;
    }

    this.recalcularTotales();
    this.loading = false;
  }

  private cargarImpuestoActual() {
    this.impuestosService.getCurrentlyInteres().subscribe({
      next: (impuesto: any) => {
        this.impuestoActual = impuesto;
        this.recalcularTotales();
      },
      error: (e: any) => console.error(e),
    });
  }

  private recalcularTotales() {
    let suma12 = 0;
    let suma0 = 0;
    let subtotalSinIva = 0;
    let valorivaCalculado = 0;
    const porcentajeIva = Number(this.impuestoActual?.valor || 0) / 100;

    (this._rubros || []).forEach((item: any) => {
      const totalRubro = Number(item?.cantidad || 0) * Number(item?.valorunitario || 0);
      const esRubroIva = Number(item?.idrubro_rubros?.esiva || 0) === 1;

      if (esRubroIva) {
        return;
      }

      if (item?.idrubro_rubros?.swiva == 1 || item?.idrubro_rubros?.swiva === true) {
        suma12 += totalRubro;
        valorivaCalculado += totalRubro * porcentajeIva;
      } else {
        suma0 += totalRubro;
      }

      subtotalSinIva += totalRubro;
    });

    this.suma12 = suma12;
    this.suma0 = suma0;
    this.subtotalSinIva = subtotalSinIva;
    this.valoriva = this.resolveIva(valorivaCalculado);
    this.interes = this.resolveInteres();
    this.sumaDetail = this.totalPlanilla;
  }

  get totalPlanilla(): number {
    const totalTarifa = Number(this.planilla?.totaltarifa || 0);
    const interes = Number(this.interes || 0);

    if (totalTarifa > 0) {
      return totalTarifa + interes;
    }

    return this.subtotalSinIva + this.valoriva + interes;
  }

  private resolveIva(valorivaCalculado: number): number {
    const ivaPlanilla = Number(this.planilla?.swiva || 0);
    if (ivaPlanilla > 0) {
      return ivaPlanilla;
    }
    return valorivaCalculado;
  }

  private resolveInteres(): number {
    const interesCobrado = Number(this.planilla?.interescobrado || 0);
    if (interesCobrado > 0) {
      return interesCobrado;
    }
    return Number(this.interes || 0);
  }
  cancelar() {
    this.stateEvent.emit(false);
  }
}
