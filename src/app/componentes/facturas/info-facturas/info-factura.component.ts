import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Impuestos } from 'src/app/modelos/impuestos';
import { FacturaService } from 'src/app/servicios/factura.service';
import { ImpuestosService } from 'src/app/servicios/impuestos.service';
import { InteresesService } from 'src/app/servicios/intereses.service';
import { JasperReportService } from 'src/app/servicios/jasper-report.service';
import { LoadingService } from 'src/app/servicios/loading.service';
import { RubroxfacService } from 'src/app/servicios/rubroxfac.service';

@Component({
  selector: 'app-info-factura',
  templateUrl: './info-factura.component.html',
  styleUrls: ['./info-factura.component.css'],
})
export class InfoFacturasComponent implements OnInit {
  idFactura: number;
  planilla = {} as Planilla; //Interface para los datos del registro de la Facturación
  _rubroxfac: any;
  suma12: number;
  suma0: number;
  valoriva: number;
  _impuesto: Impuestos = new Impuestos();
  interes: number = 0;
  @Input() idfac: any;
  swreturn: boolean = true;
  datos: boolean = true;

  constructor(
    private facService: FacturaService,
    private router: Router,
    private rxfService: RubroxfacService,
    private s_impuestos: ImpuestosService,
    private s_interes: InteresesService,
    private s_jasperreport: JasperReportService,
    private s_loading: LoadingService
  ) {}

  ngOnInit(): void {
    this.idFactura = +sessionStorage.getItem('idfacturaToInfo')!;
    sessionStorage.removeItem('idfacturaToInfo');
    console.log(this.idFactura);
    if (this.idFactura == 0 || this.idFactura == null) {
      this.idFactura = this.idfac;
      this.swreturn = false;
    }
    if ((this.idFactura == 0 || this.idFactura == null) && this.idfac == null) {
      this.regresar();
    }
    this.datosPlanilla();
    this.getImpuestoAcutal();
  }
  getImpuestoAcutal() {
    this.s_impuestos.getCurrentlyInteres().subscribe({
      next: (datos: any) => {
        console.log(datos);
        this._impuesto = datos;
      },
      error: (e: any) => console.error(e),
    });
  }
  async impComprobantePago(idfactura: number) {
    this.datos = true;
    this.s_loading.showLoading();
    let body: any;
    console.log(this.planilla);
    console.log(this.planilla.idmodulo)
    let modulo: any = this.planilla.idmodulo; 
    if (this.planilla.idabonado > 0 && modulo.idmodulo == 4) {
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
  datosPlanilla() {
    this.s_interes.getInteresFactura(this.idFactura!).subscribe({
      next: (interes: any) => {
        console.log(interes);
        this.interes = interes;
      },
    });
    this.facService.getById(this.idFactura!).subscribe({
      next: (resp: any) => {
        this.planilla.idfactura = resp.idfactura;
        this.planilla.modulo = resp.idmodulo.descripcion;
        this.planilla.idmodulo = resp.idmodulo;
        this.planilla.fecha = resp.feccrea;
        this.planilla.nomcli = resp.idcliente.nombre;
        this.planilla.nrofactura = resp.nrofactura;
        this.planilla.fechacobro = resp.fechacobro;
        this.planilla.totaltarifa = resp.totaltarifa;
        this.planilla.valorbase = resp.valorbase;
        this.planilla.idabonado = resp.idabonado;
        this.planilla.pagado = resp.pagado;
        this.getRubroxfac();
      },
      error: (err) => console.error(err.error),
    });
  }

  getRubroxfac() {
    this.rxfService.getByIdfactura(this.idFactura!).subscribe({
      next: (datos) => {
        this._rubroxfac = datos;
        this.subtotal();
      },
      error: (err) => console.error(err.error),
    });
  }

  regresar() {
    this.router.navigate(['/facturas']);
  }

  subtotal() {
    let suma12: number = 0;
    let suma0: number = 0;
    let valoriva = 0;
    let i = 0;
    this._rubroxfac.forEach(() => {
      if (this._rubroxfac[i].idrubro_rubros.swiva == 1) {
        suma12 +=
          this._rubroxfac[i].cantidad * this._rubroxfac[i].valorunitario;
        valoriva +=
          this._rubroxfac[i].cantidad *
          this._rubroxfac[i].valorunitario *
          (this._impuesto.valor / 100);
      } else {
        if (this._rubroxfac[i].idrubro_rubros.esiva == 0) {
          suma0 +=
            this._rubroxfac[i].cantidad * this._rubroxfac[i].valorunitario;
        } else {
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
  idabonado: number;
  pagado: number;
  idmodulo: number;
}
