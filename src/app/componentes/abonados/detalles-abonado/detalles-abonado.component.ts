import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnInit,
  ViewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { Lecturas } from 'src/app/modelos/lecturas.model';
import { AbonadosService } from 'src/app/servicios/abonados.service';
import { FacturaService } from 'src/app/servicios/factura.service';
import { LecturasService } from 'src/app/servicios/lecturas.service';
import { RubroxfacService } from 'src/app/servicios/rubroxfac.service';
import { Chart, registerables } from 'chart.js';
import { FecfacturaService } from 'src/app/servicios/fecfactura.service';
import { InteresesService } from 'src/app/servicios/intereses.service';
import { Facturas } from 'src/app/modelos/facturas.model';
import { RecaudacionReportsService } from '../../recaudacion/recaudacion-reports.service';
import { ConvenioService } from 'src/app/servicios/convenio.service';
import autoTable from 'jspdf-autotable';
import jsPDF from 'jspdf';
import { PdfService } from 'src/app/servicios/pdf.service';
import { LoadingService } from 'src/app/servicios/loading.service';
import { Condmultaintereses } from 'src/app/modelos/condmultasintereses';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { CondmultasinteresesService } from 'src/app/servicios/condmultasintereses.service';
import * as L from 'leaflet';
import { JasperReportService } from 'src/app/servicios/jasper-report.service';
import { FormBuilder, FormGroup } from '@angular/forms';
import { SriService } from 'src/app/servicios/sri.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-detalles-abonado',
  templateUrl: './detalles-abonado.component.html',
  styleUrls: ['./detalles-abonado.component.css'],
})
export class DetallesAbonadoComponent implements OnInit, AfterViewInit {
  abonado = {} as datAbonado; //Interface para los datos del Abonado

  n_factura: String;
  _abonado: any;
  _facturas: any; //Planillas del Abonado
  _lecturas: any; //Historial de consumo
  elimdisabled = true;
  _rubrosxfac: any;
  totfac: number;
  idfactura: number;
  grafic: Boolean = false;
  f_sendEmail: FormGroup;

  rango: number = 15;
  estadoFE: string;
  esFE: string;
  factura: Facturas = new Facturas();

  _convenios: any;
  swconvenio: boolean = false;
  opt = '0';

  datosImprimir: any;
  /* Intereses */
  calInteres = {} as calcInteres;
  totInteres: number = 0;
  arrCalculoInteres: any = [];
  //factura: Facturas = new Facturas();
  _intereses: any;
  $event: any;
  valoriva: number;
  _codigo: string;
  pdfView: boolean = true;
  facElectro: boolean = true;

  swFE: boolean = false;

  modalSize: string = 'sm';
  /* para reporte */
  _rxf: any = [];
  rubrostotal: number = 0;
  /* PARA INFO CONDONACION DE DEUDAS */
  c_rubros: any = [];
  multa: any = [];
  sumInteres: any = 0;
  totalRubros: number = 0;
  totalMultas: number = 0;
  _sincobro: any;
  date: Date = new Date();
  condonar: Condmultaintereses = new Condmultaintereses();
  razonCondonacion: string;
  detalleFactura: any;
  usuario: number;
  @Input() cuenta: any;
  swreturn: boolean = false;
  edificioMatriz: any = [0.8038125013453109, -77.72763063596486];
  map!: L.Map | undefined;
  mostrarMapa: boolean = false;

  swEmail: boolean = false;
  selectedFile: File | null = null;
  dataURI: any;
  nameFile: string = 'Vacío...';
  email: string;
  active: boolean = false;

