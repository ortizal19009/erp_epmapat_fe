import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { ConvenioService } from 'src/app/servicios/convenio.service';
import { CuotasService } from 'src/app/servicios/cuotas.service';
import { FacturaService } from 'src/app/servicios/factura.service';
import { FacxconvenioService } from 'src/app/servicios/facxconvenio.service';
import { RubroxfacService } from 'src/app/servicios/rubroxfac.service';
import { ConveniosReportsService } from '../convenios-reports.service';
import { InteresesService } from 'src/app/servicios/intereses.service';

type CuotaSortColumn = 'cuota' | 'planilla' | 'fecha' | 'factura' | 'fcobro' | 'valor' | 'interes';
type ConvenioSortColumn = 'nro' | 'fecha' | 'modulo' | 'valor';
type SortDirection = 'asc' | 'desc';

@Component({
  selector: 'app-info-convenio',
  templateUrl: './info-convenio.component.html',
  styleUrls: ['./info-convenio.component.css'],
})
export class InfoConvenioComponent implements OnInit {
  convenio = {} as Convenio; //Interface para los datos del Convenio
  total1: number; //Total de las Facturas de las Cuotas
  total2: number; //Total de las Facturas del convenio
  dif1: boolean;
  dif2: boolean;
  elimdisabled: boolean = true;
  v_idfactura: number;
  totfac: number;
  _convenios: any;
  _facxconvenio: any;
  _cuotas: any;
  _rubroxfac: any;
  idconvenio: number;
  sweliminar: boolean = true;
  hasFacturasCobradas: boolean = false;
  totalInteres: number;
  cuotasLoading: boolean = false;
  facturasLoading: boolean = false;
  cuotaSortColumn: CuotaSortColumn = 'cuota';
  cuotaSortDirection: SortDirection = 'asc';
  convenioSortColumn: ConvenioSortColumn = 'nro';
  convenioSortDirection: SortDirection = 'asc';
  constructor(
    private convService: ConvenioService,
    private fxconvService: FacxconvenioService,
    private cuotaService: CuotasService,
    private facService: FacturaService,
    private rxfService: RubroxfacService,
    private router: Router,
    private s_report: ConveniosReportsService,
    private s_intereses: InteresesService
  ) { }

