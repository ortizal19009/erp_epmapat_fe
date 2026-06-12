import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { Router } from '@angular/router';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { Impuestos } from 'src/app/modelos/impuestos';
import { FacturaService } from 'src/app/servicios/factura.service';
import { ImpuestosService } from 'src/app/servicios/impuestos.service';
import { InteresesService } from 'src/app/servicios/intereses.service';
import { JasperReportService } from 'src/app/servicios/jasper-report.service';
import { LoadingService } from 'src/app/servicios/loading.service';
import { RubroxfacService } from 'src/app/servicios/rubroxfac.service';
import { FecfacturaService } from 'src/app/servicios/fecfactura.service';

@Component({
  selector: 'app-info-factura',
  templateUrl: './info-factura.component.html',
  styleUrls: ['./info-factura.component.css'],
})
export class InfoFacturasComponent implements OnInit {
  idFactura: number = 0;
  planilla = {} as Planilla; //Interface para los datos del registro de la Facturación
  _rubroxfac: any;
  suma12: number = 0;
  suma0: number = 0;
  subtotalSinIva: number = 0;
  valoriva: number = 0;
  _impuesto: Impuestos = new Impuestos();
  interes: number = 0;
  @Input() idfac: any = null;
  swreturn: boolean = true;
  datos: boolean = true;
  idusuario: number;
  private currentLoadId = 0;
  constructor(
    private facService: FacturaService,
    private router: Router,
    private rxfService: RubroxfacService,
    private s_impuestos: ImpuestosService,
    private s_interes: InteresesService,
    private s_jasperreport: JasperReportService,
    private s_loading: LoadingService,
    private authorizaService: AutorizaService,
    private fecfacturaService: FecfacturaService
  ) { }

  ngOnInit(): void {
    this.idusuario = this.authorizaService.idusuario;
    this.getImpuestoAcutal();
    this.cargarPlanillaActual();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ('idfac' in changes && !changes['idfac'].firstChange) {
      this.cargarPlanillaActual();
    }
  }
  getImpuestoAcutal() {
    this.s_impuestos.getCurrentlyInteres().subscribe({
      next: (datos: any) => {
        this._impuesto = datos;
        if (Array.isArray(this._rubroxfac) && this._rubroxfac.length) {
          this.subtotal();
        }
      },
      error: (e: any) => console.error(e),
    });
  }
  private cargarPlanillaActual(): void {
    const idDesdeInput = Number(this.idfac);
    const idDesdeStorage = Number(sessionStorage.getItem('idfacturaToInfo'));

    this.idFactura = idDesdeInput > 0 ? idDesdeInput : idDesdeStorage;
    this.swreturn = !(idDesdeInput > 0);
    sessionStorage.removeItem('idfacturaToInfo');

    if (!this.idFactura) {
      if (this.idfac == null) {
        this.regresar();
      }
      return;
    }

    this.resetPlanillaState();
    this.datosPlanilla();
  }

  private resetPlanillaState(): void {
    this.planilla = {} as Planilla;
    this._rubroxfac = [];
    this.suma12 = 0;
    this.suma0 = 0;
    this.valoriva = 0;
    this.interes = 0;
    this.datos = true;
  }
  async impComprobantePago(idfactura: number) {
    this.datos = true;
    this.s_loading.showLoading();
    let body: any;
    let modulo: any = this.planilla.idmodulo;
    if (
      this.planilla.idabonado > 0 &&
      (modulo.idmodulo == 4 || modulo.idmodulo == 3)
    ) {
      body = {
        reportName: 'CompPagoConsumoAgua',
        parameters: {
          idfactura: idfactura,
        },
        extencion: '.pdf',
      };
    } else if (modulo.idmodulo === 27) {
      body = {
        reportName: 'CompPagoConvenios',
        parameters: {
          idfactura: idfactura,
        },
        extencion: '.pdf',
      };
    } else {
      body = {
        reportName: 'CompPagoServicios',
        parameters: {
          idfactura: idfactura,
        },
        extencion: '.pdf',
      };
    }
    let reporte = await this.s_jasperreport.getReporte(body);
    setTimeout(() => {
      const file = new Blob([reporte], { type: 'application/pdf' });
      const fileURL = URL.createObjectURL(file);

      // Asignar el blob al iframe
      const pdfViewer = document.getElementById(
        'pdfViewer'
      ) as HTMLIFrameElement;

      if (pdfViewer) {
        pdfViewer.src = fileURL;
      }
    }, 1000);

    this.s_loading.hideLoading();
    this.datos = false;
  }
  async impFacturaElectronica(idfactura: number) {
    this.datos = true;
    this.s_loading.showLoading();
    let fact = await this.facService.generarPDF_FacElectronica(idfactura);
    //this.facElectro = true;
    // Crear blob desde los datos del backend
    setTimeout(() => {
      const file = new Blob([fact], { type: 'application/pdf' });
      const fileURL = URL.createObjectURL(file);
      // Asignar el blob al iframe
      const pdfViewer = document.getElementById(
        'pdfViewer'
      ) as HTMLIFrameElement;
      if (pdfViewer) {
        pdfViewer.src = fileURL;
      }
    }, 1000);
    this.s_loading.hideLoading();
    this.datos = false;
  }
  async datosPlanilla() {
    const loadId = ++this.currentLoadId;
    this.interes = await this.s_interes.getInteresFactura(this.idFactura!);
    if (loadId !== this.currentLoadId) {
      return;
    }

    this.facService.getById(this.idFactura!).subscribe({
      next: (resp: any) => {
        if (loadId !== this.currentLoadId) {
          return;
        }
        this.planilla.idfactura = resp.idfactura;
        this.planilla.modulo = resp.idmodulo.descripcion;
        this.planilla.idmodulo = resp.idmodulo;
        this.planilla.fecha = resp.feccrea;
        this.planilla.nomcli = resp.idcliente.nombre;
        this.planilla.nrofactura = resp.nrofactura;
        this.planilla.fechacobro = resp.fechacobro;
        this.planilla.totaltarifa = resp.totaltarifa;
        this.planilla.valorbase = resp.valorbase;
        this.planilla.interescobrado = Number(resp.interescobrado || 0);
        this.planilla.swiva = Number(resp.swiva || 0);
        this.planilla.idabonado = resp.idabonado;
        this.planilla.pagado = resp.pagado;
        this.planilla.estado = resp.estado;
        this.planilla.fechaanulacion = resp.fechaanulacion;
        this.planilla.razonanulacion = resp.razonanulacion;
        this.planilla.fechaeliminacion = resp.fechaeliminacion;
        this.planilla.razoneliminacion = resp.razoneliminacion;
        this.getRubroxfac();
      },
      error: (err) => console.error(err.error),
    });
  }

