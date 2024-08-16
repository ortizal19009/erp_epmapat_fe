import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { NombreEmisionPipe } from 'src/app/pipes/nombre-emision.pipe';
import { ClientesService } from 'src/app/servicios/clientes.service';
import { EmisionIndividualService } from 'src/app/servicios/emision-individual.service';
import { EmisionService } from 'src/app/servicios/emision.service';
import { FacturaService } from 'src/app/servicios/factura.service';
import { LecturasService } from 'src/app/servicios/lecturas.service';
import { PdfService } from 'src/app/servicios/pdf.service';

@Component({
  selector: 'app-imp-emisiones',
  templateUrl: './imp-emisiones.component.html',
  styleUrls: ['./imp-emisiones.component.css'],
})
export class ImpEmisionesComponent implements OnInit {
  swimprimir: boolean = true;
  formImprimir: FormGroup;
  formBuscar: FormGroup;
  opcreporte: number = 0;
  otrapagina: boolean = false;
  swbotones: boolean = false;
  swcalculando: boolean = false;
  txtcalculando = 'Calculando';
  pdfgenerado: string;
  nombrearchivo: string;
  barraProgreso: boolean = false;
  public progreso = 0;
  _clientes: any = [];
  total: number;
  l_emisiones: any;
  _emisionindividual: any;
  /* Reporte lista emisiones */
  _emisiones: any;
  otraPagina: any;

  constructor(
    public fb: FormBuilder,
    private router: Router,
    private facService: FacturaService,
    private cliService: ClientesService,
    private emiService: EmisionService,
    private s_pdf: PdfService,
    private s_lecturas: LecturasService,
    private s_emisionindividual: EmisionIndividualService
  ) {}