  ngOnInit(): void {
    sessionStorage.setItem('ventana', '/info-convenios');
    let coloresJSON = sessionStorage.getItem('/info-convenios');
    if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));

    this.idconvenio = +sessionStorage.getItem('idconvenioToInfo')!;
    sessionStorage.removeItem('idconvenioToInfo');
    if (this.idconvenio === 0) {
      this.regresar();
    } else {
      this.datosConvenio();
    }
  }

  colocaColor(colores: any) {
    document.documentElement.style.setProperty('--bgcolor1', colores[0]);
    const cabecera = document.querySelector('.cabecera');
    if (cabecera) cabecera.classList.add('nuevoBG1');
    document.documentElement.style.setProperty('--bgcolor2', colores[1]);
    const detalle = document.querySelector('.detalle');
    if (detalle) detalle.classList.add('nuevoBG2');
  }

  datosConvenio() {
    this.convService.getById(this.idconvenio).subscribe({
      next: (datos: any) => {
        this._convenios = datos;
        this.convenio.idconvenio = datos.idconvenio;
        this.convenio.nroconvenio = datos.nroconvenio;
        this.convenio.nomcli = datos.idabonado.idcliente_clientes.nombre;
        this.convenio.referencia = datos.referencia;
        this.convenio.totalconvenio = datos.totalconvenio;
        this.convenio.cuotainicial = datos.cuotainicial;
        this.convenio.cuotafinal = datos.cuotafinal;
        this.convenio.cuenta = datos.idabonado.idabonado;
        this.convenio.feccrea = datos.feccrea;
        this.cuotasxConvenio(this.idconvenio);
      },
      error: (err) => console.error(err.error),
    });
    this.convService.findDatosConvenio(this.idconvenio).subscribe({
      next: (datos: any) => {
        this.sweliminar = true;
      },
      error: (e: any) => console.error(e)
    })
  }

  async calcularInteres(idfactura: number) {
    let interes = await this.s_intereses.getInteresFacturaAsync(idfactura)
    return interes;
  }

  cuotasxConvenio(idconvenio: number) {
    this.cuotasLoading = true;
    this.cuotaService.getByIdconvenio(idconvenio).subscribe({
      next: async (datos: any) => {
        this.totalInteres = 0;
        const cuotas = Array.isArray(datos) ? datos : [];
        this._cuotas = await Promise.all(
          cuotas.map(async (item: any) => {
            const cuota = { ...item };
            cuota.idfactura = await this.resolveFacturaCompleta(item?.idfactura);
            const factura = cuota.idfactura || {};
            const facturaId = Number(factura?.idfactura ?? 0);
            if (facturaId > 0 && Number(factura?.pagado) === 0) {
              cuota.interesacobrar = await this.s_intereses.getInteresFacturaAsync(facturaId);
            } else {
              cuota.interesacobrar = Number(factura?.interescobrado ?? 0);
            }
            this.totalInteres += Number(cuota.interesacobrar ?? 0);
            return cuota;
          })
        );
        this.totalCuotas();
        this.cuotasLoading = false;
      },
      error: (err) => {
        console.error(err.error);
        this._cuotas = [];
        this.total1 = 0;
        this.totalInteres = 0;
        this.cuotasLoading = false;
      },
    });
  }

  get cuotasOrdenadas(): any[] {
    return [...(this._cuotas ?? [])].sort((a: any, b: any) =>
      this.compareCuotas(a, b),
    );
  }

  get facxConvenioOrdenadas(): any[] {
    return [...(this._facxconvenio ?? [])].sort((a: any, b: any) =>
      this.compareFacxConvenio(a, b),
    );
  }

  toggleCuotaSort(column: CuotaSortColumn): void {
    if (this.cuotaSortColumn === column) {
      this.cuotaSortDirection = this.cuotaSortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.cuotaSortColumn = column;
      this.cuotaSortDirection = 'asc';
    }
  }

  toggleConvenioSort(column: ConvenioSortColumn): void {
    if (this.convenioSortColumn === column) {
      this.convenioSortDirection = this.convenioSortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.convenioSortColumn = column;
      this.convenioSortDirection = 'asc';
    }
  }

  getCuotaSortIndicator(column: CuotaSortColumn): string {
    if (this.cuotaSortColumn !== column) {
      return '';
    }
    return this.cuotaSortDirection === 'asc' ? '▲' : '▼';
  }

  getConvenioSortIndicator(column: ConvenioSortColumn): string {
    if (this.convenioSortColumn !== column) {
      return '';
    }
    return this.convenioSortDirection === 'asc' ? '▲' : '▼';
  }

  private compareCuotas(a: any, b: any): number {
    const va = this.getCuotaSortValue(a, this.cuotaSortColumn);
    const vb = this.getCuotaSortValue(b, this.cuotaSortColumn);
    const result = this.compareValues(va, vb);
    return this.cuotaSortDirection === 'asc' ? result : -result;
  }

  private compareFacxConvenio(a: any, b: any): number {
    const va = this.getConvenioSortValue(a, this.convenioSortColumn);
    const vb = this.getConvenioSortValue(b, this.convenioSortColumn);
    const result = this.compareValues(va, vb);
    return this.convenioSortDirection === 'asc' ? result : -result;
  }

  private compareValues(a: any, b: any): number {
    if (a == null && b == null) return 0;
    if (a == null) return -1;
    if (b == null) return 1;

    if (typeof a === 'number' && typeof b === 'number') {
      return a - b;
    }

    return String(a).localeCompare(String(b), 'es', { sensitivity: 'base' });
  }

  private getCuotaSortValue(item: any, column: CuotaSortColumn): string | number {
    switch (column) {
      case 'cuota':
        return Number(item?.nrocuota ?? 0);
      case 'planilla':
        return Number(item?.idfactura?.idfactura ?? 0);
      case 'fecha':
        return String(item?.idfactura?.feccrea ?? '');
      case 'factura':
        return String(item?.idfactura?.nrofactura ?? '');
      case 'fcobro':
        return String(item?.idfactura?.fechacobro ?? '');
      case 'valor':
        return Number(item?.idfactura?.totaltarifa ?? 0);
      case 'interes':
        return Number(item?.interesacobrar ?? 0);
      default:
        return '';
    }
  }

  private getConvenioSortValue(item: any, column: ConvenioSortColumn): string | number {
    switch (column) {
      case 'nro':
        return Number(item?.idfactura_facturas?.idfactura ?? 0);
      case 'fecha':
        return String(item?.idfactura_facturas?.feccrea ?? '');
      case 'modulo':
        return String(item?.idfactura_facturas?.idmodulo?.descripcion ?? '');
      case 'valor':
        return Number(item?.idfactura_facturas?.totaltarifa ?? 0);
      default:
        return '';
    }
  }

  totalCuotas() {
    this.total1 = 0;
    (this._cuotas ?? []).forEach((item: any) => {
      this.total1 += Number(item?.idfactura?.totaltarifa ?? 0);
    });
    this.total1 = Number(this.total1.toFixed(2));
    this.dif1 = Number(this.convenio.totalconvenio?.toFixed?.(2) ?? 0) - this.total1 !== 0;
  }

  nombreClienteOld(idfactura: number) {
    this.facService.getById(idfactura).subscribe({
      next: (datos) => (this.convenio.nomcli = datos.idcliente.nombre),
      error: (err) => console.error(err.error),
    });
  }

  facxConvenio() {
    this.facturasLoading = true;
    this.fxconvService.getFacByConvenio(this.idconvenio).subscribe({
      next: async (datos: any[]) => {
        const facturas = Array.isArray(datos) ? datos : [];
        this._facxconvenio = await Promise.all(
          facturas.map(async (item: any) => ({
            ...item,
            idfactura_facturas: await this.resolveFacturaCompleta(item?.idfactura_facturas),
          }))
        );
        this.totalFacturas();
        this.hasFacturasCobradas = Array.isArray(this._facxconvenio)
          ? this._facxconvenio.some((fx: any) =>
              fx?.idfactura_facturas?.pagado === 1 ||
              fx?.idfactura_facturas?.pagado === '1' ||
              fx?.idfactura_facturas?.pagado === true
            )
          : false;
        this.facturasLoading = false;
      },
      error: (err) => {
        console.error(err.error);
        this._facxconvenio = [];
        this.total2 = 0;
        this.hasFacturasCobradas = false;
        this.facturasLoading = false;
      },
    });
  }

  totalFacturas() {
    this.total2 = 0;
    (this._facxconvenio ?? []).forEach((item: any) => {
      this.total2 += Number(item?.idfactura_facturas?.totaltarifa ?? 0);
    });
    this.total2 = Number(this.total2.toFixed(2));
    this.dif2 = Number(this.convenio.totalconvenio?.toFixed?.(2) ?? 0) - this.total2 !== 0;
  }

  regresar() {
    this.router.navigate(['/convenios']);
  }

  public modiConvenio(idconvenio: number) {
    this.router.navigate(['modiconvenio', idconvenio]);
  }

  confirmaEliminarConvenio() {
    let idc = localStorage.getItem('idconvenioToDelete');
    if (idc != null) {
      this.convService.deleteConvenio(+idc!).subscribe({
        next: (datos) => { },
        error: (err) => console.error(err.error),
      });
    }
  }

  getRubroxfac(idfactura: number) {
    this.v_idfactura = idfactura;
    this.rxfService.getDetalleByIdfactura(+idfactura!).subscribe({
      next: (detalle) => {
        this._rubroxfac = detalle;
        this.subtotal();
      },
      error: (err) => console.error(err.error),
    });
  }

  subtotal() {
    let suma12: number = 0;
    let suma0: number = 0;
    //this.valoriva = 0;
    let i = 0;
    this._rubroxfac.forEach(() => {
      if (this._rubroxfac[i].idrubro_rubros.swiva == 1) {
        suma12 +=
          this._rubroxfac[i].cantidad * this._rubroxfac[i].valorunitario;
      } else {
        if (this._rubroxfac[i].idrubro_rubros.esiva == 0) {
          suma0 +=
            this._rubroxfac[i].cantidad * this._rubroxfac[i].valorunitario;
        } else {
          //this.valoriva = this.rubroxfac[i].valorunitario;
        }
      }
      i++;
    });
    this.totfac = suma12 + suma0;
    //this.suma12 = suma12;
    //this.suma0 = suma0;
  }
  imprimirPdf(convenio: any) {
    this.s_report.impContratoConvenio(convenio, this._cuotas);
  }

  getFacturaCuota(item: any): any {
    return item?.idfactura ?? {};
  }

  getFacturaConvenio(item: any): any {
    return item?.idfactura_facturas ?? {};
  }

  private async resolveFacturaCompleta(facturaRef: any): Promise<any> {
    if (!facturaRef) {
      return {};
    }

    const facturaId = this.resolveFacturaId(facturaRef);
    if (!facturaId) {
      return facturaRef;
    }

    const tieneDatosSuficientes =
      facturaRef?.nrofactura != null &&
      facturaRef?.totaltarifa != null &&
      facturaRef?.idmodulo != null;

    if (tieneDatosSuficientes) {
      return facturaRef;
    }

    try {
      const factura = await firstValueFrom(this.facService.getById(facturaId));
      return { ...facturaRef, ...(factura || {}) };
    } catch (error) {
      console.error(`No se pudo completar la factura ${facturaId}:`, error);
      return facturaRef;
    }
  }

  private resolveFacturaId(facturaRef: any): number {
    const rawId =
      facturaRef?.idfactura ??
      facturaRef?.id ??
      facturaRef;
    const facturaId = Number(rawId);
    return Number.isFinite(facturaId) && facturaId > 0 ? facturaId : 0;
  }
}

interface Convenio {
  idconvenio: number;
  nroconvenio: number;
  referencia: String;
  nomcli: String;
  totalconvenio: number;
  cuotainicial: number;
  cuotafinal: number;
  cuenta: number;
  feccrea: Date;
}
