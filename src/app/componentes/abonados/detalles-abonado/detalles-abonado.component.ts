import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { Categoria } from 'src/app/modelos/categoria.model';
import { Lecturas } from 'src/app/modelos/lecturas.model';
import { AbonadosService } from 'src/app/servicios/abonados.service';
import { CategoriaService } from 'src/app/servicios/categoria.service';
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
import { StorageService } from 'src/app/servicios/storage.service';
import { OutboxAttachment, OutboxEmailService } from 'src/app/servicios/outbox-email.service';
import Swal from 'sweetalert2';
import { environment } from 'src/environments/environment';
import { firstValueFrom } from 'rxjs';
declare const $: any;

@Component({
  selector: 'app-detalles-abonado',
  templateUrl: './detalles-abonado.component.html',
  styleUrls: ['./detalles-abonado.component.css'],
})
export class DetallesAbonadoComponent implements OnInit, AfterViewInit, OnDestroy {
  abonado = {} as datAbonado; //Interface para los datos del Abonado

  n_factura: String;
  _abonado: any;
  _facturas: any; //Planillas del Abonado
  _lecturas: any; //Historial de consumo
  elimdisabled = true;
  _rubrosxfac: any;
  totfac: number;
  idfactura: number = 0;
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
  fotoAbonadoUrl: string | null = null;
  fotoCasaUrl: string | null = null;
  fotoMedidorUrl: string | null = null;
  fotoModalUrl: string | null = null;
  fotoModalTitulo: string = '';
  fotoModalError: boolean = false;
  fotoModalRutaOriginal: string | null = null;
  fotoModalMensaje: string = 'No hay fotos registradas para este abonado.';
  categoriasMap = new Map<number, string>();

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
    private categoriaService: CategoriaService,
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
    private outboxEmailService: OutboxEmailService,
    private storageService: StorageService
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
    this.cargarCategorias();
    this.listarIntereses();
    this.usuario = this.authService.idusuario;
  }
  ngAfterViewInit(): void { }
  ngOnDestroy(): void {
  }
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
        this.abonado.swbasura = this._abonado[0].swbasura;
        this.abonado.fotoPath =
          this._abonado[0].foto_path ?? this._abonado[0].fotoPath ?? null;
        this.fotoAbonadoUrl = this.getFotoUrl(this.abonado.fotoPath);
        this.cargarFotosAbonado(this._abonado[0]);
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
      const fotoUrl = this.fotoCasaUrl || this.getFotoUrl(abonado.fotoPath);
      this.mostrarMapa = true;
      setTimeout(() => {
        if (this.map) {
          this.map.remove();
          this.map = undefined;
        }
        this.map = L.map('map').setView(coordsArray, 19);
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; EPMAPA-T',
        }).addTo(this.map);
        const popupFoto = fotoUrl
          ? `<div style="margin-top:8px;"><img src="${fotoUrl}" alt="Foto del abonado" style="width:220px;max-width:100%;max-height:180px;object-fit:cover;border-radius:6px;" /></div>`
          : '<div style="margin-top:8px;color:#666;">Sin foto registrada</div>';
        L.marker(coordsArray)
          .addTo(this.map)
          .bindPopup(`<strong>${abonado.idabonado}</strong><br/>${abonado.direccionubicacion}${popupFoto}`)
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
    this._rubrosxfac = [];
    this.factura = new Facturas();
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

  irDetallesCliente() {
    const idcliente = this._abonado?.[0]?.idcliente_clientes?.idcliente;
    if (!idcliente) return;
    localStorage.setItem('idclienteToDetalles', idcliente.toString());
    sessionStorage.setItem('padreDetalleAbonado', '2');
    this.router.navigate(['detalles-cliente']);
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
      this.s_jasperreport.openPdfInViewer(file, 'pdfViewer');
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
      this.dataURI = fact;
      this.s_jasperreport.openPdfInViewer(file, 'pdfViewer');
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
    // ✅ Reemplaza con esto:
    if (this.swEmail == true) {
      // El email necesita base64, datauri está bien aquí
      this.dataURI = doc.output('datauri').toString();
    } else {
      // Iframe necesita blob URL, no datauri
      const blob = doc.output('blob');
      const url = URL.createObjectURL(blob);
      const pdfViewer = document.getElementById('pdfViewer') as HTMLIFrameElement;

      if (pdfViewer) {
        if (pdfViewer.src?.startsWith('blob:')) {
          URL.revokeObjectURL(pdfViewer.src);
        }
        pdfViewer.src = url;
      }
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
  async sendEmail(): Promise<void> {
    if (!this.swEmail) {
      return;
    }

    this.s_loading.showLoading();

    try {
      const formValue = this.f_sendEmail.getRawValue();
      const recipients = this.parseRecipients(formValue.receptores);

      if (!recipients.length) {
        this.swal('warning', 'Debe ingresar al menos un correo destinatario');
        this.s_loading.hideLoading();
        return;
      }

      const attachments = await this.buildNotificationAttachments();
      const mensajeHtml =
        `${formValue.mensaje || ''}${this.mensajeBody}` +
        ` <p style="margin: 10px 0 0; font-size: 12px; color: #888;">Este mensaje fué enviado por: ${this.authService.alias}.</p>`;

      this.outboxEmailService.sendNotificationEmail({
        to: recipients,
        subject: formValue.asunto || 'Sin asunto',
        html: mensajeHtml,
        text: this.stripHtml(mensajeHtml),
        correlationId: this.buildNotificationCorrelationId(),
        attachments,
      }).subscribe({
        next: () => {
          this.swal('success', 'Notificación enviada a la cola de correos');
          this.selectedFile = null;
          this.s_loading.hideLoading();
        },
        error: (e: any) => {
          console.error('Error al enviar notificación:', e);
          this.swal('danger', this.extractEmailError(e));
          this.s_loading.hideLoading();
        },
      });
    } catch (error) {
      console.error('Error preparando notificación:', error);
      this.swal('danger', 'No se pudo preparar la notificación para envío');
      this.s_loading.hideLoading();
    }
  }

  async sendFacturaEmail(): Promise<void> {
    this.nameFile = 'Factura.pdf';
    this.f_sendEmail.patchValue({
      asunto: 'Factura EPMAPA-T',
      receptores: this.email,
    });

    this.s_loading.showLoading();

    try {
      const recipients = this.parseRecipients(this.email);
      if (!recipients.length) {
        this.swal('warning', 'El abonado no tiene correo registrado');
        this.s_loading.hideLoading();
        return;
      }

      const attachment = await this.resolvePrimaryAttachment();
      if (!attachment) {
        this.swal('warning', 'Primero genere la factura electrónica para poder enviarla');
        this.s_loading.hideLoading();
        return;
      }
      const xmlAttachment = await this.resolveFacturaXmlAttachment();

      const asunto = `Factura EPMAPA-T ${this.detalleFactura?.nrofactura || this.factura?.nrofactura || this.idfactura}`;
      const html = this.buildFacturaEmailHtml();
      const attachments = xmlAttachment ? [attachment, xmlAttachment] : [attachment];

      this.outboxEmailService.sendDocumentEmail({
        to: recipients,
        subject: asunto,
        html,
        text: this.stripHtml(html),
        correlationId: this.buildFacturaCorrelationId(),
        attachments,
      }).subscribe({
        next: () => {
          this.swal('success', 'Factura enviada a la cola de correos');
          this.s_loading.hideLoading();
          this.active = false;
        },
        error: (e: any) => {
          console.error('Error al enviar factura:', e);
          this.swal('danger', this.extractEmailError(e));
          this.s_loading.hideLoading();
        },
      });
    } catch (error) {
      console.error('Error preparando factura:', error);
      this.swal('danger', 'No se pudo preparar la factura para envío');
      this.s_loading.hideLoading();
    }
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

  private getFotoUrl(fotoPath?: string | null): string | null {
    if (!fotoPath || typeof fotoPath !== 'string') return null;
    let normalizada = fotoPath.trim().replace(/\\/g, '/');
    if (!normalizada) return null;
    if (/^(https?:|data:|blob:)/i.test(normalizada)) return normalizada;

    const marcadoresPublicos = ['/nube-local/', '/abonados/lectura/', '/lecturas/'];
    for (const marcador of marcadoresPublicos) {
      const idx = normalizada.toLowerCase().indexOf(marcador.toLowerCase());
      if (idx >= 0) {
        normalizada = normalizada.substring(idx + (marcador === '/nube-local/' ? '/nube-local'.length : 0));
        break;
      }
    }

    const baseUrl = environment.API_URL.replace(/\/$/, '');
    const path = normalizada.replace(/^\/+/, '');
    return `${baseUrl}/${path}`;
  }

  abrirFoto(url: string | null, titulo: string): void {
    this.fotoModalUrl = url;
    this.fotoModalTitulo = titulo;
    this.fotoModalError = false;
    this.fotoModalRutaOriginal = null;
    this.fotoModalMensaje = 'No hay fotos registradas para este abonado.';
  }

  private abrirFotoConContexto(url: string | null, titulo: string, rutaOriginal?: string | null): void {
    this.abrirFoto(url, titulo);
    this.fotoModalRutaOriginal = rutaOriginal ?? null;

    if (!rutaOriginal) {
      this.fotoModalMensaje = 'No existe una ruta de imagen registrada para esta lectura.';
      return;
    }

    if (/^[a-zA-Z]:\//.test(rutaOriginal.replace(/\\/g, '/'))) {
      this.fotoModalMensaje =
        'La lectura tiene una ruta local del servidor, pero esa carpeta no esta publicada como URL accesible desde el navegador.';
      return;
    }

    this.fotoModalMensaje =
      'La imagen no pudo cargarse desde la URL publicada por el servidor.';
  }

  getLecturaNovedad(lectura: any): string {
    return lectura?.idnovedad_novedades?.descripcion || 'Sin novedad';
  }

  getLecturaCategoria(lectura: any): string {
    const idcategoria = Number(lectura?.idcategoria);
    if (!Number.isNaN(idcategoria) && this.categoriasMap.has(idcategoria)) {
      return this.categoriasMap.get(idcategoria) ?? 'Sin categoria';
    }
    return 'Sin categoria';
  }

  getLecturaFotoUrl(lectura: any): string | null {
    const ruta = lectura?.foto_path ?? lectura?.fotoPath ?? null;
    if (ruta) return this.storageService.viewUrl(ruta);
    const idlectura = Number(lectura?.idlectura);
    if (Number.isNaN(idlectura) || idlectura <= 0) return null;
    return this.lecService.getFotoLecturaUrl(idlectura);
  }

  getFechaLectura(lectura: any): string | Date | null {
    return lectura?.fechalectura ?? lectura?.fechaemision ?? null;
  }

  abrirDetalleLectura(lectura: any): void {
    this.getRubroxfac(lectura.idfactura);
    $('#DetalleFacturaModal').modal('show');
  }

  verFotoLectura(event: Event, lectura: any): void {
    event.preventDefault();
    event.stopPropagation();
    const cuenta = lectura?.idabonado_abonados?.idabonado ?? this.abonado.idabonado;
    const abrirModalConFoto = (data: any) => {
      const fotoUrl = this.getLecturaFotoUrl(data);
      const rutaOriginal =
        data?.foto_path ??
        data?.fotoPath ??
        data?.fotopath ??
        data?.pathfoto ??
        null;

      if (!fotoUrl) {
        this.abrirFotoConContexto(null, `Foto del medidor - Cuenta ${cuenta}`, rutaOriginal);
        $('#modalFotoAbonado').modal('show');
        return;
      }
      this.abrirFotoConContexto(fotoUrl, `Foto del medidor - Cuenta ${cuenta}`, rutaOriginal);
      $('#modalFotoAbonado').modal('show');
    };

    const fotoLista = this.getLecturaFotoUrl(lectura);
    if (fotoLista) {
      abrirModalConFoto(lectura);
      return;
    }

    this.lecService.getByIdlectura(lectura.idlectura).subscribe({
      next: (detalle) => abrirModalConFoto(detalle),
      error: (err) => {
        console.error('No se pudo obtener la foto de la lectura:', err);
        this.abrirFotoConContexto(null, `Foto del medidor - Cuenta ${cuenta}`, null);
        $('#modalFotoAbonado').modal('show');
      }
    });
  }

  onFotoModalError(): void {
    this.fotoModalError = true;
    if (this.fotoModalRutaOriginal && /^[a-zA-Z]:\//.test(this.fotoModalRutaOriginal.replace(/\\/g, '/'))) {
      this.fotoModalMensaje =
        'El sistema reconoce la ruta de almacenamiento, pero el navegador no puede abrir rutas locales del servidor. Esa carpeta debe exponerse como URL publica en el backend.';
      return;
    }

    this.fotoModalMensaje =
      'La imagen existe como referencia, pero el servidor no la esta publicando en una URL accesible o ya no permite acceso a esa ruta.';
  }

  private cargarFotosAbonado(abonado: any): void {
    const idabonado = Number(abonado?.idabonado);
    const fotoCasaRuta = abonado?.fotocasaPath ?? abonado?.fotocasa ?? null;
    const fotoMedidorRuta = abonado?.fotomedidorPath ?? abonado?.fotomedidor ?? null;

    this.fotoCasaUrl =
      fotoCasaRuta
        ? this.aboService.getFotoCasaUrl(idabonado)
        : idabonado > 0 && abonado?.fotocasa
        ? this.aboService.getFotoCasaUrl(idabonado)
        : null;

    this.fotoMedidorUrl =
      fotoMedidorRuta
        ? this.aboService.getFotoMedidorUrl(idabonado)
        : idabonado > 0 && abonado?.fotomedidor
        ? this.aboService.getFotoMedidorUrl(idabonado)
        : null;
  }

  private cargarCategorias(): void {
    this.categoriaService.getListCategoria().subscribe({
      next: (categorias: Categoria[]) => {
        this.categoriasMap = new Map(
          (categorias || []).map((categoria) => [
            Number(categoria.idcategoria),
            String(categoria.descripcion),
          ])
        );
      },
      error: (err) => console.error(err),
    });
  }

  private parseRecipients(value: string | null | undefined): string[] {
    return String(value || '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  private async buildNotificationAttachments(): Promise<OutboxAttachment[]> {
    const attachments: OutboxAttachment[] = [];
    const generated = await this.resolvePrimaryAttachment();
    if (generated) {
      attachments.push(generated);
    }
    if (this.selectedFile) {
      attachments.push(await this.fileToAttachment(this.selectedFile, this.selectedFile.name));
    }
    return attachments;
  }

  private async resolvePrimaryAttachment(): Promise<OutboxAttachment | null> {
    if (!this.dataURI) {
      return null;
    }

    if (this.dataURI instanceof Blob) {
      return this.fileToAttachment(this.dataURI, this.nameFile || 'adjunto.pdf');
    }

    const blob = this.dataURItoBlob(this.dataURI);
    return this.fileToAttachment(blob, this.nameFile || 'adjunto.pdf');
  }

  private async fileToAttachment(file: Blob, fileName: string): Promise<OutboxAttachment> {
    const base64 = await this.blobToBase64(file);
    return {
      name: fileName,
      contentType: file.type || 'application/octet-stream',
      base64,
    };
  }

  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = String(reader.result || '');
        const commaIndex = result.indexOf(',');
        resolve(commaIndex >= 0 ? result.substring(commaIndex + 1) : result);
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  }

  private stripHtml(value: string): string {
    return String(value || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  }

  private buildFacturaCorrelationId(): string {
    return `FACTURA-${this.idfactura}-${this.abonado.idabonado}`;
  }

  private buildNotificationCorrelationId(): string {
    return `NOTIFICACION-${this.abonado.idabonado}-${Date.now()}`;
  }

  private extractEmailError(error: any): string {
    if (typeof error?.error === 'string' && error.error.trim()) {
      return error.error.trim();
    }
    if (typeof error?.error?.message === 'string' && error.error.message.trim()) {
      return error.error.message.trim();
    }
    if (typeof error?.message === 'string' && error.message.trim()) {
      return error.message.trim();
    }
    return 'No fue posible enviar el correo';
  }

  private buildFacturaEmailHtml(): string {
    const cliente =
      this.detalleFactura?.idcliente?.nombre ||
      this.detalleFactura?.razonsocialcomprador ||
      this.abonado?.nombre ||
      'cliente';
    const nroFactura =
      this.detalleFactura?.nrofactura ||
      this.factura?.nrofactura ||
      this.idfactura ||
      '';
    const cuenta = this.abonado?.idabonado || '';
    const anio = new Date().getFullYear();

    return `<div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 8px; background: #f9f9f9;">
      <div style="text-align: center; margin-bottom: 20px; padding-bottom: 20px; border-bottom: 2px solid #0b5394;">
        <img src="https://epmapatulcan.gob.ec/wp/wp-content/uploads/2021/05/LOGO-HORIZONTAL.png" alt="EPMAPA-T" style="max-width: 200px;" />
      </div>

      <h2 style="color: #0b5394; text-align: center; margin-bottom: 10px;">Factura Electronica Autorizada</h2>
      <p style="text-align: center; color: #666; font-size: 14px; margin-bottom: 25px;">Comprobante electronico generado automaticamente</p>

      <div style="background: #e8f4ff; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
        <p style="margin: 0;">Estimado/a <strong>${cliente}</strong>,</p>
      </div>

      <p>Le informamos que su comprobante electronico ha sido <strong>autorizado</strong> por el Servicio de Rentas Internas (SRI) y se encuentra disponible para su descarga.</p>

      <div style="background: #ffffff; border: 1px solid #d8e4f0; border-radius: 5px; padding: 15px; margin: 20px 0;">
        <h4 style="color: #0b5394; margin: 0 0 10px 0;">Datos del comprobante</h4>
        <p style="margin: 6px 0;"><strong>Factura:</strong> ${nroFactura}</p>
        <p style="margin: 6px 0;"><strong>Cuenta:</strong> ${cuenta}</p>
        <p style="margin: 6px 0;"><strong>Cliente:</strong> ${cliente}</p>
      </div>

      <div style="background: #f0f8f0; border: 1px solid #4caf50; border-radius: 5px; padding: 12px; margin: 20px 0;">
        <p style="margin: 0; text-align: center;"><strong>Estado SRI:</strong> <span style="color: #2e7d32; font-weight: bold;">AUTORIZADO</span></p>
      </div>

      <div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 5px; padding: 15px; margin: 20px 0;">
        <h4 style="color: #856404; margin-top: 0;">Documentos adjuntos</h4>
        <p style="margin: 5px 0;">• <strong>Factura en formato PDF</strong> - Documento legible</p>
        <p style="margin: 5px 0;">• <strong>Archivo XML</strong> - Comprobante electronico oficial</p>
      </div>

      <hr style="border: none; border-top: 2px dashed #ccc; margin: 25px 0;">

      <h3 style="color: #0b5394; border-bottom: 1px solid #0b5394; padding-bottom: 8px;">Informacion de contacto</h3>
      <div style="line-height: 1.6;">
        <p><strong>EPMAPA-T</strong><br>
        Empresa Publica Municipal de Agua Potable y Alcantarillado de Tulcan</p>
        <p><strong>Direccion:</strong> Ca. Juan Ramon Arellano y Bolivar, Tulcan - Ecuador<br>
        <strong>Horario de atencion:</strong> Lunes a Viernes 07h30 - 16h30<br>
        <strong>Telefono:</strong> +(593) 06 298 0021<br>
        <strong>Portal web:</strong> <a href="https://epmapatulcan.gob.ec/wp/" target="_blank" style="color: #0b5394;">epmapatulcan.gob.ec</a></p>
      </div>

      <h4 style="color: #0b5394; margin-top: 25px;">Canales oficiales</h4>
      <div style="background: #f8f9fa; padding: 12px; border-radius: 5px;">
        <p style="margin: 5px 0;">Facebook: <a href="https://www.facebook.com/epmapat2023" target="_blank" style="color: #0b5394;">facebook.com/epmapat2023</a></p>
        <p style="margin: 5px 0;">Instagram: <a href="https://www.instagram.com/epmapat_/" target="_blank" style="color: #0b5394;">@epmapat_</a></p>
        <p style="margin: 5px 0;">WhatsApp: <a href="https://api.whatsapp.com/send?phone=593963967739" target="_blank" style="color: #0b5394;">+593 963967739</a></p>
      </div>

      <div style="background: #fff3f3; border: 1px solid #dc3545; border-radius: 5px; padding: 15px; margin: 25px 0;">
        <h4 style="color: #dc3545; margin-top: 0; text-align: center;">Importante</h4>
        <p style="margin: 10px 0; text-align: center; font-weight: bold;">Este es un mensaje automatico, por favor no responda a este correo.</p>
        <p style="margin: 10px 0; text-align: center; font-size: 14px;">Si necesita contactarnos, utilice los canales oficiales mencionados anteriormente.</p>
        <p style="margin: 10px 0; text-align: center; font-size: 14px;">Este correo fue enviado por: <strong>${this.authService.alias}</strong>.</p>
      </div>

      <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
        <p style="margin: 0; color: #666;">Gracias por confiar en nuestros servicios</p>
        <p style="margin: 10px 0 0 0; font-weight: bold; color: #0b5394;">Atentamente,<br>EPMAPA-T</p>
      </div>

      <div style="text-align: center; margin-top: 20px; padding-top: 15px; border-top: 1px solid #eee; font-size: 12px; color: #999;">
        <p style="margin: 0;">© ${anio} EPMAPA-T. Todos los derechos reservados.</p>
        <p style="margin: 5px 0 0 0;">Este correo electronico fue generado automaticamente.</p>
      </div>
    </div>`;
  }

  private async resolveFacturaXmlAttachment(): Promise<OutboxAttachment | null> {
    try {
      const response: any = await firstValueFrom(this._fecFacturaService.getByIdFactura(this.idfactura));
      const fecFactura =
        response?.xmlautorizado ? response :
        response?.value?.xmlautorizado ? response.value :
        response?.body?.xmlautorizado ? response.body :
        response?.body?.value?.xmlautorizado ? response.body.value :
        null;

      const xml = String(fecFactura?.xmlautorizado || '').trim();
      if (!xml) {
        return null;
      }

      const nroFactura =
        this.detalleFactura?.nrofactura ||
        this.factura?.nrofactura ||
        this.idfactura ||
        'factura';
      const blob = new Blob([xml], { type: 'application/xml' });
      return this.fileToAttachment(blob, `factura_${nroFactura}.xml`);
    } catch (error) {
      console.error('No se pudo obtener el XML autorizado de la factura:', error);
      return null;
    }
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
  swbasura: boolean;
  fotoPath?: string | null;
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