  mensajeBody = `<h3>Se adjunta su documénto electrónico. No responder este mensaje.</h3>

<hr style="border-top: 1px solid #ccc; margin: 20px 0;" />

<table style="font-family: Arial, sans-serif; font-size: 14px; color: #333;">
  <tr>
    <td>
      <img src="https://epmapatulcan.gob.ec/wp/wp-content/uploads/2021/05/LOGO-HORIZONTAL.png" alt="Logo EPMAPA-T" width="120" style="margin-right: 15px;">
    </td>
    <td>
      <p style="margin: 0; font-weight: bold; color: #0066cc;">EPMAPA-T</p>
      <p style="margin: 2px 0;">Empresa Pública Municipal de Agua Potable y Alcantarillado de Tulcán</p>
      <p style="margin: 2px 0;"><strong>Dirección:</strong> Ca. Juan Ramón Arellano y Ca. Bolívar, Tulcán - Ecuador</p>
      <p style="margin: 2px 0;"><strong><i class="fa-solid fa-phone-volume"></i> Teléfono:</strong> (06) 2980 021 </p>
      <p style="margin: 2px 0;"><strong><i class="fa-brands fa-whatsapp"></i> WhatsApp:</strong> (06) 2980 021 </p>
      <p style="margin: 2px 0;"><strong>Horario de atención:</strong> Lunes a Viernes, 07h30 - 16h30</p>
      <p style="margin: 10px 0 0; font-size: 12px; color: #888;">Este mensaje es confidencial. Si usted no es el destinatario, elimínelo inmediatamente.</p>
    </td>
  </tr>
</table>
`;

  @ViewChild('pdfViewer', { static: false }) pdfViewer!: ElementRef;

  constructor(
    private aboService: AbonadosService,
    private facService: FacturaService,
    private rubxfacService: RubroxfacService,
    private lecService: LecturasService,
    private router: Router,
    public _fecFacturaService: FecfacturaService,
    public s_interes: InteresesService,
    public s_pdfRecaudacion: RecaudacionReportsService,
    public s_convenios: ConvenioService,
    private s_pdf: PdfService,
    private s_loading: LoadingService,
    private authService: AutorizaService,
    private s_condonar: CondmultasinteresesService,
    private s_jasperreport: JasperReportService,
    private f: FormBuilder,
    private s_sri: SriService
  ) { }

  ngOnInit(): void {
    this.f_sendEmail = this.f.group({
      emisor: [''],
      password: [''],
      receptores: [''], // separados por coma
      asunto: ['Notificación de valores pendientes'],
      mensaje: '',
    });
    this.obtenerDatosAbonado();
    this.listarIntereses();
    this.usuario = this.authService.idusuario;
  }
  ngAfterViewInit(): void { }
  cancelarFE() {
    if (this.facElectro != true) {
      this.facElectro = !this.facElectro;
    }
  }
  getFactura() {
    this.facturasxAbonado(this.abonado.idabonado);
  }

