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
  titulo: string = 'Abonados en mora ';
  abonados: any;
  _lecturas: any;
  _abonados: any = [];
  porcCarga: number = 0;
  _facSinCobro: any;
  datosImprimir: any = [];

  /* Intereses */
  calInteres = {} as calcInteres;
  totInteres: number = 0;
  arrCalculoInteres: any = [];
  factura: Facturas = new Facturas();
  _intereses: any;
  $event: any;
  valoriva: number;
  _codigo: string;

  constructor(
    private rutaDato: ActivatedRoute,
    private s_lecturas: LecturasService,
    private s_rubroxfac: RubroxfacService,
    private fb: FormBuilder,
    private s_ruta: RutasService,
    private s_abonado: AbonadosService,
    private s_facturas: FacturaService,
    private s_pdf: PdfService,
    private s_rubxfacturas: RubroxfacService,
    private interService: InteresesService
  ) {}

  ngOnInit(): void {
    sessionStorage.setItem('ventana', '/mora-abonados');
    let coloresJSON = sessionStorage.getItem('/mora-abonados');
    if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));
    let idruta = this.rutaDato.snapshot.paramMap.get('idruta');
    this.getRuta(+idruta!);
    this.getAbonadosByRuta(+idruta!);
    this.listarIntereses();
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
    this.s_lecturas.findDeudoresByRuta(idruta).subscribe({
      next: async (lecturas: any) => {
        this._lecturas = lecturas;
        await lecturas.forEach((item: any) => {
          let newPreFactura: any = [];
          this.s_rubroxfac
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
            .then(async () => {
              console.log('HOLA MUNDO SEGUNDO BLOQUE');
            })
            .catch((e) => console.error(e));
        });
      },
      error: (e) => console.error(e),
    });
  }
  getAbonadosByRuta(idruta: any) {
    this.s_abonado.getByIdrutaAsync(idruta).then((abonados: any) => {
      this.porcCarga = 0;
      let i = 0;
      abonados.forEach((abonado: any, index: number) => {
        this.contSinCobrar(abonado.idabonado).then((number: any) => {
          abonado.numeroDeuda = number;
          this._abonados.push(abonado);
          i++;
          this.porcCarga = (i * 100) / abonados.length;
        });
      });
      this.contSinCobrar(abonados[0].idabonado);
    });
  }
  getSinCobrar(idabonado: number) {}
  setDatosImprimir(abonado: any) {
    //this.getSinCobrar(abonado.idabonado);
    this.s_facturas.getSinCobrarAboMod(abonado.idabonado).subscribe({
      next: (facSincobro: any) => {
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
    let doc = new jsPDF('p', 'pt', 'a4');
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
    facturas.forEach(async (factura: any) => {
      factura.interes = this.cInteres(factura);
      const sumaFacPromise = this.getSumaFac(factura.idfactura);
      sumaFacPromises.push(sumaFacPromise);
    });
    let d_facturas = [];
    // Wait for all `getSumaFac()` promises to resolve
    const sumaFacResults = await Promise.all(sumaFacPromises);

    // Iterate through facturas and add sumaFac values
    for (let i = 0; i < facturas.length; i++) {
      const factura = facturas[i];
      const sumaFac = sumaFacResults[i];
      facturas[i].sumaFac = sumaFac;
      let suma = +factura.sumaFac.toFixed(2)! + +factura.interes.toFixed(2)!;
      d_facturas.push([
        factura.idfactura,
        factura.idmodulo.descripcion,
        factura.sumaFac.toFixed(2),
        factura.interes.toFixed(2),
        suma.toFixed(2),
      ]);
    }
    autoTable(doc, {
      headStyles: { halign: 'center' },
      head: [['Planilla', 'Módulo', 'Sub total', 'Interés', 'Total']],
      columnStyles: {
        2: { halign: 'center' },
        3: { halign: 'center' },
        4: { halign: 'center' },
      },
      body: d_facturas,
    });
    // Generate data URI and set iframe source
    const pdfDataUri = doc.output('datauri');
    const pdfViewer: any = document.getElementById(
      'pdfViewer'
    ) as HTMLIFrameElement;
    pdfViewer.src = pdfDataUri;
    // Generate and output the PDF after all data is processed
    //doc.output('pdfobjectnewwindow');
  }
  listarIntereses() {
    this.interService.getListaIntereses().subscribe({
      next: (datos) => {
        console.log(datos);
        this._intereses = datos;
      },
      error: (err) => console.error(err.error),
    });
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
    const sumaFac = await this.s_rubroxfac
      .getSumaValoresUnitarios(idfactura)
      .toPromise();
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
}
interface calcInteres {
  anio: number;
  mes: number;
  interes: number;
  valor: number;
}
