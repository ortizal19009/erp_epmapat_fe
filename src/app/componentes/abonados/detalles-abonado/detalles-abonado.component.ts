import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Lecturas } from 'src/app/modelos/lecturas.model';
import { AbonadosService } from 'src/app/servicios/abonados.service';
import { FacturaService } from 'src/app/servicios/factura.service';
import { LecturasService } from 'src/app/servicios/lecturas.service';
import { RubroxfacService } from 'src/app/servicios/rubroxfac.service';
import { Chart, registerables } from 'chart.js';
import { FecfacturaComponent } from '../../facelectro/fecfactura/fecfactura.component';
import { FecfacturaService } from 'src/app/servicios/fecfactura.service';
import { InteresesService } from 'src/app/servicios/intereses.service';
import { Facturas } from 'src/app/modelos/facturas.model';
import { RecaudacionReportsService } from '../../recaudacion/recaudacion-reports.service';
import { ConvenioService } from 'src/app/servicios/convenio.service';
import autoTable from 'jspdf-autotable';
import jsPDF from 'jspdf';
import { PdfService } from 'src/app/servicios/pdf.service';
import { Console } from 'console';
import { LoadingService } from 'src/app/servicios/loading.service';
import { Condmultaintereses } from 'src/app/modelos/condmultasintereses';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { CondmultasinteresesService } from 'src/app/servicios/condmultasintereses.service';

@Component({
  selector: 'app-detalles-abonado',
  templateUrl: './detalles-abonado.component.html',
  styleUrls: ['./detalles-abonado.component.css'],
})
export class DetallesAbonadoComponent implements OnInit {
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