  obtenerDatosAbonado() {
    let idabonado: any;
    if (!this.cuenta) {
      this.swreturn = false;
      idabonado = sessionStorage.getItem('idabonadoToFactura');
    } else {
      this.swreturn = true;
      idabonado = this.cuenta;
    }
    this.aboService.getByIdabonado(+idabonado!).subscribe({
      next: (datos: any) => {
        this.email = datos[0].idresponsable.email.toString();
        this.f_sendEmail.patchValue({
          receptores: datos[0].idresponsable.email,
        });

        this._abonado = datos;
        this.abonado.idabonado = this._abonado[0].idabonado;
        this.abonado.nombre = this._abonado[0].idcliente_clientes.nombre;
        this.abonado.nromedidor = this._abonado[0].nromedidor;
        this.abonado.marca = this._abonado[0].marca;
        this.abonado.fechainstalacion = this._abonado[0].fechainstalacion;
        this.abonado.direccionubicacion = this._abonado[0].direccionubicacion;
        this.abonado.ruta = this._abonado[0].idruta_rutas.descripcion;
        this.abonado.categoria =
          this._abonado[0].idcategoria_categorias.descripcion;
        this.abonado.estado = this._abonado[0].estado;
        this.abonado.textestado = getEstadoText(this._abonado[0].estado);
        this.abonado.municipio = this._abonado[0].municipio;
        this.abonado.adultomayor = this._abonado[0].adultomayor;
        this.abonado.promedio = this._abonado[0].promedio;
        this.abonado.responsablepago = this._abonado[0].idresponsable.nombre;
        this.abonado.geolocalizacion = this._abonado[0].geolocalizacion;
      },
      error: (err) => console.error(err.error),
    });

    this.facturasxAbonado(+idabonado!);
    //this.drawAllCuentas();
  }
  estado_FE(estado: String) {
    switch (estado) {
      case 'A':
        this.swFE = false;
        return 'APROBADO, ENVADO MAIL';
      case 'O':
        this.swFE = false;
        return 'APROBADO, NO ENVIADO MAIL ';
      case 'C':
        this.swFE = true;
        return 'DEVUELTA';
      case 'G':
        this.swFE = true;
        return 'GENERANDO';
      case 'I':
        this.swFE = true;
        return 'INGRESADO';
      case 'U':
        this.swFE = true;
        return 'ERROR AL AUTORIZAR';
      case 'E':
        this.swFE = true;
        return 'DATOS INCOMPLETOS';
      default:
        this.swFE = true;
        return 'Sin enviar';
    }
  }
  drawCuenta(abonado: any): void {
    if (abonado.geolocalizacion != null) {
      const coordsArray: L.LatLngExpression = JSON.parse(
        abonado.geolocalizacion
      );
      this.mostrarMapa = true;
      setTimeout(() => {
        this.map = L.map('map').setView(coordsArray, 19);
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; EPMAPA-T',
        }).addTo(this.map);
        L.marker(coordsArray)
          .addTo(this.map)
          .bindPopup(`${abonado.idabonado} <br/> ${abonado.direccionubicacion}`)
          .openPopup();
      }, 300);
    } else {
      this.mostrarMapa = false;
      alert('CUENTA SIN ACUALIZAR GEOLOCALIZACION');
    }
  }

  facturasxAbonado(idabonado: number) {
    this.s_loading.showLoading();
    this.facService.getByIdabonadorango(idabonado, this.rango).subscribe({
      next: (datos: any) => {
        if (datos.length > 0) {
          datos.map(async (item: any) => {
            let _feccrea = await this.getEmisionoByFactura(item.idfactura);
            if (_feccrea != null) {
              item.feccrea = _feccrea;
            }
            if (item.pagado === 0) {
              let inte = await this.cInteres(item);
              item.interescobrado = +inte.toFixed(2);
            }
            if (item.pagado === 1 && item.interescobrado === null) {
              item.interescobrado = 0;
            }
            /*           item.feccrea = await this.getEmisionoByFactura(item.idfactura);
             */ this.s_loading.hideLoading();
          });
          this._facturas = datos;
        } else {
          this.s_loading.hideLoading();
        }
      },
      error: (err) => console.error(err.error),
    });
  }

  formatInteres(interes: any) {
    if (interes != null) {
      return interes.toFixed(2);
    } else {
      return 0;
    }
  }
  validarpago(factura: any) {
    let respuesta: Boolean = true;
    if (factura.pagado === 0 && factura.totaltarifa > 0) {
      respuesta = false;
    }
    if (
      factura.formapago === 4 &&
      factura.estado === 3 &&
      factura.pagado === 1
    ) {
      respuesta = false;
    }
    if (factura.fechaconvenio != null || factura.estadoconvenio === 1) {
      respuesta = true;
    }
    //if(factura.fechaconvenio )
    return respuesta;
  }
  async getEmisionoByFactura(idfactura: any): Promise<any> {
    return this.lecService.findDateByIdfactura(idfactura).toPromise();
  }
  valorPagado(idmodulo: number, valor: number) {
    if (idmodulo === 3 && valor > 0) {
      return valor + 1;
    } else {
      return valor;
    }
  }
  lecturasxAbonado(idabonado: number) {
    this.lecService.getLecturasxIdabonado(idabonado, 15).subscribe({
      next: (datos) => {
        this._lecturas = datos;
      },
      error: (err) => console.error(err.error),
    });
  }
  getConveniosPago(idabonado: number) {
    this.s_convenios.getByReferencia(idabonado.toString()).subscribe({
      next: (dConvenios: any) => {
        this._convenios = dConvenios;
        if (this._convenios.length > 0) {
          this.swconvenio = true;
        } else {
          this.swconvenio = false;
        }
      },
      error: (e) => console.error(e),
    });
  }

  async getRubroxfac(idfactura: number) {
    this.idfactura = idfactura;
    this.detalleFactura = await this.facService.getByIdAsync(idfactura);
    this.rubxfacService.getByIdfactura(+idfactura!).subscribe({
      next: (detalle: any) => {
        this._rubrosxfac = detalle;
        this.factura = detalle[0].idfactura_facturas;
        if (detalle[0].idfactura_facturas.pagado === 1) {
          this._fecFacturaService.getByIdFactura(+idfactura!).subscribe({
            next: (fecfactura: any) => {
              this.esFE = fecfactura.estado;
              if (fecfactura != null) {
                this.estadoFE = this.estado_FE(fecfactura.estado);
              } else {
                this.estadoFE = 'SIN GENERAR';
              }
            },
            error: (e) => console.error(e),
          });
        } else if (detalle[0].idfactura_facturas.pagado === 0) {
          this.estadoFE = 'PAGO PENDIENTE';
        }
        this.subtotal();
      },
      error: (err) => console.error(err.error),
    });
  }

  detallesHistorial(lectura: Lecturas) { }

  regresar() {
    let padre = sessionStorage.getItem('padreDetalleAbonado');
    if (padre == '1') {
      this.router.navigate(['/abonados']);
    }
    if (padre == '2') {
      this.router.navigate(['/detalles-cliente']);
    }
  }

  modiAbonado(idabonado: number) {
    sessionStorage.setItem('idabonadoToModi', idabonado.toString());
    this.router.navigate(['/modificar-abonado']);
  }

  subtotal() {
    let suma12: number = 0;
    let suma0: number = 0;
    let i = 0;
    this._rubrosxfac.forEach(() => {
      if (this._rubrosxfac[i].idrubro_rubros.swiva == 1) {
        suma12 +=
          this._rubrosxfac[i].cantidad * this._rubrosxfac[i].valorunitario;
      } else {
        if (this._rubrosxfac[i].idrubro_rubros.esiva == 0) {
          suma0 +=
            this._rubrosxfac[i].cantidad * this._rubrosxfac[i].valorunitario;
        } else {
        }
      }
      i++;
    });
    this.totfac = suma12 + suma0;
  }
  info(event: any, idconvenio: number) {
    const tagName = event.target.tagName;
    if (tagName === 'TD') {
      sessionStorage.setItem('idconvenioToInfo', idconvenio.toString());
      this.router.navigate(['info-convenio']);
    }
  }

  grafico(idabonado: number): void {
    this.grafic = true;
    Chart.register(...registerables);

    var y = [];
    var emision: string;
    for (let i = 0; i <= this._lecturas.length - 1; i++) {
      emision =
        this._lecturas[i].idrutaxemision_rutasxemision.idemision_emisiones
          .emision;
      emision = '20' + emision.substring(0, 2) + '-' + emision.substring(2, 4);
      y.push({
        mes: emision,
        consumo:
          this._lecturas[i].lecturaactual - this._lecturas[i].lecturaanterior,
      });
    }
    // Si ya existía, primero lo destruye
    var oldChart = Chart.getChart('myChart');
    if (oldChart) {
      oldChart.destroy();
    }

    // Crea el nuevo gráfico
    var ctx: any;
    ctx = document.getElementById('myChart') as HTMLCanvasElement;

    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: y.map((row: { mes: any }) => row.mes),
        datasets: [
          {
            label: 'Consumo',
            data: y.map((row: { consumo: any }) => row.consumo),
          },
        ],
      },
    });
  }
  expFacElectronica(idfactura: number) {
    this.facService.getById(idfactura).subscribe({
      next: (d_factura: any) => {
        this._fecFacturaService.expDesdeAbonados(d_factura);
        //this.swFactura = true
      },
      error: (e: any) => console.error(e),
    });
  }

  cerrarGrafico() {
    this.grafic = false;
  }
  async impComprobante(datos: any) {
    let idfactura = datos.idfactura;
    //this.facElectro = true;

    //this.datos = true;
    this.s_loading.showLoading();
    let body: any;
    if (
      datos.idabonado > 0 &&
      (datos.idmodulo.idmodulo == 4 || datos.idmodulo.idmodulo === 3)
    ) {
      body = {
        reportName: 'CompPagoConsumoAgua',
        parameters: {
          idfactura: idfactura,
        },
        extencion: '.pdf',
      };
    } else if (datos.idmodulo.idmodulo === 27 || datos.estado === 2) {
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
    this.facElectro = false;
    this.s_loading.hideLoading();
  }
  async impFacturaElectronica(datos: any) {
    this.facElectro = true;
    this.dataURI = '';
    this.swEmail = true;
    this.s_loading.showLoading();

    let fact = await this.facService.generarPDF_FacElectronica(datos.idfactura);
    //this.facElectro = true;
    // Crear blob desde los datos del backend
    setTimeout(() => {
      const file = new Blob([fact], { type: 'application/pdf' });
      const fileURL = URL.createObjectURL(file);
      this.dataURI = fact;
      // Asignar el blob al iframe
      const pdfViewer = document.getElementById(
        'pdfViewer'
      ) as HTMLIFrameElement;

      if (pdfViewer) {
        pdfViewer.src = fileURL;
      }
    }, 1000);

    this.s_loading.hideLoading();
    this.facElectro = false;
  }

  setOptImprimir() {
    switch (this.opt) {
      case '0':
        this.getSinCobro();
        this.pdfView = false;
        this.modalSize = 'xl';
        break;
    }
  }
  cancelar() {
    this.pdfView = true;
    this.modalSize = 'sm';
  }
  getSinCobro() {
    this.facService.getSinCobrar(this._abonado[0].idabonado).subscribe({
      next: (facturas: any) => {
        this._abonado[0].facturas = facturas;
        this.datosImprimir = this._abonado[0];
        this.impNotificacion();
      },
      error: (e) => console.error(e.error),
    });
  }
  calcularDeudasAC() {
    this.s_loading.showLoading();
    this.c_rubros = [];
    this.multa = [];
    this.sumInteres = 0;
    this.totalMultas = 0;
    this.totalRubros = 0;
    this.modalSize = 'lg';
    this.facService.getSinCobrarAboMod(this._abonado[0].idabonado).subscribe({
      next: async (facturas: any) => {
        this._sincobro = facturas;
        facturas.forEach(async (item: any) => {
          let interes = await this.cInteres(item);
          this.sumInteres += interes;
        });
        let _rxf = await this.rubxfacService.getRubrosIdAbonado(
          this._abonado[0].idabonado
        );
        this.multa.push({
          idrubro_rubros: 5,
          descripcion: 'Interés',
          total: this.sumInteres,
        });
        _rxf.forEach((item: any) => {
          if (item.idrubro_rubros != 6) {
            this.c_rubros.push(item);
            this.totalRubros += item.total;
          }
          if (item.idrubro_rubros === 6) {
            this.multa.push(item);
          }
        });
        this.multa.forEach((item: any) => {
          this.totalMultas += item.total;
        });
        this.s_loading.hideLoading();
        /*         facturas.forEach(async (item: any) => {

          await this._rxf.forEach((item: any) => {
            d_rxf.push([
              item.idrubro_rubros,
              item.descripcion,
              +item.total.toFixed(2),
            ]);
            this.rubrostotal += item.total;
          });
        }); */
      },
      error: (e) => console.error(e.error),
    });
  }
  condonarDeudas() {
    this.s_loading.showLoading();
    let n_factura: Facturas = new Facturas();
    //this.modalSize = 'sm';
    this._sincobro.forEach((item: any) => {
      n_factura = item;
      n_factura.swcondonar = true;

      this.facService.updateFacturas(n_factura).subscribe({
        next: async (factura) => {
          let multa: number = 0;
          let _multa = await this.rubxfacService.getMultaByIdFactura(
            item.idfactura
          );
          if (_multa.length > 0) {
            multa = _multa[0].cantidad * _multa[0].valorunitario;
          }
          this.condonar.idfactura_facturas = item;
          this.condonar.totalinteres = await this.cInteres(item);
          this.condonar.totalmultas = multa;
          this.condonar.feccrea = this.date;
          this.condonar.usucrea = this.authService.idusuario;
          this.condonar.razoncondonacion = this.razonCondonacion;
          this.s_condonar.saveCondonacion(this.condonar).subscribe({
            next: (datos: any) => {
              this.s_loading.hideLoading();
            },
            error: (e) => console.error(e),
          });
        },
      });
    });
  }
  razonCondonacionChange(e: any) {
    this.validar();
  }
  validar() {
    let respuesta: boolean = true;
    if (
      this.razonCondonacion != null ||
      this.razonCondonacion != undefined ||
      this.razonCondonacion != '' ||
      this.razonCondonacion != ' '
    ) {
      respuesta = false;
    }

    if (
      this.razonCondonacion === null ||
      this.razonCondonacion === undefined ||
      this.razonCondonacion === '' ||
      this.razonCondonacion === ' '
    ) {
      respuesta = true;
    }
    return respuesta;
  }
  async impNotificacion() {
    this.s_loading.showLoading();
    this.nameFile = 'Generando archivo...';
    let doc = new jsPDF('p', 'pt', 'a4');
    this.rubrostotal = 0;
    doc.setFontSize(14);
    this.s_pdf.header(
      `Notificación de deudas pendientes: ${this.datosImprimir.idabonado.toString()}`,
      doc
    );
    doc.setFontSize(7);
    autoTable(doc, {
      head: [
        [
          {
            colSpan: 2,
            content: 'DATOS PERSONALES',
            styles: { halign: 'center' },
          },
        ],
      ],
      body: [
        [
          `CLIENTE: ${this.datosImprimir.idcliente_clientes.nombre}`,
          `IDENTIFICACIÓN: ${this.datosImprimir.idcliente_clientes.cedula}`,
        ],
        [
          `EMAIL: ${this.datosImprimir.idcliente_clientes.email}`,
          `TELEFONO: ${this.datosImprimir.idcliente_clientes.telefono}`,
        ],
        [
          `DIRECCIÓN: ${this.datosImprimir.direccionubicacion}`,
          `RUTA: ${this.datosImprimir.idruta_rutas.descripcion}`,
        ],
        [
          `CATEGORÍA: ${this.datosImprimir.idcategoria_categorias.descripcion}`,
          `AL.: ${this.datosImprimir.swalcantarillado} / A.M.: ${this.datosImprimir.adultomayor} / M: ${this.datosImprimir.municipio}`,
        ],
      ],
    });

    // Gather all `getSumaFac()` promises
    const sumaFacPromises: any[] = [];
    let facturas: any = this.datosImprimir.facturas;
    //this._rxf = [];

    facturas.forEach(async (factura: any) => {
      factura.interes = await this.cInteres(factura);
    });
    let d_facturas = [];
    // Wait for all `getSumaFac()` promises to resolve
    let t_subtotal: number = 0;
    let t_intereses: number = 0;
    let t_total: number = 0;
    let d_rxf: any = [];
    this._rxf = await this.rubxfacService.getRubrosIdAbonado(
      this._abonado[0].idabonado
    );
    await this._rxf.forEach((item: any) => {
      d_rxf.push([
        item.idrubro_rubros,
        item.descripcion,
        +item.total.toFixed(2),
      ]);
      this.rubrostotal += item.total;
    });

    // Iterate through facturas and add sumaFac values
    for (let i = 0; i < facturas.length; i++) {
      const factura = facturas[i];
      const sumaFac = await this.getSumaFac(facturas[i].idfactura);
      facturas[i].sumaFac = sumaFac;
      let fecEmision = await this.getFechaEmision(facturas[i].idfactura);
      let suma = +factura.sumaFac + +factura.interes;
      d_facturas.push([
        factura.idfactura,
        //fecEmision.slice(0, 7),
        fecEmision,
        factura.modulo,
        factura.sumaFac.toFixed(2),
        factura.interes.toFixed(2),
        suma.toFixed(2),
      ]);
      t_subtotal += factura.sumaFac;
      t_intereses += factura.interes;
      t_total += suma;
    }
    d_facturas.push([
      '',
      '',
      'TOTALES: ',
      t_subtotal.toFixed(2),
      t_intereses.toFixed(2),
      t_total.toFixed(2),
    ]);
    autoTable(doc, {
      headStyles: { halign: 'center' },
      head: [
        ['Planilla', 'Emision', 'Módulo', 'Sub total', 'Interés', 'Total'],
      ],
      columnStyles: {
        1: { halign: 'right' },
        2: { halign: 'center' },
        3: { halign: 'center' },
        4: { halign: 'center' },
        5: { halign: 'center' },
      },
      body: d_facturas,
    });
    let t: number = t_intereses + this.rubrostotal;
    d_rxf.push(
      ['5', 'Interes', t_intereses.toFixed(2)],
      ['', 'Sub total: ', this.rubrostotal.toFixed(2)],
      ['', 'Total: ', t.toFixed(2)]
    );
    autoTable(doc, {
      head: [['Cod.Rubro', 'Descripción', 'Valor']],
      body: d_rxf,
    });
    this.s_pdf.setfooter(doc);
    // Generate data URI and set iframe source
    const pdfDataUri = doc.output('datauri');
    if (this.swEmail == true) {
      //this.dataURItoBlob(pdfDataUri);
      this.dataURI = doc.output('datauri').toString();
    } else {
      const pdfViewer: any = document.getElementById(
        'pdfViewer'
      ) as HTMLIFrameElement;
      pdfViewer.src = pdfDataUri;
    }
    this.nameFile = `Notificación_${this._abonado[0].idabonado}.pdf`;

    this.s_loading.hideLoading();
    // Generate and output the PDF after all data is processed
    //doc.output('pdfobjectnewwindow');
  }

  dataURItoBlob(dataURI: any): Blob {
    const byteString = atob(dataURI.split(',')[1]);
    const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);

    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }

    return new Blob([ab], { type: mimeString });
  }
  listarIntereses() {
    this.s_interes.getListaIntereses().subscribe({
      next: (datos) => {
        this._intereses = datos;
      },
      error: (err) => console.error(err.error),
    });
  }
  async getFechaEmision(idfactura: number): Promise<any> {
    const fechaEmision = this.lecService
      .findDateByIdfactura(idfactura)
      .toPromise();
    return fechaEmision;
  }
  cInteres(factura: any) {
    let interes: any = this.s_interes.getInteresTemporal(factura.idfactura);
    return interes;
  }
  /* Este metodo calcula el interes individual y la uso en el metodo de listar las facturas sin cobro */
  _cInteres(factura: any) {
    this.totInteres = 0;
    this.arrCalculoInteres = [];
    /*     if (
      (factura.idmodulo.idmodulo == 4 || factura.idmodulo.idmodulo == 3) &&
      factura.idabonado > 0
    ) {
      let fechaemision = await this.getEmisionoByFactura(factura.idfactura);
      factura.feccrea = fechaemision;
    } */

    let interes: number = 0;
    if (factura.estado != 3 && factura.formapago != 4) {
      let fec = factura.feccrea.toString().split('-', 2);
      let mes = +fec[1]! + 1;
      if (mes > 12) {
        mes = 1;
      }
      let fechai: Date = new Date(`${fec[0]}-${mes}-01`);
      let fechaf: Date = new Date();
      this.factura = factura;
      fechaf.setMonth(fechaf.getMonth() - 1);
      while (fechai <= fechaf) {
        this.calInteres = {} as calcInteres;
        let query = this._intereses.find(
          (interes: { anio: number; mes: number }) =>
            interes.anio === +fechai.getFullYear()! &&
            interes.mes === +fechai.getMonth()! + 1
        );
        if (!query) {
          this.calInteres.anio = +fechai.getFullYear()!;
          this.calInteres.mes = +fechai.getMonth()! + 1;
          this.calInteres.interes = 0;
          query = this.calInteres;
        } else {
          this.calInteres.anio = query.anio;
          this.calInteres.mes = query.mes;
          this.calInteres.interes = query.porcentaje;
          this.calInteres.valor = factura.totaltarifa;
          this.arrCalculoInteres.push(this.calInteres);
        }
        fechai.setMonth(fechai.getMonth() + 1);
      }
      this.arrCalculoInteres.forEach((item: any) => {
        //this.totInteres += (item.interes * item.valor) / 100;
        interes += (item.interes * item.valor) / 100;
        // this.subtotal();
      });
    }
    return +interes.toFixed(2);
  }
  onFileChange(event: any): void {
    if (event.target.files.length > 0) {
      this.selectedFile = event.target.files[0];
    }
  }
  sendEmail() {
    if (this.swEmail === true) {
      //const pdfBlob = this.dataURItoBlob(this.dataURI);

      let pdfBlob: Blob;

      if (this.dataURI instanceof Blob) {
        // Ya es un Blob, úsalo directamente
        pdfBlob = this.dataURI;
      } else {
        // No es Blob, asume que es un Data URI y conviértelo
        pdfBlob = this.dataURItoBlob(this.dataURI);
      }

      const formData = new FormData();

      const formValue = this.f_sendEmail.value;

      // Campos normales
      //formData.append('emisor', formValue.email); // o usa formValue.emisor si así se llama
      //formData.append('password', formValue.password); // si se requiere
      formValue.mensaje += `${this.mensajeBody} <p style="margin: 10px 0 0; font-size: 12px; color: #888;">Este mensaje fué enviado por: ${this.authService.alias}.</p>`;
      formData.append('asunto', formValue.asunto || 'Sin asunto');
      formData.append('mensaje', formValue.mensaje);
      // Adjuntar PDF generado
      formData.append('file', pdfBlob, this.nameFile);
      // Adjuntar receptores (separados por coma)
      const receptores = formValue.receptores
        .split(',')
        .map((r: string) => r.trim());
      receptores.forEach((email: string) => {
        formData.append('receptores', email);
      });

      // Adjuntar archivo adicional si se seleccionó uno
      if (this.selectedFile) {
        formData.append('file', this.selectedFile); // OJO: esto reemplaza el PDF anterior
        // Si quieres enviar ambos archivos, usa otro nombre como 'file2'
        // formData.append('file2', this.selectedFile);
      }

      this.s_sri.sendEmailNotification(formData).subscribe({
        next: (datos: any) => {
          this.swal('success', datos.message);
          this.s_loading.hideLoading();
        },
        error: (e: any) => {
          console.error('Error al enviar:', e);
          this.swal('danger', 'Error al Enivar');
          this.s_loading.hideLoading();
        },
      });
    }
  }
  sendFacturaEmail() {
    this.nameFile = 'Factura.pdf';
    this.f_sendEmail.patchValue({
      asunto: 'Factura EPMAPA-T',
      receptores: this.email,
    });
    this.sendEmail();
    this.active = false;
  }

  async getSumaFac(idfactura: number): Promise<any> {
    const sumaFac = await this.rubxfacService.getSumaValoresUnitarios(
      idfactura
    );
    return sumaFac;
  }
  async contSinCobrar(idabonado: number) {
    let dato = await this.facService.countSinCobrarAbo(idabonado);
    /* .then((number: any) => {
      return number; */
    //});
    return dato;
  }
  swal(icon: any, mensaje: any) {
    Swal.fire({
      toast: true,
      icon: icon,
      title: mensaje,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
    });
  }


  multaCalculate(idfactura: number) {
    this.s_loading.showLoading();
    this.facService.calculateMultaAsync(idfactura).then(
      (resp) => {
        this.s_loading.hideLoading();
      },
      (error) => {
        console.error(error);
        this.s_loading.hideLoading();
      }
    );
  }
}
interface calcInteres {
  anio: number;
  mes: number;
  interes: number;
  valor: number;
}

interface datAbonado {
  idabonado: number;
  nombre: String;
  fechainstalacion: Date;
  nromedidor: String;
  categoria: String;
  marca: String;
  ruta: String;
  direccionubicacion: String;
  estado: number;
  textestado: String;
  municipio: boolean;
  promedio: string;
  adultomayor: boolean;
  responsablepago: string;
  geolocalizacion: string;
}

function getEstadoText(estado: number): string {
  switch (estado) {
    case 1:
      return 'Activo';
    case 0:
      return 'Eliminado';
    case 2:
      return 'Suspendido';
    case 3:
      return 'Suspendido y retirado';
    default:
      return '';
  }
}