  getRubroxfac() {
    this.rxfService.getDetalleByIdfactura(this.idFactura!).subscribe({
      next: (datos) => {
        this._rubroxfac = Array.isArray(datos) ? datos : [];
        this.subtotal();
      },
      error: (err) => console.error(err.error),
    });
  }

  regresar() {
    this.router.navigate(['/facturas']);
  }

  subtotal() {
    let suma12 = 0;
    let suma0 = 0;
    let subtotalSinIva = 0;
    let valorivaCalculado = 0;
    const porcentajeIva = Number(this._impuesto?.valor || 0) / 100;

    (this._rubroxfac || []).forEach((rubro: any) => {
      const totalRubro = Number(rubro?.cantidad || 0) * Number(rubro?.valorunitario || 0);
      const esRubroIva = Number(rubro?.idrubro_rubros?.esiva || 0) === 1;

      if (esRubroIva) {
        return;
      }

      if (rubro?.idrubro_rubros?.swiva == 1 || rubro?.idrubro_rubros?.swiva === true) {
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

  multaCalculate(idfactura: number) {
    this.s_loading.showLoading();
    this.facService.calculateMultaAsync(idfactura).then(
      (resp) => {
        console.log(resp);
        this.s_loading.hideLoading();
      },
      (error) => {
        console.error(error);
        this.s_loading.hideLoading();
      }
    );
  }

  estaEliminada(): boolean {
    return !!this.planilla?.fechaeliminacion;
  }

  estaAnulada(): boolean {
    return !this.estaEliminada() && !!this.planilla?.fechaanulacion;
  }

  getEstadoPlanilla(): string {
    if (this.estaEliminada()) {
      return 'ELIMINADA';
    }

    if (this.estaAnulada()) {
      return 'ANULADA';
    }

    return 'ACTIVA';
  }

  getEstadoPlanillaClass(): string {
    if (this.estaEliminada()) {
      return 'badge-danger';
    }

    if (this.estaAnulada()) {
      return 'badge-warning';
    }

    return 'badge-success';
  }

  puedeGenerarFacturaElectronica(): boolean {
    return !this.planilla?.nrofactura && !this.estaEliminada() && !this.estaAnulada();
  }

  async generarFacturaElectronica(): Promise<void> {
    if (!this.planilla?.idfactura || !this.puedeGenerarFacturaElectronica()) {
      return;
    }

    const confirmar = confirm(
      `¿Desea generar la factura electrónica para la planilla ${this.planilla.idfactura}?`
    );

    if (!confirmar) {
      return;
    }

    this.s_loading.showLoading();

    try {
      await this.fecfacturaService.generateXmlOfPago(this.planilla.idfactura);
      await this.datosPlanilla();
      alert('Factura electrónica generada correctamente.');
    } catch (error) {
      console.error('Error al generar la factura electrónica', error);
      alert('No se pudo generar la factura electrónica.');
    } finally {
      this.s_loading.hideLoading();
    }
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
  interescobrado: number;
  swiva: number;
  idabonado: number;
  pagado: number;
  idmodulo: number;
  estado: number;
  fechaanulacion: Date;
  razonanulacion: String;
  fechaeliminacion: Date;
  razoneliminacion: String;
}
