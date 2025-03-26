import { Component, ContentChild, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import jsPDF from 'jspdf';
import autoTable, { Column } from 'jspdf-autotable';
import { Observable } from 'rxjs';
import { Facturas } from 'src/app/modelos/facturas.model';
import { Rubros } from 'src/app/modelos/rubros.model';
import { AbonadosService } from 'src/app/servicios/abonados.service';
import { FacturaService } from 'src/app/servicios/factura.service';
import { InteresesService } from 'src/app/servicios/intereses.service';
import { LecturasService } from 'src/app/servicios/lecturas.service';
import { LoadingService } from 'src/app/servicios/loading.service';
import { PdfService } from 'src/app/servicios/pdf.service';
import { RubroxfacService } from 'src/app/servicios/rubroxfac.service';
import { RutasService } from 'src/app/servicios/rutas.service';

@Component({
  selector: 'app-rutasmoras',
  templateUrl: './rutasmoras.component.html',
  styleUrls: ['./rutasmoras.component.css'],
})
export class RutasmorasComponent implements OnInit {
  _ruta: any;
  filterTerm: string;
  today: number = Date.now();
  titulo: string = 'Valores pendientes Abonados de la ruta ';
  abonados: any;
  _lecturas: any;
  _abonados: any = [];
  porcCarga: number = 0;
  _facSinCobro: any;
  datosImprimir: any = [];
  _abonado: any;

  /* Intereses */
  calInteres = {} as calcInteres;
  totInteres: number = 0;
  arrCalculoInteres: any = [];
  factura: Facturas = new Facturas();
  _intereses: any;
  $event: any;
  valoriva: number;
  _codigo: string;

  _rxf: any = [];
  rubrostotal: number = 0;
  datosCuentas: any;

  /* SORRTED METOD */
  currentSortColumn: any | null = null;
  isAscending: boolean = true;
  cuenta: any;
  modalSize: string = 'lg';
  constructor(
    private rutaDato: ActivatedRoute,
    private lecService: LecturasService,
    private rubxfacService: RubroxfacService,
    private fb: FormBuilder,
    private s_ruta: RutasService,
    private s_abonado: AbonadosService,
    private s_facturas: FacturaService,
    private s_pdf: PdfService,
    private s_rubxfacturas: RubroxfacService,
    private interService: InteresesService,
    private s_loading: LoadingService
  ) {}

  ngOnInit(): void {
    sessionStorage.setItem('ventana', '/mora-abonados');
    let coloresJSON = sessionStorage.getItem('/mora-abonados');
    if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));
    let idruta = this.rutaDato.snapshot.paramMap.get('idruta');
    this.getRuta(+idruta!);
    /*    this.getAbonadosByRuta(+idruta!);
        this.listarIntereses(); */
    this.getDatosCuenta(+idruta!);
  }
  colocaColor(colores: any) {
    document.documentElement.style.setProperty('--bgcolor1', colores[0]);
    const cabecera = document.querySelector('.cabecera');
    if (cabecera) cabecera.classList.add('nuevoBG1');
    document.documentElement.style.setProperty('--bgcolor2', colores[1]);
    const detalle = document.querySelector('.detalle');
    if (detalle) detalle.classList.add('nuevoBG2');
  }
  getRuta(idruta: number) {
    this.s_ruta.getByIdruta(idruta).subscribe({
      next: (rutaDatos: any) => {
        console.log(rutaDatos);
        this._ruta = rutaDatos;
        this.titulo += rutaDatos.descripcion;
      },
      error: (e) => console.error(e),
    });
  }
  getLecturas(idruta: number) {
    let newDatos: any[] = [];
    this.lecService.findDeudoresByRuta(idruta).subscribe({
      next: async (lecturas: any) => {
        this._lecturas = lecturas;
        await lecturas.forEach((item: any) => {
          let newPreFactura: any = [];
          this.rubxfacService
            .getByIdfacturaAsync(item.idfactura)
            .then((i: any) => {
              if (i.length > 0) {
                let doc = new jsPDF('p', 'pt', 'a4');
                //newPreFactura.idfactura = i.idfactura;
                //newDatos.push(newPreFactura);
                let findLectura = newPreFactura.find(
                  (lectura: { idlectura: number }) =>
                    lectura.idlectura === item.idlectura
                );
                if (findLectura === undefined) {
                  newPreFactura.push({ item, i });
                } else {
                  newPreFactura.push({ ...i });
                }
              }
            })
            .then(async () => {})
            .catch((e) => console.error(e));
        });
      },
      error: (e) => console.error(e),
    });
  }
  getAbonadosByRuta(idruta: any) {
    this.s_abonado.getByIdrutaAsync(idruta).then((abonados: any) => {
      this.s_loading.showLoading();
      this.porcCarga = 0;
      let i = 0;
      abonados.forEach((abonado: any, index: number) => {
        this.contSinCobrar(abonado.idabonado).then((number: any) => {
          abonado.numeroDeuda = number;
          this._abonados.push(abonado);
          i++;
          this.porcCarga = (i * 100) / abonados.length;
          if (this.porcCarga === 100) {
            this.s_loading.hideLoading();
          }
        });
      });
      this.contSinCobrar(abonados[0].idabonado);
    });
  }
  setDatosImprimir(cuenta: any) {
    //this.getSinCobrar(abonado.idabonado);
    this.s_facturas.getSinCobrarAboMod(cuenta).subscribe({
      next: async (facSincobro: any) => {
        let abonado: any = await this.s_abonado.getById(cuenta).toPromise();
        abonado.facturas = facSincobro;
        this.datosImprimir = abonado;
        this.impNotificacion();
      },
      error: (e) => {
        console.error(e);
      },
    });
  }

  async impNotificacion() {
    this.s_loading.showLoading();
    let doc = new jsPDF();
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
      this.datosImprimir.idabonado
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
      let suma = +factura.sumaFac! + +factura.interes!;
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
    this.s_pdf.setfooter(doc);
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

  async getFechaEmision(idfactura: number): Promise<any> {
    const fechaEmision = this.lecService
      .findDateByIdfactura(idfactura)
      .toPromise();
    return fechaEmision;
  }

  cInteres(factura: any) {
    let interes = this.interService
      .getInteresFactura(factura.idfactura)
      .toPromise();
    return interes;
  }

  async getSumaFac(idfactura: number): Promise<any> {
    const sumaFac = await this.rubxfacService.getSumaValoresUnitarios(
      idfactura
    );
    return sumaFac;
  }
  async contSinCobrar(idabonado: number) {
    let dato = await this.s_facturas.countSinCobrarAbo(idabonado);
    /* .then((number: any) => {
      console.log(number);
      return number; */
    //});
    return dato;
  }
  getDatosCuenta(idruta: number) {
    this.s_loading.showLoading();
    this.s_abonado.getDeudasCuentasByRuta(idruta).then((item: any) => {
      console.log(item);
      this.datosCuentas = item;
      this.s_loading.hideLoading();
    });
  }

  sortData(column: any) {
    if (this.currentSortColumn === column) {
      this.isAscending = !this.isAscending;
    } else {
      this.currentSortColumn = column;
      this.isAscending = true;
    }

    this.datosCuentas = this.datosCuentas.sort((a: any, b: any) => {
      if (a[column] < b[column]) {
        return this.isAscending ? -1 : 1;
      }
      if (a[column] > b[column]) {
        return this.isAscending ? 1 : -1;
      }
      return 0;
    });
  }
  impDatosRutaTable() {
    this.s_loading.showLoading();
    let doc = new jsPDF();
    this.s_pdf.header(this.titulo, doc);
    autoTable(doc, {
      html: '#datos-ruta',
    });
    this.s_pdf.setfooter(doc);
    const pdfDataUri = doc.output('datauri');
    const pdfViewer: any = document.getElementById(
      'pdf_Viewer'
    ) as HTMLIFrameElement;
    this.s_loading.hideLoading();
    return (pdfViewer.src = pdfDataUri);
  }
  detallesAbonado(cuenta: any) {
    console.log(cuenta);
    this.cuenta = cuenta;
  }
}
interface calcInteres {
  anio: number;
  mes: number;
  interes: number;
  valor: number;
}