  rango: number = 15;
  estadoFE: string;
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
    private s_condonar: CondmultasinteresesService
  ) {}

  ngOnInit(): void {
    this.obtenerDatosAbonado();
    this.listarIntereses();
  }

  getFactura() {
    this.facturasxAbonado(this.abonado.idabonado);
  }
  obtenerDatosAbonado() {
    let idabonado = sessionStorage.getItem('idabonadoToFactura');
    this.aboService.getByIdabonado(+idabonado!).subscribe({
      next: (datos) => {
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
      },
      error: (err) => console.error(err.error),
    });

    this.facturasxAbonado(+idabonado!);
  }

  facturasxAbonado(idabonado: number) {
    this.facService.getByIdabonadorango(idabonado, this.rango).subscribe({
      next: (datos: any) => {
        datos.forEach((item: any) => {
          //console.log(item);
          //console.log(this.s_interes.cInteres(item));
          if (item.pagado === 0) {
            item.interescobrado = this.cInteres(item);
          }
          if (item.pagado === 1 && item.interescobrado === null) {
            item.interescobrado = 0;
          }
        });
        this._facturas = datos;
      },
      error: (err) => console.error(err.error),
    });
  }
  valorPagado(idmodulo: number, valor: number) {
    if (idmodulo === 3 && valor > 0) {
      return valor + 1;
    } else {
      return valor;
    }
  }
  lecturasxAbonado(idabonado: number) {
    this.lecService.getLecturasxIdabonado(idabonado).subscribe({
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

  getRubroxfac(idfactura: number) {
    this.idfactura = idfactura;
    this.rubxfacService.getByIdfactura(+idfactura!).subscribe({
      next: (detalle: any) => {
        this._rubrosxfac = detalle;
        this.factura = detalle[0].idfactura_facturas;
        if (detalle[0].idfactura_facturas.pagado === 1) {
          this._fecFacturaService.getByIdFactura(+idfactura!).subscribe({
            next: (fecfactura: any) => {
              if (fecfactura != null) {
                this.estadoFE = fecfactura.estado;
              } else {
                this.estadoFE = 'P';
              }
            },
            error: (e) => console.error(e),
          });
        }
        this.subtotal();
      },
      error: (err) => console.error(err.error),
    });
  }

  detallesHistorial(lectura: Lecturas) {}

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
      },
      error: (e: any) => console.error(e),
    });
  }

  cerrarGrafico() {
    this.grafic = false;
  }
  impComprobante(datos: any) {
    let lectura: any;
    this.facService.getById(datos.idfactura).subscribe({
      next: (d_factura: any) => {
        let modulo: number = d_factura.idmodulo.idmodulo;
        if (modulo === 3 || modulo === 4) {
          this.lecService.getOnefactura(d_factura.idfactura).subscribe({
            next: (datos: any) => {
              lectura = datos;
              if (datos != null) {
                this.s_pdfRecaudacion.comprobantePago(lectura, d_factura);
              } else {
                this.s_pdfRecaudacion.comprobantePago(null, d_factura);
              }
            },
            error: (e) => console.error(e),
          });
        } else {
          this.s_pdfRecaudacion.comprobantePago(null, d_factura);
        }
      },
      error: (e) => console.error(e),
    });
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
    this.facService.getSinCobrarAboMod(this._abonado[0].idabonado).subscribe({
      next: (facturas: any) => {
        this._abonado[0].facturas = facturas;
        this.datosImprimir = this._abonado[0];
        this.impNotificacion();
      },
      error: (e) => console.error(e.error),
    });
  }
  calcularDeudasAC() {
    this.c_rubros = [];
    this.multa = [];
    this.sumInteres = 0;
    this.totalMultas = 0;
    this.totalRubros = 0;
    this.modalSize = 'lg';
    this.facService.getSinCobrarAboMod(this._abonado[0].idabonado).subscribe({
      next: async (facturas: any) => {
        this._sincobro = facturas;
        facturas.forEach((item: any) => {
          let interes = this.cInteres(item);
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
    let n_factura: Facturas = new Facturas();
    //this.modalSize = 'sm';
    this._sincobro.forEach(async (item: Facturas) => {
      n_factura = item;
      n_factura.swcondonar = true;

      let multa: number = 0;
      let _multa = await this.rubxfacService.getMultaByIdFactura(
        item.idfactura
      );
      if (_multa.length > 0) {
        console.log(_multa);
        multa = _multa[0].cantidad * _multa[0].valorunitario;
      }

      this.condonar.idfactura_facturas = item;
      this.condonar.totalinteres = this.cInteres(item);
      this.condonar.totalmultas = multa;
      this.condonar.feccrea = this.date;
      this.condonar.usucrea = this.authService.idusuario;
      this.condonar.razoncondonacion = this.razonCondonacion;
      console.log(this.condonar);
      console.log(n_factura);
      await this.facService.updateFacturaAsync(n_factura);
      this.s_condonar.saveCondonacion(this.condonar).subscribe({
        next: (datos: any) => {
          console.log(datos);
        },
        error: (e) => console.error(e),
      });
    });
  }
  async impNotificacion() {
    this.s_loading.showLoading();
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
      factura.interes = this.cInteres(factura);
      const sumaFacPromise = this.getSumaFac(factura.idfactura);
      sumaFacPromises.push(sumaFacPromise);
    });
    let d_facturas = [];
    // Wait for all `getSumaFac()` promises to resolve
    const sumaFacResults = await Promise.all(sumaFacPromises);
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
      const sumaFac = sumaFacResults[i];
      facturas[i].sumaFac = sumaFac;
      let fecEmision = await this.getFechaEmision(facturas[i].idfactura);
      let suma = +factura.sumaFac.toFixed(2)! + +factura.interes.toFixed(2)!;
      d_facturas.push([
        factura.idfactura,
        //fecEmision.slice(0, 7),
        fecEmision,
        factura.idmodulo.descripcion,
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
    d_rxf.push(['', 'Total: ', this.rubrostotal.toFixed(2)]);
    autoTable(doc, {
      head: [['Cod.Rubro', 'Descripción', 'Valor']],
      body: d_rxf,
    });

    // Generate data URI and set iframe source
    const pdfDataUri = doc.output('datauri');
    const pdfViewer: any = document.getElementById(
      'pdfViewer'
    ) as HTMLIFrameElement;
    pdfViewer.src = pdfDataUri;
    this.s_loading.hideLoading();
    // Generate and output the PDF after all data is processed
    //doc.output('pdfobjectnewwindow');
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

  /* Este metodo calcula el interes individual y la uso en el metodo de listar las facturas sin cobro */
  cInteres(factura: any) {
    this.totInteres = 0;
    this.arrCalculoInteres = [];
    let interes: number = 0;
    if (factura.estado != 3 && factura.formapago != 4) {
      let fec = factura.feccrea.toString().split('-', 2);
      let fechai: Date = new Date(`${fec[0]}-${fec[1]}-02`);
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
    return interes;
  }
  async getSumaFac(idfactura: number): Promise<any> {
    const sumaFac = await this.rubxfacService
      .getSumaValoresUnitarios(idfactura)
      .toPromise();
    return sumaFac;
  }
  async contSinCobrar(idabonado: number) {
    let dato = await this.facService.countSinCobrarAbo(idabonado);
    /* .then((number: any) => {
      console.log(number);
      return number; */
    //});
    return dato;
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
