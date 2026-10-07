import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { firstValueFrom } from 'rxjs';
import { saveAs } from 'file-saver';
import Swal from 'sweetalert2';
import { PreemisionReporte } from 'src/app/interfaces/emisiones/preemision-reporte';
import * as ExcelJS from 'exceljs';
import { NombreEmisionPipe } from 'src/app/pipes/nombre-emision.pipe';
import { EmisionIndividualService } from 'src/app/servicios/emision-individual.service';
import { EmisionService } from 'src/app/servicios/emision.service';
import { LecturasService } from 'src/app/servicios/lecturas.service';
import { PdfService } from 'src/app/servicios/pdf.service';
import { LoadingService } from 'src/app/servicios/loading.service';
import { RubroxfacService } from 'src/app/servicios/rubroxfac.service';
import { JasperReportService } from 'src/app/servicios/jasper-report.service';
import { AutorizaService } from 'src/app/compartida/autoriza.service';

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
  l_emisiones: any[] = [];
  l_emisionesFiltradas: any[] = [];
  filtroEmision = '';
  _emisionindividual: any;
  /* Reporte lista emisiones */
  _emisiones: any;
  otraPagina: any;
  tipe: string = 'text';
  date: Date = new Date();
  pdfview: any;
  usuario: any;

    rolepermission = 1; // 1=lector, 2=editor, 3=admin (ajusta a tu convención)
  ventana = 'emisiones';
  constructor(
    public fb: FormBuilder,
    private router: Router,
    private emiService: EmisionService,
    private s_pdf: PdfService,
    private s_lecturas: LecturasService,
    private s_emisionindividual: EmisionIndividualService,
    private s_loading: LoadingService,
    private s_rubroxfac: RubroxfacService,
    private s_jasperReport: JasperReportService,
    public authService: AutorizaService
  ) { }

  ngOnInit(): void {
    this.usuario = this.authService.idusuario;
    sessionStorage.setItem('ventana', '/emisiones');
    let coloresJSON = sessionStorage.getItem('/emisiones');
    if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));
    const fecha = new Date();
    const h_date = fecha.toISOString().slice(0, 10);
    this.formImprimir = this.fb.group({
      reporte: 0,
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
      error: (err) => { void this.mostrarErrorReporte(err); },
    });
    //this.getReporte();
    this.listAllEmisiones();
  }

  private async mostrarErrorReporte(error: any): Promise<void> {
    this.s_loading.hideLoading();
    let detail = error?.error;
    if (detail instanceof Blob) {
      try { detail = JSON.parse(await detail.text()); } catch { detail = null; }
    }
    const message = error?.status === 401 ? 'La sesi\u00f3n expir\u00f3. Inicie sesi\u00f3n nuevamente.'
      : error?.status === 403 ? 'No tiene permiso para consultar este reporte de emisiones.'
      : detail?.message || error?.message || 'No se pudo cargar la informaci\u00f3n del reporte.';
    await Swal.fire({ icon: 'error', title: 'Reporte no disponible', text: message });
  }

  async getReporte(idemision: number) {
    let datos: any;
    datos = {
      reportName: 'ResumenEmision',
      parameters: {
        idemision: idemision,
      },
      extencion: '.pdf',
    };
    let reporte = await this.s_jasperReport.getReporte(datos);
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
    }, 500);

    this.s_loading.hideLoading();
  }
  setUltimos() {
    let h: String;
    this.emiService.ultimo().subscribe({
      next: (datos) => {
        console.log(datos)
        h = datos.emision;
        let d = (+h.slice(0, 2)! - 1).toString() + h.slice(2);
        this.formImprimir.patchValue({
          d_emi: d,
          h_emi: h,
          emision: datos.idemision,
        });
      },
      error: (err) => { void this.mostrarErrorReporte(err); },
    });
  }
  colocaColor(colores: any) {
    document.documentElement.style.setProperty('--bgcolor1', colores[0]);
    const cabecera = document.querySelector('.cabecera');
    if (cabecera) cabecera.classList.add('nuevoBG1');
    document.documentElement.style.setProperty('--bgcolor2', colores[1]);
    const detalle = document.querySelector('.detalle');
    if (detalle) detalle.classList.add('nuevoBG2');
  }
  async imprimir() {
    try {
      document.getElementById('pdfViewer')?.removeAttribute('src');
      if (String(this.formImprimir.value.reporte) === '14') {
        await this.generarPreemision(false);
        return;
      }
      this.s_loading.showLoading();
      let body: any;
      let reporte: any;
      switch (String(this.formImprimir.value.reporte)) {
        case '0':
          await this.buscarEmisiones();
          break;
        case '1':
          await this.getByIdEmisiones(this.formImprimir.value.emision);
          break;
        case '2':
          await this.getEmisionIndividualByIdEmision(this.formImprimir.value.emision);
          break;
        case '3':
          await this.impEmisionInicial(this.formImprimir.value.emision);
          break;
        case '4':
          await this.impEmisionFinal(this.formImprimir.value.emision);
          break;
        case '5':
          await this.impValoresEmisiones(this.formImprimir.value.emision);
          break;
        case '6':
          await this.impConsumoXCategoria(this.formImprimir.value.emision);
          break;
        case '7':
          await this.impRefacturacionxEmision(this.formImprimir.value.emision);
          break;
        case '8':
          await this.impRefacturacionxFecha(
            this.formImprimir.value.d_emi,
            this.formImprimir.value.h_emi
          );
          break;
        case '9':
          await this.impRefEmisionRubros(this.formImprimir.value.emision);
          break;
        case '10':
          await this.impRefFechaRubros(
            this.formImprimir.value.d_emi,
            this.formImprimir.value.h_emi
          );
          break;
        case '11':
          await this.getReporte(this.formImprimir.value.emision);
          break;
        case '12':
          body = {
            "reportName": "Refacturaciones",
            "parameters": {
              "desde": this.formImprimir.value.d_emi,
              "hasta": this.formImprimir.value.h_emi,
              "idusuario": this.authService.idusuario
            },
            "extencion": ".pdf"
          }

          reporte = await this.s_jasperReport.getReporte(body);
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
          break;
        case '13':
          body = {
            "reportName": "RefacturacionesRubros",
            "parameters": {
              "idemision": this.formImprimir.value.emision,
              "idusuario": this.authService.idusuario
            },
            "extencion": ".pdf"
          }

          reporte = await this.s_jasperReport.getReporte(body);
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
          break;
      }
    } catch (error) {
      await this.mostrarErrorReporte(error);
    }
  }
  async exportar() {
    try {
      if (String(this.formImprimir.value.reporte) === '14') {
        void this.generarPreemision(true);
        return;
      }
      switch (String(this.formImprimir.value.reporte)) {
        /*       case '0':
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
          break; */
        case '5':
          await this.exportarValoresEmitidos(this.formImprimir.value.emision);
      }
    } catch (error) {
      await this.mostrarErrorReporte(error);
    }
  }
  regresar() {
    this.router.navigate(['/emisiones']);
  }

  async impEmisionInicial(idemision: number) {
    let doc = new jsPDF();
    let inicial: any = await this.getRubLectInicial(idemision);
    let cm3inicial: any = await this.getCM3Inicial(idemision);
    let count: any = await this.getZeroByEmisiones(idemision);
    let body: any = [];
    let body2: any = [];
    let body3: any = [];
    let head = [
      ['Valores emitidos por rubros'],
      ['N°', 'Id', 'Descripción', 'Abonados', 'Valor'],
    ];
    let head2 = [['Detalles'], ['N°', 'Nro. Cuentas', 'M3']];
    let head3 = [
      ['Cuentas sin rubros'],
      ['N°', 'Cuenta', 'Planilla', 'Lec.Anterior', 'Lec.Actual', 'm3', 'Nro. Rubros'],
    ];
    let suma: number = 0;
    let emision: any = await this.getEmision(idemision);

    inicial.forEach((item: any) => {
      body.push([
        item.idrubro_rubros,
        item.descripcion,
        item.abonados,
        item.total.toFixed(2),
      ]);
      suma += item.total;
    });
    body = this.agregarTotalRegistros(this.agregarNumeracion(body), body.length);
    body.push(['', '', '', 'Total', suma.toFixed(2)]);
    cm3inicial.forEach((item: any) => {
      body2.push([item.abonados, item.m3]);
    });
    body2 = this.agregarTotalRegistros(this.agregarNumeracion(body2), body2.length);
    if (count.length > 0) {
      count.forEach((item: any) => {
        body3.push([
          item.idabonado_abonados,
          item.idfactura,
          item.lecturaanterior,
          item.lecturaactual,
          item.lecturaactual - item.lecturaanterior,
          item.rubros_count,
        ]);
      });
    }
    body3 = this.agregarTotalRegistros(this.agregarNumeracion(body3), body3.length);

    /*    this.s_pdf.bodyOneTable(
      `Emisión Inicial ${emision.emision}`,
      head,
      body,
      doc
    ); */
    this.s_pdf.bodyThreeTables(
      `Emisión Inicial ${emision.emision}`,
      head,
      body,
      head2,
      body2,
      head3,
      body3,
      doc
    );
    this.s_loading.hideLoading();
  }
  async impEmisionFinal(idemision: number) {
    let doc = new jsPDF();
    let inicial: any = await this.getRubLectInicial(idemision);
    let nuevos: any = await this.getRubLectNuevos(idemision);
    let eliminados: any = await this.getRubLectEliminados(idemision);
    let actuales: any = await this.getRubLectActual(idemision);
    let cm3inicial: any = await this.getCM3Inicial(idemision);
    let head2 = [['Detalles'], ['N°', 'Nro. Cuentas', 'M3']];
    let body2: any = [];
    cm3inicial.forEach((item: any) => {
      body2.push([item.abonados, item.m3]);
    });
    let i_body: any = [];
    let n_body: any = [];
    let e_body: any = [];
    let a_body: any = [];
    let i_suma: number = 0;
    let n_suma: number = 0;
    let e_suma: number = 0;
    let a_suma: number = 0;
    let i_head: any = [
      'Emisión Inicial',
      ['N°', 'Id', 'Descripción', 'Abonados', 'Valor'],
    ];
    let n_head: any = [
      'Emisiones Nuevas',
      ['N°', 'Id', 'Descripción', 'Abonados', 'Valor'],
    ];
    let e_head: any = [
      'Emisiones Eliminadas',
      ['N°', 'Id', 'Descripción', 'Abonados', 'Valor'],
    ];
    let a_head: any = [
      'Emisión Acutal',
      ['N°', 'Id', 'Descripción', 'Abonados', 'Valor'],
    ];
    let emision: any = await this.getEmision(idemision);
    inicial.forEach((item: any) => {
      item.abonados === null ? (item.abonados = 0) : item.abonados;

      i_body.push([
        item.idrubro_rubros,
        item.descripcion,
        item.abonados,
        item.total.toFixed(2),
      ]);
      i_suma += item.total;
    });
    i_body = this.agregarTotalRegistros(this.agregarNumeracion(i_body), i_body.length);
    i_body.push(['', '', 'Total', '', i_suma.toFixed(2)]);
    nuevos.forEach((item: any) => {
      item.abonados === null ? (item.abonados = 0) : item.abonados;
      n_body.push([
        item.idrubro_rubros,
        item.descripcion,
        item.abonados,
        item.total.toFixed(2),
      ]);
      n_suma += item.total;
    });
    n_body = this.agregarTotalRegistros(this.agregarNumeracion(n_body), n_body.length);
    n_body.push(['', '', 'Total', '', n_suma.toFixed(2)]);
    eliminados.forEach((item: any) => {
      item.abonados === null ? (item.abonados = 0) : item.abonados;
      e_body.push([
        item.idrubro_rubros,
        item.descripcion,
        item.abonados,
        item.total.toFixed(2),
      ]);
      e_suma += item.total;
    });
    e_body = this.agregarTotalRegistros(this.agregarNumeracion(e_body), e_body.length);
    e_body.push(['', '', 'Total', '', e_suma.toFixed(2)]);
    actuales.forEach((item: any) => {
      item.abonados === null ? (item.abonados = 0) : item.abonados;
      a_body.push([
        item.idrubro_rubros,
        item.descripcion,
        item.abonados,
        item.total.toFixed(2),
      ]);
      a_suma += item.total;
    });
    a_body = this.agregarTotalRegistros(this.agregarNumeracion(a_body), a_body.length);
    a_body.push(['', '', 'Total', '', a_suma.toFixed(2)]);

    body2 = this.agregarTotalRegistros(this.agregarNumeracion(body2), body2.length);

    this.s_pdf.bodyFiveTables(
      `Emisión final ${emision.emision}`,
      i_head,
      i_body,
      e_head,
      e_body,
      n_head,
      n_body,
      a_head,
      a_body,
      head2,
      body2,
      doc
    );
    this.s_loading.hideLoading();
  }
  getByIdEmisiones(idemision: number) {
    this.s_lecturas.getByIdEmisionesR(idemision).subscribe({
      next: (lecturas: any) => {
        let doc = new jsPDF();
        let body: any[] = [];
        let suma: any = 0;
        let head: any = [
          ['N°', 'Lectura', 'Emisión', 'Cuenta', 'Responsable P.', 'Ruta', 'Valor'],
        ];
        lecturas.forEach((lectura: any) => {
          body.push([
            lectura.idlectura,
            lectura.emision,
            lectura.cuenta,
            lectura.nombre,
            lectura.ruta,
            lectura.suma.toFixed(2),
          ]);
          suma += lectura.suma;
        });
        body = this.agregarTotalRegistros(this.agregarNumeracion(body), body.length);
        body.push(['', '', '', '', '', 'TOTAL', suma.toFixed(2)]);
        this.s_pdf.bodyOneTable(
          `Facturas eliminadas - Emisión: ${lecturas[0].emision}`,
          head,
          body,
          doc
        );
        this.s_loading.hideLoading();
      },
      error: (e) => { void this.mostrarErrorReporte(e); },
    });
  }
  listAllEmisiones() {
    this.emiService.findAllEmisionesBasic().subscribe({
      next: (emisiones: any) => {
        this.l_emisiones = Array.isArray(emisiones) ? emisiones : [];
        this.filtrarEmisiones();
      },
      error: (e) => { void this.mostrarErrorReporte(e); },
    });
  }

  filtrarEmisiones() {
    const termino = (this.filtroEmision || '').trim().toLowerCase();

    this.l_emisionesFiltradas = this.l_emisiones.filter((emision: any) => {
      if (this.opcreporte === 14 && Number(emision.estado) !== 0) return false;
      if (!termino) return true;

      return String(emision?.emision ?? '')
        .toLowerCase()
        .includes(termino);
    });
  }

  onEmisionInputChange(valor: string) {
    this.filtroEmision = valor;
    this.filtrarEmisiones();

    const seleccion = this.l_emisiones.find(
      (emision: any) => String(emision?.emision ?? '') === valor &&
        (this.opcreporte !== 14 || Number(emision.estado) === 0)
    );

    if (seleccion?.idemision != null) {
      this.formImprimir.patchValue({ emision: seleccion.idemision });
    } else if (this.opcreporte === 14) {
      this.formImprimir.patchValue({ emision: null });
    }
  }
  async exportarValoresEmitidos(idemision: any) {
    this.nombrearchivo = this.formImprimir.value.nombrearchivo;
    let emision = await this.getEmision(idemision);
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(this.nombrearchivo);
    let titulo = `VALORES EMITIDOS EMISIÓN: ${emision?.emision}`;
    worksheet.addRow(['', titulo]);
    // Celda B1
    const cellB1 = worksheet.getCell('B1');
    const customStyle = {
      font: {
        name: 'Times New Roman',
        bold: true,
        size: 14,
        color: { argb: '002060' },
      },
    };
    cellB1.font = customStyle.font;

    // Aplicar el estilo personalizado a los Títulos
    const cellC1 = worksheet.getCell('C1');
    cellC1.font = customStyle.font;

    worksheet.addRow([]);
    const cabecera = ['Cuenta', 'Nombre', 'Categoria', 'M3', 'Val.Emitido'];
    const headerRowCell = worksheet.addRow(cabecera);
    headerRowCell.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '002060' },
      };
      cell.font = {
        bold: true,
        name: 'Times New Roman',
        color: { argb: 'FFFFFF' },
      };
    });
    //AGREGAR DATOS AL EXCEL
    let getDatos: any = await this.getValoresEmitidos(idemision);
    getDatos.forEach((item: any) => {
      const row = [
        item.cuenta,
        item.nombre,
        item.categoria,
        item.m3,
        item.valemitido,
      ];
      worksheet.addRow(row);
    });

    // Establece el ancho de las columnas
    const anchoConfig = [
      { columnIndex: 1, widthInChars: 10 },
      { columnIndex: 2, widthInChars: 58 },
      { columnIndex: 3, widthInChars: 18 },
    ];
    anchoConfig.forEach((config) => {
      worksheet.getColumn(config.columnIndex).width = config.widthInChars;
    });

    // Columnas centradas
    const columnsToCenter = [1];
    columnsToCenter.forEach((columnIndex) => {
      worksheet
        .getColumn(columnIndex)
        .eachCell({ includeEmpty: true }, (cell) => {
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        });
    });
    // Columnas a la derecha
    let columnsToRigth = [3];
    columnsToRigth.forEach((columnIndex) => {
      worksheet
        .getColumn(columnIndex)
        .eachCell({ includeEmpty: true }, (cell) => {
          cell.alignment = { horizontal: 'right' };
        });
    });
    // Formato numérico con decimales
    const numeroStyle1 = { numFmt: '#,##0.00' };
    const columnsToFormat1 = [3];
    for (let i = 4; i <= getDatos.length + 3; i++) {
      columnsToFormat1.forEach((columnIndex) => {
        const cell = worksheet.getCell(i, columnIndex);
        cell.style = numeroStyle1;
      });
    }

    // Crea el archivo Excel
    workbook.xlsx.writeBuffer().then((buffer) => {
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);

      // Crear un enlace para descargar el archivo
      const a = document.createElement('a');
      a.href = url;
      a.download = `${this.nombrearchivo}.xlsx`; // Usa el nombre proporcionado por el usuario
      a.click();

      window.URL.revokeObjectURL(url); // Libera recursos
    });
  }

  async impValoresEmisiones(idemision: number) {
    this.s_loading.showLoading();
    let emision = await this.getEmision(idemision);
    let head = [
      ['N°', 'CUENTA', 'NOMBRE Y APELLIDO', 'CATEGORIA', 'M3', 'VAL.EMITIDO'],
    ];
    let doc = new jsPDF();
    let valoresEmitidos: any = await this.getValoresEmitidos(idemision);
    let body: any = [];
    valoresEmitidos.forEach(async (item: any) => {
      await body.push([
        item.cuenta,
        item.nombre,
        item.categoria,
        item.m3,
        item.valemitido.toFixed(2),
      ]);
    });
    body = this.agregarTotalRegistros(this.agregarNumeracion(body), body.length);

    //this.pdfview = this.s_loading.showLoading();
    this.s_pdf._bodyOneTable(
      `VALORES EMITIDOS EMISION: ${emision?.emision}`,
      head,
      body,
      doc
    );
    this.s_loading.hideLoading();
  }
  async impConsumoXCategoria(idemision: number) {
    let emision = await this.getEmision(idemision);
    let datos: any = await this.getConsumoXCategoria(idemision);
    let doc = new jsPDF();
    let head = [['N°', 'N° CUENTAS', 'DESCRIPCIÓN', 'M3', 'TOTAL']];
    let body: any = [];
    let s_m3: number = 0;
    let s_total: number = 0;
    datos.forEach((item: any) => {
      body.push([
        item.cuentas,
        item.descripcion,
        item.m3,
        item.total.toFixed(2),
      ]);
      s_m3 += item.m3;
      s_total += item.total;
    });
    body = this.agregarTotalRegistros(this.agregarNumeracion(body), body.length);
    body.push(['', '', 'TOTAL: ', s_m3.toFixed(2), s_total.toFixed(2)]);

    this.s_pdf.bodyOneTable(
      `REPORTE DE CONSUMO POR CATEGORIA - EMISION ${emision?.emision}`,
      head,
      body,
      doc
    );
    this.s_loading.hideLoading();
  }
  async impRefacturacionxEmision(idemision: number) {
    let emision = await this.getEmision(idemision);
    let obj: any = await this.getRefacturacionxEmision(idemision);
    let eliminadas: any = await this.getFacElimByEmision(idemision);
    let doc = new jsPDF();
    let n_suma: number = 0;
    let a_suma: number = 0;
    let sum_eliminadas: number = 0;
    let head = [
      [`REFACTURACIÓN DE LA EMISION ${emision?.emision} `],
      [
        'N°',
        'CUENTA',
        'NOMBRE',
        'RAZON REFACTURACIÓN',
        'FECHA BAJA',
        'VALOR ANTERIOR',
        'VALOR NUEVO',
        'DIFERENCIA',
      ],
    ];
    let head2 = [
      [`BAJAS DE LA EMISION ${emision?.emision}`],
      [
        'N°',
        'CUENTA',
        'NOMBRE',
        'PLANILLA',
        'USU.BAJA',
        'RAZON BAJA',
        'FECHA BAJA',
        'VALOR',
      ],
    ];
    let body: any = [];
    let body2: any = [];
    let diferencia: number = 0;
    obj.forEach((item: any) => {
      let va = item.valoranterior > 0 ? item.valoranterior : 0;
      let vn = item.valornuevo > 0 ? item.valornuevo : 0;
      let dif = va - vn;

      body.push([
        item.cuenta,
        item.nombre,
        item.observaciones,
        item.fecelimina,
        va.toFixed(2),
        vn.toFixed(2),
        dif.toFixed(2),
      ]);
      n_suma += item.valornuevo;
      a_suma += item.valoranterior;
      diferencia = a_suma - n_suma;
    });
    body = this.agregarTotalRegistros(this.agregarNumeracion(body), body.length);
    body.push([
      '',
      '',
      '',
      '',
      'TOTALES',
      a_suma.toFixed(2),
      n_suma.toFixed(2),
      diferencia.toFixed(2),
    ]);
    eliminadas.forEach((item: any) => {
      let va = item.total;
      body2.push([
        item.cuenta,
        item.nombre,
        item.idfactura,
        item.usuario,
        item.razoneliminacion,
        item.fechaeliminacion,
        va.toFixed(2),
      ]);
      sum_eliminadas += va;
    });
    body2 = this.agregarTotalRegistros(this.agregarNumeracion(body2), body2.length);
    body2.push(['', '', '', '', '', 'TOTAL', sum_eliminadas.toFixed(2), '']);
    this.s_pdf._bodyShowTwoTables(
      `Refacturación y bajas de la emisión ${emision?.emision}`,
      head,
      body,
      head2,
      body2,
      doc
    );
    this.s_loading.hideLoading();
  }
  async impRefacturacionxFecha(d: Date, h: Date) {
    let obj: any = await this.getRefacturacionxFecha(d, h);
    let eliminadas: any = await this.getFacElimByFechaElimina(d, h);
    let doc = new jsPDF();
    let n_suma: number = 0;
    let a_suma: number = 0;
    let sum_eliminadas: number = 0;

    let head = [
      ['LISTADO DE REFACTURACIONES'],
      [
        'N°',
        'CUENTA',
        'NOMBRE',
        'RAZON REFACTURACIÓN',
        'FECHA ELIMINACIÓN',
        'EMI. ANTERIOR',
        'VALOR ANTERIOR',
        'EMI. ACTUAL',
        'VALOR NUEVO',
        'DIFERENCIA',
      ],
    ];
    let head2 = [
      [`LISTADO DE BAJAS`],
      [
        'N°',
        'CUENTA',
        'NOMBRE',
        'PLANILLA',
        'USU.BAJA',
        'RAZON BAJA',
        'FECHA BAJA',
        'VALOR',
      ],
    ];
    let body: any = [];
    let body2: any = [];
    obj.forEach((item: any) => {
      let diferencia: number = item.valoranterior - item.valornuevo;
      if (item.valoranterior === null) {
        item.valoranterior = 0;
      }
      if (item.valornuevo === null) {
        item.valornuevo = 0;
      }
      body.push([
        item.cuenta,
        item.nombre,
        item.observaciones,
        item.fecelimina,
        item.emisionanterior,
        item.valoranterior.toFixed(2) || 0,
        item.emisionnueva,
        item.valornuevo.toFixed(2),
        diferencia.toFixed(2),
      ]);
      n_suma += item.valornuevo;
      a_suma += item.valoranterior;
    });
    body = this.agregarTotalRegistros(this.agregarNumeracion(body), body.length);
    body.push([
      '',
      '',
      '',
      '',
      '',
      'TOTALES',
      a_suma.toFixed(2),
      '',
      n_suma.toFixed(2),
      (a_suma - n_suma).toFixed(2),
    ]);
    eliminadas.forEach((item: any) => {
      let va = item.total;
      body2.push([
        item.cuenta,
        item.nombre,
        item.idfactura,
        item.usuario,
        item.razoneliminacion,
        item.fechaeliminacion,
        va.toFixed(2),
      ]);
      sum_eliminadas += va;
    });
    body2 = this.agregarTotalRegistros(this.agregarNumeracion(body2), body2.length);
    body2.push(['', '', '', '', '', 'TOTAL', sum_eliminadas.toFixed(2), '']);
    this.s_pdf._bodyShowTwoTables(
      `Refacturación y bajas ${d} - ${h}`,
      head,
      body,
      head2,
      body2,
      doc
    );
    this.s_loading.hideLoading();
  }
  async impRefEmisionRubros(idemision: number) {
    let doc: jsPDF = new jsPDF();
    let emision = await this.getEmision(idemision);
    let valoresAnteriores: any =
      await this.s_emisionindividual.getRefacturacionRubrosAnteriores(
        idemision
      );
    let valoresNuevos: any =
      await this.s_emisionindividual.getRefacturacionRubrosNuevos(idemision);
    let headAnteriores: any = [
      ['Rubros eliminados'],
      ['N°', 'Código', 'Descripción', 'Total'],
    ];
    let headNuevos: any = [
      ['Rubros generados'],
      ['N°', 'Código', 'Descripción', 'Total'],
    ];
    let bodyAnteriores: any = [];
    let bodyNuevos: any = [];
    let sumaAnteriores: number = 0;
    let sumaNuevos: number = 0;
    valoresAnteriores.forEach((item: any) => {
      bodyAnteriores.push([item.idrubro_rubros, item.descripcion, item.sum]);
      sumaAnteriores += item.sum;
    });
    bodyAnteriores = this.agregarTotalRegistros(
      this.agregarNumeracion(bodyAnteriores),
      bodyAnteriores.length
    );
    bodyAnteriores.push(['', '', 'TOTAL', sumaAnteriores.toFixed(2)]);
    valoresNuevos.forEach((item: any) => {
      bodyNuevos.push([item.idrubro_rubros, item.descripcion, item.sum]);
      sumaNuevos += item.sum;
    });
    bodyNuevos = this.agregarTotalRegistros(
      this.agregarNumeracion(bodyNuevos),
      bodyNuevos.length
    );
    bodyNuevos.push(
      ['', '', 'TOTAL', sumaNuevos.toFixed(2)],
      ['', '', 'DIFERENCIA', (sumaAnteriores - sumaNuevos).toFixed(2)]
    );
    this.s_pdf.bodyTwoTables(
      `Refacturaciones por rubros emision: ${emision?.emision}`,
      headAnteriores,
      bodyAnteriores,
      headNuevos,
      bodyNuevos,
      doc
    );
    this.s_loading.hideLoading();
  }
  async impRefFechaRubros(d: Date, h: Date) {
    let doc: jsPDF = new jsPDF();
    let valoresAnteriores: any =
      await this.s_emisionindividual.getRefacturacionxFechaRubrosAnteriores(
        d,
        h
      );
    let valoresNuevos: any =
      await this.s_emisionindividual.getRefacturacionxFechaRubrosNuevos(d, h);
    let headAnteriores: any = [
      ['Rubros eliminados'],
      ['N°', 'Código', 'Descripción', 'Total'],
    ];
    let headNuevos: any = [
      ['Rubros generados'],
      ['N°', 'Código', 'Descripción', 'Total'],
    ];
    let bodyAnteriores: any = [];
    let bodyNuevos: any = [];
    let sumaAnteriores: number = 0;
    let sumaNuevos: number = 0;
    valoresAnteriores.forEach((item: any) => {
      bodyAnteriores.push([item.idrubro_rubros, item.descripcion, item.sum]);
      sumaAnteriores += item.sum;
    });
    bodyAnteriores = this.agregarTotalRegistros(
      this.agregarNumeracion(bodyAnteriores),
      bodyAnteriores.length
    );
    bodyAnteriores.push(['', '', 'TOTAL', sumaAnteriores.toFixed(2)]);
    valoresNuevos.forEach((item: any) => {
      bodyNuevos.push([item.idrubro_rubros, item.descripcion, item.sum]);
      sumaNuevos += item.sum;
    });
    bodyNuevos = this.agregarTotalRegistros(
      this.agregarNumeracion(bodyNuevos),
      bodyNuevos.length
    );
    bodyNuevos.push(
      ['', '', 'TOTAL', sumaNuevos.toFixed(2)],
      ['', '', 'DIFERENCIA', (sumaAnteriores - sumaNuevos).toFixed(2)]
    );
    this.s_pdf.bodyTwoTables(
      `Refacturaciones por fecha ${d} - ${h}`,
      headAnteriores,
      bodyAnteriores,
      headNuevos,
      bodyNuevos,
      doc
    );
    this.s_loading.hideLoading();
  }
  async getValoresEmitidos(idemision: number) {
    let valores = this.s_lecturas
      .findReporteValEmitidosxEmision(idemision)
      .toPromise();
    return this.filtrarRegistrosActivos(await valores);
  }
  async getEmisionIndividualByIdEmision(idemision: number) {
    let doc = new jsPDF();
    let emision: any = await this.getEmision(idemision);
    let anteriores: any = await this.getEmisionesAnteriores(idemision);
    let nuevas: any = await this.getEmisionesNuevas(idemision);
    let headAnteriores: any = [
      ['Facturas eliminadas'],
      ['N°', 'Cuenta', 'Emision', 'Planilla', 'Total'],
    ];
    let headNuevas: any = [
      ['Facturas emitidas'],
      ['N°', 'Cuenta', 'Emision', 'Planilla', 'Total'],
    ];
    let bodyAnteriores: any = [];
    headAnteriores[1] = ['N', 'Cuenta', 'Cliente', 'Emision', 'Planilla', 'Fecha eliminacion', 'Total'];
    headNuevas[1] = ['N', 'Cuenta', 'Cliente', 'Emision', 'Planilla', 'Total'];
    let bodyNuevas: any = [];
    let sumant: number = 0;
    let sumnev: number = 0;
    anteriores.forEach((iAnteriores: any) => {
      sumant += +iAnteriores.tanterior.toFixed(2);
      bodyAnteriores.push([
        iAnteriores.cuenta,
        iAnteriores.nombrecliente,
        iAnteriores.emisiona,
        iAnteriores.facturaa,
        iAnteriores.fechaeliminacion,
        iAnteriores.tanterior.toFixed(2),
      ]);
    });
    bodyAnteriores = this.agregarTotalRegistros(
      this.agregarNumeracion(bodyAnteriores),
      bodyAnteriores.length
    );
    bodyAnteriores.push(['', '', '', '', '', 'TOTAL', sumant.toFixed(2)]);
    nuevas.forEach((iNuevas: any) => {
      sumnev += +iNuevas.tnuevo.toFixed(2);
      bodyNuevas.push([
        iNuevas.cuenta,
        iNuevas.nombrecliente,
        iNuevas.emisionn,
        iNuevas.facturan,
        iNuevas.tnuevo.toFixed(2),
      ]);
    });
    bodyNuevas = this.agregarTotalRegistros(
      this.agregarNumeracion(bodyNuevas),
      bodyNuevas.length
    );
    bodyNuevas.push(['', '', '', '', 'TOTAL', sumnev.toFixed(2)]);
    this.s_pdf.bodyTwoTablesVertical(
      `REPORTE EMISIONES NUEVAS ${emision.emision}`,
      headAnteriores,
      bodyAnteriores,
      headNuevas,
      bodyNuevas,
      doc
    );
    this.s_loading.hideLoading();
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
    return this.filtrarRegistrosActivos(await inicial);
  }
  async getCM3Inicial(idemision: number) {
    let inicial = this.s_lecturas.findCM3Inicial(idemision).toPromise();
    return inicial;
  }
  async getRubLectEliminados(idemision: number) {
    let eliminados = this.s_lecturas.findEliminados(idemision).toPromise();
    return this.filtrarRegistrosActivos(await eliminados);
  }
  async getRubLectNuevos(idemision: number) {
    let nuevos = this.s_lecturas.findNuevos(idemision).toPromise();
    return this.filtrarRegistrosActivos(await nuevos);
  }
  async getRubLectActual(idemision: number) {
    let actual = this.s_lecturas.findActual(idemision).toPromise();
    return this.filtrarRegistrosActivos(await actual);
  }
  async getConsumoXCategoria(idemision: number) {
    let cxc = this.s_lecturas.findConsumoxCategoria(idemision).toPromise();
    return this.filtrarRegistrosActivos(await cxc);
  }
  async getRefacturacionxEmision(idemision: number) {
    let reporte = this.s_emisionindividual
      .getRefacturacionxEmision(idemision)
      .toPromise();
    return reporte;
  }
  async getFacElimByEmision(idemision: number) {
    let reporte = await this.s_emisionindividual.getFacElimByEmision(idemision);
    return reporte;
  }
  async getRefacturacionxFecha(d: Date, h: Date) {
    let reporte = this.s_emisionindividual
      .getRefacturacionxFecha(d, h)
      .toPromise();
    return reporte;
  }
  async getFacElimByFechaElimina(d: Date, h: Date) {
    let reporte = await this.s_emisionindividual.getFacElimByFechaElimina(d, h);
    return reporte;
  }
  async getZeroByEmisiones(idemision: number) {
    return (await this.s_lecturas.findZeroByEmisiones(idemision)).toPromise();
  }
  changeReporte() {
    this.opcreporte = +this.formImprimir.value.reporte!;
    this.filtrarEmisiones();
    if (this.opcreporte === 14) {
      const seleccion = this.l_emisiones.find(e => Number(e.idemision) === Number(this.formImprimir.value.emision) && Number(e.estado) === 0);
      this.filtroEmision = seleccion ? String(seleccion.emision) : '';
      this.formImprimir.patchValue({ emision: seleccion?.idemision ?? null });
      this.filtrarEmisiones();
    }
    if (this.opcreporte === 8 || this.opcreporte === 10 || this.opcreporte === 12) {
      this.tipe = 'date';
      const fecha: Date = new Date();
      const strfecha = fecha.toISOString().slice(0, 10);
      this.formImprimir.patchValue({
        d_emi: strfecha,
        h_emi: strfecha,
      });
    } else if (this.opcreporte === 0) {
      this.tipe = 'text';
      this.setUltimos();
    }
  }
  hideListaEmision() {
    if (
      this.opcreporte === 1 ||
      this.opcreporte === 2 ||
      this.opcreporte === 3 ||
      this.opcreporte === 4 ||
      this.opcreporte === 5 ||
      this.opcreporte === 6 ||
      this.opcreporte === 7 ||
      this.opcreporte === 9 ||
      this.opcreporte === 11 ||
      this.opcreporte == 13 ||
      this.opcreporte === 14
    ) {
      return false;
    }

    return true;
  }
  impriexpor() {
    this.swimprimir = !this.swimprimir;
  }
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
        error: (err) => { void this.mostrarErrorReporte(err); },
      });
  }
  impListaEmisiones() {
    let doc = new jsPDF();
    const nombreEmision = new NombreEmisionPipe(); // Crea una instancia del pipe
    let head = [['N°', 'Emision', 'm3', 'Fecha Cierre']];
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
    datos = this.agregarTotalRegistros(this.agregarNumeracion(datos), datos.length);
    this.s_pdf.bodyOneTable('Listado de emisiones', head, datos, doc);
    this.s_loading.hideLoading();
  }
  async getEmision(idemision: number) {
    const emision = await this.emiService.getByIdemision(idemision).toPromise();
    return emision;
  }

  get puedeGenerarPreemision(): boolean {
    return this.l_emisiones.some(e => Number(e.idemision) === Number(this.formImprimir?.value.emision) && Number(e.estado) === 0);
  }

  async generarPreemision(excel: boolean): Promise<void> {
    if (this.swcalculando) return;
    const viewer = document.getElementById('pdfViewer') as HTMLIFrameElement | null;
    if (!excel && viewer) viewer.removeAttribute('src');
    if (!this.puedeGenerarPreemision) {
      await Swal.fire('Seleccione una emisión abierta', 'La preemisión está disponible antes del cierre de la emisión.', 'info');
      return;
    }
    this.swcalculando = true;
    this.s_loading.showLoading();
    try {
      const reporte = await firstValueFrom(this.s_lecturas.getPreemision(Number(this.formImprimir.value.emision)));
      if (!reporte.cuentas) {
        this.s_loading.hideLoading();
        await Swal.fire('Sin lecturas', 'La emisión seleccionada todavía no tiene lecturas para calcular.', 'info');
        return;
      }
      if (excel) {
        await this.exportarPreemision(reporte);
      } else {
        this.imprimirPreemision(reporte);
      }
    } catch (error: any) {
      console.error('No se pudo generar la preemisión', error);
      this.s_loading.hideLoading();
      await Swal.fire('No se pudo generar la preemisión',
        error?.status === 409 ? 'La emisión ya no está abierta. Actualice la selección.' :
        (error?.error?.message || 'No se pudo completar el cálculo. Intente nuevamente.'), 'error');
    } finally {
      this.swcalculando = false;
      this.s_loading.hideLoading();
    }
  }

  private imprimirPreemision(reporte: PreemisionReporte): void {
    const doc = new jsPDF('l', 'pt', 'a4');
    const titulo = `Preemisión: ${new NombreEmisionPipe().transform(reporte.emision)}`;
    const aviso = 'Valores provisionales del período: incluyen multas y recargos aplicables; no incluyen deudas anteriores.';
    this.s_pdf.header(titulo, doc);
    autoTable(doc, {
      startY: 95,
      body: [[aviso], ['Se recalculan al cierre con las lecturas y condiciones vigentes.'],
        [`Consumos negativos calculados con 0 m³: ${reporte.consumosNegativos}`]],
      theme: 'plain', styles: { fontSize: 9 },
    });
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 10,
      head: [['Código', 'Ruta', 'Cuentas', 'm³ a facturar', 'Valor previsto USD']],
      body: reporte.rutas.map(r => [r.codigo, r.ruta, r.cuentas, r.m3, Number(r.valor).toFixed(2)]),
      foot: [['', 'TOTAL', reporte.cuentas, reporte.m3, Number(reporte.valor).toFixed(2)]],
      theme: 'grid', styles: { fontSize: 9 },
    });
    for (const ruta of reporte.rutas) {
      doc.addPage();
      this.s_pdf.header(`${titulo} - ${ruta.codigo} ${ruta.ruta}`, doc);
      autoTable(doc, {
        startY: 95,
        head: [['Cuenta', 'Abonado', 'Categoría', 'Anterior', 'Actual', 'm³', 'Valor USD', 'Observación']],
        body: ruta.detalle.map(c => [c.cuenta, c.abonado, c.categoria, c.anterior, c.actual, c.m3, Number(c.valor).toFixed(2), c.observacion]),
        foot: [['', 'TOTAL RUTA', '', '', '', ruta.m3, Number(ruta.valor).toFixed(2), '']],
        theme: 'grid', styles: { fontSize: 8 }, margin: { bottom: 35 },
      });
    }
    for (let page = 1; page <= doc.getNumberOfPages(); page++) {
      doc.setPage(page);
      this.s_pdf.setfooter(doc);
    }
    const viewer = document.getElementById('pdfViewer') as HTMLIFrameElement | null;
    if (viewer) viewer.src = URL.createObjectURL(doc.output('blob'));
  }

  private async exportarPreemision(reporte: PreemisionReporte): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    const resumen = workbook.addWorksheet('Resumen por ruta');
    resumen.columns = [{ width: 20 }, { width: 48 }, { width: 16 }, { width: 20 }, { width: 23 }];
    resumen.addRow(['Preemisión', reporte.emision]);
    resumen.addRow(['Valores provisionales del período. Incluyen multas y recargos aplicables; no incluyen deudas anteriores.']);
    resumen.mergeCells('A2:E2');
    resumen.getRow(2).height = 32;
    resumen.addRow(['Código', 'Ruta', 'Cuentas', 'm³ a facturar', 'Valor previsto USD']);
    reporte.rutas.forEach(r => resumen.addRow([String(r.codigo || ''), r.ruta, r.cuentas, r.m3, Number(r.valor)]));
    resumen.addRow(['', 'TOTAL', reporte.cuentas, reporte.m3, Number(reporte.valor)]).font = { bold: true };
    resumen.getColumn(5).numFmt = '#,##0.00';
    const detalle = workbook.addWorksheet('Detalle por cuenta');
    detalle.columns = [
      { header: 'Código', width: 16 }, { header: 'Ruta', width: 32 },
      { header: 'Cuenta', width: 16 }, { header: 'Abonado', width: 45 },
      { header: 'Categoría', width: 25 }, { header: 'Anterior', width: 16 },
      { header: 'Actual', width: 16 }, { header: 'm³ a facturar', width: 18 },
      { header: 'Valor previsto USD', width: 23 }, { header: 'Observación', width: 55 },
    ];
    reporte.rutas.forEach(r => r.detalle.forEach(c => detalle.addRow([
      String(r.codigo || ''), r.ruta, String(c.cuenta), c.abonado, c.categoria,
      c.anterior, c.actual, c.m3, Number(c.valor), c.observacion,
    ])));
    detalle.getColumn(9).numFmt = '#,##0.00';
    for (const [sheet, header] of [[resumen, 3], [detalle, 1]] as [ExcelJS.Worksheet, number][]) {
      sheet.views = [{ state: 'frozen', ySplit: header }];
      sheet.autoFilter = { from: { row: header, column: 1 }, to: { row: sheet === resumen ? sheet.rowCount - 1 : sheet.rowCount, column: sheet.columnCount } };
      sheet.getRow(header).eachCell(cell => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF174B63' } };
      });
      sheet.eachRow(row => { row.alignment = { vertical: 'top', wrapText: true }; });
    }
    const nombre = String(this.formImprimir.value.nombrearchivo || `preemision-${reporte.emision}`).replace(/[<>:"/\\|?*\x00-\x1F]/g, '-');
    saveAs(new Blob([await workbook.xlsx.writeBuffer()], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `${nombre}.xlsx`);
  }

  private filtrarRegistrosActivos<T>(registros: T): T {
    if (!Array.isArray(registros)) {
      return registros;
    }

    return registros.filter((item: any) => item?.estado !== 0) as T;
  }

  private agregarNumeracion(filas: any[]): any[] {
    return (filas || []).map((fila: any[], index: number) => [index + 1, ...fila]);
  }

  private agregarTotalRegistros(filas: any[], totalRegistros: number): any[] {
    const cantidadColumnas = filas[0]?.length ?? 1;
    const resumen = Array(cantidadColumnas).fill('');

    if (cantidadColumnas === 1) {
      resumen[0] = `Registros: ${totalRegistros}`;
    } else {
      resumen[cantidadColumnas - 2] = 'Registros:';
      resumen[cantidadColumnas - 1] = totalRegistros;
    }

    return [...filas, resumen];
  }
}
