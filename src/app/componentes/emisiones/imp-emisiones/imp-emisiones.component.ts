import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { NombreEmisionPipe } from 'src/app/pipes/nombre-emision.pipe';
import { ClientesService } from 'src/app/servicios/clientes.service';
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
    private s_lecturas: LecturasService
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
        break;
      case '3':
        break;
    }
  }
  imprime() {}
  regresar() {
    this.router.navigate(['/emisiones']);
  }
  getByIdEmisiones(idemision: number) {
    this.s_lecturas.findByIdEmisiones(idemision).subscribe({
      next: (lecturas: any) => {
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
        this.pdfTemplate(
          `Facturas eliminadas - Emisión: ${lecturas[0].idrutaxemision_rutasxemision.idemision_emisiones.emision}`,
          head,
          body
        );
      },
      error: (e) => console.error(e),
    });
  }
  pdfTemplate(title: string, head: any, body: any) {
    console.log('REGRESANDO');
    let m_izquierda: 10;
    let doc = new jsPDF('p', 'pt', 'a4');
    this.s_pdf.header(title, doc);

    autoTable(doc, {
      head: head,
      body: body,
    });

    const addPageNumbers = function () {
      const pageCount = doc.internal.pages.length;
      for (let i = 1; i <= pageCount - 1; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        doc.text(
          'Página ' + i + ' de ' + (pageCount - 1),
          m_izquierda,
          doc.internal.pageSize.height - 10
        );
      }
    };

    const pdfDataUri = doc.output('datauri');
    const pdfViewer: any = document.getElementById(
      'pdfViewer'
    ) as HTMLIFrameElement;

    pdfViewer.src = pdfDataUri;
  }
  listAllEmisiones() {
    this.emiService.findAllEmisiones().subscribe({
      next: (emisiones: any) => {
        this.l_emisiones = emisiones;
      },
      error: (e) => console.error(e),
    });
  }
  changeReporte() {
    console.log(this.formImprimir.value);
    this.opcreporte = +this.formImprimir.value.reporte!;
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
    this.pdfTemplate('Listado de emisiones', head, datos);
  }
}