  ngOnInit(): void {
    sessionStorage.setItem('ventana', '/emisiones');
    let coloresJSON = sessionStorage.getItem('/emisiones');
    if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));
    const fecha = new Date();
    const h_date = fecha.toISOString().slice(0, 10);
    this.formImprimir = this.fb.group({
      reporte: '0',
      emision: '',
      desdeNum: 1,
      hastaNum: 18000,
      nombrearchivo: ['', [Validators.required, Validators.minLength(3)]],
      otrapagina: '',
      d_emi: '',
      h_emi: '',
    });

    let h: String;
    this.emiService.ultimo().subscribe({
      next: (datos) => {
        h = datos.emision;
        let d = (+h.slice(0, 2)! - 1).toString() + h.slice(2);
        this.formImprimir.patchValue({
          d_emi: d,
          h_emi: h,
          emision: datos.idemision,
        });
      },
      error: (err) => console.error(err.error),
    });
    this.listAllEmisiones();
  }
  colocaColor(colores: any) {
    document.documentElement.style.setProperty('--bgcolor1', colores[0]);
    const cabecera = document.querySelector('.cabecera');
    if (cabecera) cabecera.classList.add('nuevoBG1');
    document.documentElement.style.setProperty('--bgcolor2', colores[1]);
    const detalle = document.querySelector('.detalle');
    if (detalle) detalle.classList.add('nuevoBG2');
  }
  imprimir() {
    switch (this.formImprimir.value.reporte) {
      case '0':
        this.buscarEmisiones();
        break;
      case '1':
        this.getByIdEmisiones(this.formImprimir.value.emision);
        break;
      case '2':
        this.getEmisionIndividualByIdEmision(this.formImprimir.value.emision);
        break;
      case '3':
        this.impEmisionInicial(this.formImprimir.value.emision);
        break;
      case '4':
        this.impEmisionFinal(this.formImprimir.value.emision);
        break;
    }
  }
  regresar() {
    this.router.navigate(['/emisiones']);
  }

  async impEmisionInicial(idemision: number) {
    let doc = new jsPDF();
    let inicial: any = await this.getRubLectInicial(idemision);
    let body: any = [];
    let head = [['Id', 'Descripción', 'Valor']];
    let suma: number = 0;
    let emision: any = await this.getEmision(idemision);

    inicial.forEach((item: any) => {
      body.push([item.idrubro_rubros, item.descripcion, item.total.toFixed(2)]);
      suma += item.total;
    });
    body.push(['', 'Total', suma.toFixed(2)]);
    this.s_pdf.bodyOneTable(`Emisión Inicial ${emision.emision}`,head, body, doc);
  }
  async impEmisionFinal(idemision: number) {
    let doc = new jsPDF();
    let inicial: any = await this.getRubLectInicial(idemision);
    let nuevos: any = await this.getRubLectNuevos(idemision);
    let eliminados: any = await this.getRubLectEliminados(idemision);
    let actuales: any = await this.getRubLectActual(idemision);
    let i_body: any = [];
    let n_body: any = [];
    let e_body: any = [];
    let a_body: any = [];
    let i_suma: number = 0;
    let n_suma: number = 0;
    let e_suma: number = 0;
    let a_suma: number = 0;
    let i_head: any = ['Emisión Inicial', ['Id', 'Descripción', 'Valor']];
    let n_head: any = ['Emisiones Nuevas', ['Id', 'Descripción', 'Valor']];
    let e_head: any = ['Emisiones Eliminadas', ['Id', 'Descripción', 'Valor']];
    let a_head: any = ['Emisión Acutal', ['Id', 'Descripción', 'Valor']];
    let emision: any = await this.getEmision(idemision);
    inicial.forEach((item: any) => {
      i_body.push([
        item.idrubro_rubros,
        item.descripcion,
        item.total.toFixed(2),
      ]);
      i_suma += item.total;
    });
    i_body.push(['', 'Total', i_suma.toFixed(2)]);
    nuevos.forEach((item: any) => {
      n_body.push([
        item.idrubro_rubros,
        item.descripcion,
        item.total.toFixed(2),
      ]);
      n_suma += item.total;
    });
    n_body.push(['', 'Total', n_suma.toFixed(2)]);
    eliminados.forEach((item: any) => {
      e_body.push([
        item.idrubro_rubros,
        item.descripcion,
        item.total.toFixed(2),
      ]);
      e_suma += item.total;
    });
    e_body.push(['', 'Total', e_suma.toFixed(2)]);
    actuales.forEach((item: any) => {
      a_body.push([
        item.idrubro_rubros,
        item.descripcion,
        item.total.toFixed(2),
      ]);
      a_suma += item.total;
    });
    a_body.push(['', 'Total', a_suma.toFixed(2)]);

    this.s_pdf.bodyFourTables(
      `Emisión final ${emision.emision}`,
      i_head,
      i_body,
      e_head,
      e_body,
      n_head,
      n_body,
      a_head,
      a_body,
      doc
    );
  }
  getByIdEmisiones(idemision: number) {
    this.s_lecturas.findByIdEmisiones(idemision).subscribe({
      next: (lecturas: any) => {
        let doc = new jsPDF();
        let body: any[] = [];
        let head: any = [
          ['Lectura', 'Emisión', 'Cuenta', 'Responsable P.', 'Ruta'],
        ];
        lecturas.forEach((lectura: any) => {
          body.push([
            lectura.idlectura,
            lectura.idrutaxemision_rutasxemision.idemision_emisiones.emision,
            lectura.idabonado_abonados.idabonado,
            lectura.idabonado_abonados.idresponsable.nombre,
            lectura.idrutaxemision_rutasxemision.idruta_rutas.descripcion,
          ]);
        });
        this.s_pdf.bodyOneTable(
          `Facturas eliminadas - Emisión: ${lecturas[0].idrutaxemision_rutasxemision.idemision_emisiones.emision}`,
          head,
          body,
          doc
        );
      },
      error: (e) => console.error(e),
    });
  }
  listAllEmisiones() {
    this.emiService.findAllEmisiones().subscribe({
      next: (emisiones: any) => {
        this.l_emisiones = emisiones;
      },
      error: (e) => console.error(e),
    });
  }
  async getEmisionIndividualByIdEmision(idemision: number) {
    let doc = new jsPDF();
    let emision: any = await this.getEmision(idemision);

    let anteriores: any = await this.getEmisionesAnteriores(idemision);
    let nuevas: any = await this.getEmisionesNuevas(idemision);
    let headAnteriores: any = [['Cuenta', 'Emision', 'Planilla', 'Total']];
    let headNuevas: any = [['Cuenta', 'Emision', 'Planilla', 'Total']];
    let bodyAnteriores: any = [];
    let bodyNuevas: any = [];
    let sumant: number = 0;
    let sumnev: number = 0;
    anteriores.forEach((iAnteriores: any) => {
      sumant += +iAnteriores.tanterior.toFixed(2);
      bodyAnteriores.push([
        iAnteriores.cuenta,
        iAnteriores.emisiona,
        iAnteriores.facturaa,
        iAnteriores.tanterior.toFixed(2),
      ]);
    });
    bodyAnteriores.push(['', 'TOTAL', '', sumant.toFixed(2)]);
    nuevas.forEach((iNuevas: any) => {
      sumnev += +iNuevas.tnuevo.toFixed(2);
      bodyNuevas.push([
        iNuevas.cuenta,
        iNuevas.emisionn,
        iNuevas.facturan,
        iNuevas.tnuevo.toFixed(2),
      ]);
    });
    bodyNuevas.push(['', 'TOTAL', '', sumnev.toFixed(2)]);
    this.s_pdf.bodyTwoTables(
      `REPORTE EMISIONES NUEVAS ${emision.emision}`,
      headAnteriores,
      bodyAnteriores,
      headNuevas,
      bodyNuevas,
      doc
    );
  }
  async getEmisionesAnteriores(idemision: number) {
    let anteriores = this.s_emisionindividual
      .reportEILecturasAnteriores(idemision)
      .toPromise();
    return anteriores;
  }
  async getEmisionesNuevas(idemision: number) {
    let nuevas = this.s_emisionindividual
      .reportEILecturasNuevas(idemision)
      .toPromise();
    return nuevas;
  }
  async getRubLectInicial(idemision: number) {
    let inicial = this.s_lecturas.findInicial(idemision).toPromise();
    return inicial;
  }
  async getRubLectEliminados(idemision: number) {
    let eliminados = this.s_lecturas.findEliminados(idemision).toPromise();
    return eliminados;
  }
  async getRubLectNuevos(idemision: number) {
    let nuevos = this.s_lecturas.findNuevos(idemision).toPromise();
    return nuevos;
  }
  async getRubLectActual(idemision: number) {
    let actual = this.s_lecturas.findActual(idemision).toPromise();
    return actual;
  }
  changeReporte() {
    this.opcreporte = +this.formImprimir.value.reporte!;
  }
  hideListaEmision() {
    if (
      this.opcreporte === 1 ||
      this.opcreporte === 2 ||
      this.opcreporte === 3 ||
      this.opcreporte === 4
    ) {
      return false;
    }
    return true;
  }
  impriexpor() {}
  buscarEmisiones() {
    this.emiService
      .getDesdeHasta(
        this.formImprimir.value.d_emi,
        this.formImprimir.value.h_emi
      )
      .subscribe({
        next: (datos) => {
          this._emisiones = datos;
          this.impListaEmisiones();
        },
        error: (err) => console.error(err.error),
      });
  }
  impListaEmisiones() {
    let doc = new jsPDF();
    const nombreEmision = new NombreEmisionPipe(); // Crea una instancia del pipe
    let head = [['Emision', 'm3', 'Fecha Cierre']];
    var datos: any = [];
    var i = 0;
    this._emisiones.forEach((item: any) => {
      if (item.estado === 1) {
        datos.push([
          nombreEmision.transform(this._emisiones[i].emision),
          this._emisiones[i].m3,
          this._emisiones[i].fechacierre,
        ]);
      }
      i++;
    });
    // datos.push(['', 'TOTAL', '', '', '', this.sumtotal.toLocaleString('en-US')]);
    this.s_pdf.bodyOneTable('Listado de emisiones', head, datos, doc);
  }
  async getEmision(idemision: number) {
    const emision = await this.emiService.getByIdemision(idemision).toPromise();
    return emision;
  }
}
