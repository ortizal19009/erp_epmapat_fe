import { descargarExcelCaja, excelListaCajas, excelPlanillasCaja, excelResumenCaja, excelTransferenciasCaja, excelTransferenciasGlobalCaja, resumenCaja, totalPlanillaCaja, totalTransferenciaCaja, sumarCaja, monedaCaja } from 'src/app/servicios/caja-reporte-excel';
﻿import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { FacturaService } from 'src/app/servicios/factura.service';
import { PdfService } from 'src/app/servicios/pdf.service';
import { RubroxfacService } from 'src/app/servicios/rubroxfac.service';
import { UsuarioService } from 'src/app/servicios/administracion/usuario.service';
import { LoadingService } from 'src/app/servicios/loading.service';
import { JasperReportService } from 'src/app/servicios/jasper-report.service';
import { saveAs } from 'file-saver';

@Component({
  selector: 'app-imp-info-cajas',
  templateUrl: './imp-info-cajas.component.html',
  styleUrls: ['./imp-info-cajas.component.css'],
})
export class ImpInfoCajasComponent implements OnInit {
  readonly extensionesReporte = ['pdf', 'xml', 'xlsx', 'csv'];
  swimprimir: boolean = true;
  formImprimir: FormGroup;
  opcreporte: number = 1;
  otrapagina: any = false;
  _cajas: any;
  nombrearchivo: string;
  _cobradas: any[] = [];
  _rubrosanterior: any[] = [];
  _formacobro: any[] = [];
  total: number;
  sumtotaltarifa: number;
  errorReporte = '';
  swbotones: boolean = false;
  swcalculando: boolean = false;
  txtcalculando = 'Calculando';
  nombreUsuario: any;
  type: string = 'date';
  date: Date = new Date();
  idrec: number = +sessionStorage.getItem('idrecaudador')!;
  constructor(
    public authService: AutorizaService,
    public fb: FormBuilder,
    private router: Router,
    private facService: FacturaService,
    private rxfService: RubroxfacService,
    private _pdf: PdfService,
    private s_usuarios: UsuarioService,
    private s_loading: LoadingService,
    private s_jasperreport: JasperReportService
  ) { }

  ngOnInit(): void {
    sessionStorage.setItem('ventana', '/cajas');
    let coloresJSON = sessionStorage.getItem('/cajas');
    if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));

    const strfecha = this.getLocalDate();
    this.formImprimir = this.fb.group({
      reporte: '1',
      extencion: 'pdf',
      d_fecha: strfecha,
      h_fecha: strfecha,
      hasta: `${new Date().getFullYear() - 1}-12-31`,
      nombrearchivo: ['', [Validators.required, Validators.minLength(3)]],
      otrapagina: '',
      hdesde: '',
      hhasta: '',
    });
    this.getRecaudador();
  }

  private getLocalDate(): string {
    const fecha = new Date();
    const offset = fecha.getTimezoneOffset();
    const local = new Date(fecha.getTime() - offset * 60000);
    return local.toISOString().slice(0, 10);
  }

  private getTotalResumen(rubro: any): number {
    const total = Number(rubro?.[2] ?? 0);
    return Number.isFinite(total) ? this.redondearMoneda(total) : 0;
  }

  private debeMostrarRubroResumen(rubro: any): boolean {
    return Math.abs(this.getTotalResumen(rubro)) > 0;
  }

  private calcularIvaResumen(rubro: any, fechaCorte: string): number {
    const totalRecaudado = this.getTotalResumen(rubro);
    if (rubro?.[3] !== true || totalRecaudado === 0) {
      return 0;
    }
    return this.redondearMoneda(
      totalRecaudado * (fechaCorte >= '2024-04-01' ? 0.15 : 0.12)
    );
  }

  private construirFilasResumenExcel(fecha: string) {
    return resumenCaja(this._cobradas, this._rubrosanterior, fecha);
  }

  private getTotalFacturaExportacion(factura: any): number {
    return totalPlanillaCaja(factura);
  }

  private redondearMoneda(valor: number): number {
    return Math.round((valor + Number.EPSILON) * 100) / 100;
  }

  private toLocalDateTime(date: Date, time: string): string {
    const offset = date.getTimezoneOffset();
    const local = new Date(date.getTime() - offset * 60000);
    return `${local.toISOString().slice(0, 10)}T${time}`;
  }

  async getRecaudador() {
    let recaudador = +sessionStorage.getItem('idrecaudador')!;
    this.s_usuarios.getDatosOfOne(recaudador).subscribe({
      next: (recaudador: any) => {
        this.nombreUsuario = recaudador.nombre;

      },
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

  get f() {
    return this.formImprimir.controls;
  }

  changeReporte() {
    this.opcreporte = +this.formImprimir.value.reporte;

    const hoy = new Date();

    if (this.opcreporte === 3) {
      this.type = 'datetime-local';
      this.formImprimir.patchValue({
        d_fecha: this.toLocalDateTime(hoy, '07:30'),
        h_fecha: this.toLocalDateTime(hoy, '16:30'),
      });
    } else {
      this.type = 'date';
      this.formImprimir.patchValue({
        d_fecha: this.getLocalDate(),
        h_fecha: this.getLocalDate(),
      });
    }
  }

  impriexpor() {
    this.swimprimir = !this.swimprimir;
    this.formImprimir.patchValue({ extencion: this.swimprimir ? 'pdf' : 'xlsx' });
    this.swbotones = false;
  }

  //Recupera los datos de cada reporte
  async imprimir() {
    let recaudador = +sessionStorage.getItem('idrecaudador')!;
    const elementoExistente = document.getElementById('idembed');

    this.errorReporte = '';
    this.opcreporte = Number(this.formImprimir.value.reporte);
    this.swbotones = true;
    this.swcalculando = true;
    let d_fecha = this.formImprimir.value.d_fecha;
    let h_fecha = this.formImprimir.value.h_fecha;
    let hhasta = this.formImprimir.value.hhasta;
    let hdesde = this.formImprimir.value.hdesde;
    let f: Date = new Date();
    let hasta = `${Number(d_fecha.slice(0,4)) - 1}-12-31`;
    try {
    switch (this.opcreporte) {
      case 1: // Recaudación diaria - Resumen
        /*         this.facService
                  .reporteFacturasRubrosCaja(
                    this.formImprimir.value.d_fecha,
                    this.formImprimir.value.h_fecha,
                    this.formImprimir.value.hasta,
                    recaudador
                  )
                  .subscribe({
                    next: (datos) => {
                      const blob = new Blob([datos], { type: 'application/pdf' });
                      saveAs(blob, `ReporteFacturasCaja_${recaudador}_${new Date().toDateString()}.pdf`);
                    },
                  }); */
        try {
          this._cobradas =
            await this.rxfService.getTotalRubrosActualByRecaudadorAsync(
              d_fecha,
              h_fecha,
              hasta,
              recaudador
            );
          try {
            this._rubrosanterior =
              await this.rxfService.getTotalRubrosAnteriorByRecaudadorAsync(
                d_fecha,
                h_fecha,
                hasta,
                recaudador
              );
            try {
              this._formacobro =
                await this.facService.totalFechaFormacobroByRecaudadorAsync(
                  d_fecha,
                  h_fecha,
                  recaudador
                );
              this.swcalculando = false;
              if (this.swimprimir) this.txtcalculando = 'Mostrar';
              else this.txtcalculando = 'Descargar';
            } catch (error) {
              throw error;
            }
          } catch (error) {
            throw error;
          }
        } catch (error) {
          throw error;
        }
        break;
      case 2: // Recaudación diaria - Planillas
        /*       this.facService
              .reporteFacturasCaja(
                this.formImprimir.value.d_fecha,
                this.formImprimir.value.h_fecha,
                recaudador
              )
              .subscribe({
                next: (datos) => {
                  const blob = new Blob([datos], { type: 'application/pdf' });
                  saveAs(blob, `ReporteFacturasCaja_${recaudador}_${new Date().toDateString()}.pdf`);
                },
              }); */
        try {
          this._cobradas =
            await this.facService.getByFechacobroTotByRecaudadorAsync(
              d_fecha,
              h_fecha,
              recaudador
            );
          await Promise.all(this._cobradas.map(async (item: any) => {
            item[0] = await this.facService.getByIdAsync(item.idfactura);
          }));
          // this.sw1 = true;
          this.swcalculando = false;
          if (this.swimprimir) this.txtcalculando = 'Mostrar';
          else this.txtcalculando = 'Descargar';
        } catch (error) {
          throw error;
        }
        break;
      case 3:
        this.s_loading.showLoading();
        if (elementoExistente) {
          elementoExistente.remove();
        }
        let body: any = {
          reportName: 'FacturasCobradasFacilitoHoras',
          parameters: {
            desde: d_fecha,
            hasta: h_fecha,
            idusuario: this.authService.idusuario,
            usuariocobro: recaudador,
          },

          extencion: this.getExtensionSeleccionada(),
        };
        let _reporte = await this.s_jasperreport.getReporte(body);
        this.procesarRespuestaReporte(_reporte, body.reportName);
        this.swcalculando = false;
        if (this.swimprimir) this.txtcalculando = 'Mostrar';
        else this.txtcalculando = 'Descargar';
        this.s_loading.hideLoading();
        break;
      case 4:
        this.s_loading.showLoading();
        if (elementoExistente) {
          elementoExistente.remove();
        }
        let data: any = {
          reportName: 'RubrosCobradosRec',
          parameters: {
            desde: d_fecha,
            hasta: h_fecha,
            tope: hasta,
            idusuario: this.authService.idusuario,
            usuariocobro: recaudador,
          },
          extencion: this.getExtensionSeleccionada(),
        };
        let reporte = await this.s_jasperreport.getReporte(data);
        this.procesarRespuestaReporte(reporte, data.reportName);
        this.swcalculando = false;
        if (this.swimprimir) this.txtcalculando = 'Mostrar';
        else this.txtcalculando = 'Descargar';
        this.s_loading.hideLoading();
        break;
      case 6:
        this.s_loading.showLoading();
        if (elementoExistente) {
          elementoExistente.remove();
        }
        let _data: any = {
          reportName: 'FacturasCobradasRec',
          parameters: {
            desde: d_fecha,
            hasta: h_fecha,
            idusuario: this.authService.idusuario,
            usuariocobro: recaudador,
          },
          extencion: this.getExtensionSeleccionada(),
        };
        let _eporte = await this.s_jasperreport.getReporte(_data);
        this.procesarRespuestaReporte(_eporte, _data.reportName);
        this.swcalculando = false;
        if (this.swimprimir) this.txtcalculando = 'Mostrar';
        else this.txtcalculando = 'Descargar';
        this.s_loading.hideLoading();
        break;


      case 5:
        this.s_loading.showLoading();
        if (elementoExistente) {
          elementoExistente.remove();
        }
        let d: any = {
          reportName: 'FacturasCobradasFacilito',
          parameters: {
            desde: d_fecha,
            hasta: h_fecha,
            idusuario: this.authService.idusuario,
            usuariocobro: recaudador,
          },
          extencion: this.getExtensionSeleccionada(),
        };
        let rep: any = await this.s_jasperreport.getReporte(d);
        this.procesarRespuestaReporte(rep, d.reportName);
        this.swcalculando = false;
        if (this.swimprimir) this.txtcalculando = 'Mostrar';
        else this.txtcalculando = 'Descargar';
        this.s_loading.hideLoading();
        break;

      default:
        break;
    }
    } catch (error) {
      this.errorReporte = 'No se pudo cargar el reporte. Intente nuevamente.';
      this.swbotones = false;
    } finally {
      this.swcalculando = false;
      this.s_loading.hideLoading();
    }

  }

  //Muestra cada reporte
  async imprime() {
    // this.sw1 = false;
    this.swbotones = false;
    this.swcalculando = false;
    this.txtcalculando = 'Calculando';
    switch (this.opcreporte) {
      case 1: // Recaudación diaria - Resumen
        if (this.swimprimir) this.imprimirResumen();
        else await this.exportarResumen();
        break;
      case 2: // Recaudación diaria - Planillas
        if (this.swimprimir) this.imprimirFacturas();
        else await this.exportarFacturas();
        break;
      case 3:
        this.otrapagina = null;
        break;
      case 4:
        this.otrapagina = null;
        break
      case 5:
        this.otrapagina = null;
        break;
      default:
    }
  }

  imprimirResumen() {
    this.otrapagina = this.formImprimir.value.otrapagina;
    let m_izquierda = 40;
    let doc = new jsPDF();
    doc.setFont('times', 'bold');
    doc.setFontSize(11);
    //doc.text('EpmapaT', m_izquierda, 10);
    doc.setFont('times', 'bold');
    doc.setFontSize(10);
    /* doc.text(
        'RESUMEN RECAUDACIÓN DIARIA: ' + this.formImprimir.value.fecha,
        m_izquierda,
        16
      ); */
    this._pdf.header(
      'RESUMEN RECAUDACIÓN: ' +
      this.formImprimir.value.d_fecha +
      ' - ' +
      this.formImprimir.value.h_fecha,
      doc
    );

    const resumen = this.construirFilasResumenExcel(this.formImprimir.value.d_fecha);
    const datos: any = resumen.filas.map(fila => fila.map((v, i) => i === 2 && typeof v === 'number' ? formatNumber(v) : v));
    this.total = resumen.totalGeneral;
    let i = 0;
    const iva1 = resumen.ivaActual;
    const iva2 = resumen.ivaAnterior;
    let kont = datos.length;

    autoTable(doc, {
      head: [['Nro.', 'Rubro', 'Total Recaudado']],
      theme: 'grid',
      headStyles: {
        fillColor: [68, 103, 114],
        fontStyle: 'bold',
        halign: 'center',
      },
      styles: {
        font: 'helvetica',
        fontSize: 11,
        cellPadding: 1,
        halign: 'center',
      },

      columnStyles: {
        0: { halign: 'center', cellWidth: 20 },
        1: { halign: 'left', cellWidth: 100 },
        2: { halign: 'right', cellWidth: 25 },
      },
      margin: { left: m_izquierda - 1, top: 18, right: 51, bottom: 13 },
      body: datos,
      didParseCell: function (data) {
        // Cambia el estilo de toda la fila a negrita
        if (data.cell.raw === '' && data.column.index === 0) {
          Object.values(data.row.cells).forEach(function (cell) {
            cell.styles.fontStyle = 'bold';
          });
        }
      },
    });

    //Segunda Tabla: Totales por Formas de Cobro
    const formascobro: any = [];
    let suma2: number = 0;
    i = 0;
    this._formacobro.forEach(() => {
      let totalRecaudado = Math.round(this._formacobro[i][1] * 100) / 100;
      formascobro.push([this._formacobro[i][0], formatNumber(totalRecaudado)]);
      suma2 = sumarCaja([suma2,totalRecaudado]);
      i++;
    });
    formascobro.push(['SUBTOTAL', formatNumber(suma2)]);
    formascobro.push(['IVA', formatNumber(iva1 + iva2)]);
    formascobro.push([
      'TOTAL',
      formatNumber(+suma2.toFixed(2) + +iva1.toFixed(2) + +iva2.toFixed(2)),
    ]);
    autoTable(doc, {
      head: [['Forma Cobro', 'Total Recaudado']],
      theme: 'grid',
      headStyles: {
        fillColor: [68, 103, 114],
        fontStyle: 'bold',
        halign: 'center',
      },
      styles: {
        font: 'helvetica',
        fontSize: 11,
        cellPadding: 1,
        halign: 'center',
      },
      columnStyles: {
        0: { halign: 'left', cellWidth: 60 },
        1: { halign: 'right', cellWidth: 60 },
      },
      margin: { left: m_izquierda - 1, top: kont + 10, right: 111, bottom: 13 },
      body: formascobro,

      didParseCell: function (data) {
        var fila = data.row.index;
        if (fila === formascobro.length - 1) {
          data.cell.styles.fontStyle = 'bold';
        }
      },
    });

    autoTable(doc, {
      styles: {
        font: 'helvetica',
        fontSize: 11,
        cellPadding: 1,
        halign: 'center',
      },
      body: [[this.nombreUsuario]],
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

    addPageNumbers();
    this.agregarPieAuditoria(doc);

    this.muestraPDF(doc);
  }

  imprimirFacturas() {
    this.otrapagina = this.formImprimir.value.otrapagina;
    let m_izquierda = 20;
    let doc = new jsPDF();
    doc.setFont('times', 'bold');
    doc.setFontSize(16);
    //doc.text('EpmapaT', m_izquierda, 10);
    doc.setFont('times', 'bold');
    doc.setFontSize(12);
    /* doc.text(
        'RECAUDACIÓN DIARIA - PLANILLAS: ' + this.formImprimir.value.fecha,
        m_izquierda,
        16
      ); */
    this._pdf.header(
      'RECAUDACIÓN - PLANILLAS: ' +
      this.formImprimir.value.d_fecha +
      ' - ' +
      this.formImprimir.value.h_fecha,
      doc
    );
    const datos: any = [];
    let suma: number = 0;
    var i = 0;
    this._cobradas.forEach(() => {
      let totalPorFormaCobro = totalPlanillaCaja(this._cobradas[i]);

      //  Math.round((this._cobradas[i][1] + this._cobradas[i][0].swiva) * 100) / 100;
      datos.push([
        this._cobradas[i][0].idfactura,
        this._cobradas[i][0].feccrea,
        this._cobradas[i][0].nrofactura,
        this._cobradas[i][0].formapago,
        this._cobradas[i][0].idcliente.nombre,
        formatNumber(totalPorFormaCobro),
      ]);
      suma = sumarCaja([suma, totalPorFormaCobro]);
      i++;
    });
    this.sumtotaltarifa = suma;
    datos.push(['', 'TOTAL', i, '', '', this.sumtotaltarifa.toFixed(2)]);

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

    autoTable(doc, {
      head: [['Nro', 'Fecha', 'Factura', 'F.Cob', 'Cliente', 'Valor']],
      theme: 'grid',
      headStyles: {
        fillColor: [68, 103, 114],
        fontStyle: 'bold',
        halign: 'center',
      },
      styles: {
        font: 'helvetica',
        fontSize: 9,
        cellPadding: 1,
        halign: 'center',
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 15 },
        1: { halign: 'center', cellWidth: 20 },
        2: { halign: 'center', cellWidth: 34 },
        3: { halign: 'center', cellWidth: 15 },
        4: { halign: 'left', cellWidth: 75 },
        5: { halign: 'right', cellWidth: 15 },
      },
      margin: { left: m_izquierda - 1, top: 18, right: 21, bottom: 13 },
      body: datos,
      didParseCell: function (data) {
        var fila = data.row.index;
        var columna = data.column.index;
        if (fila === datos.length - 1) {
          data.cell.styles.fontStyle = 'bold';
        }
      },
    });
    autoTable(doc, {
      styles: {
        font: 'helvetica',
        fontSize: 11,
        cellPadding: 1,
        halign: 'center',
      },
      body: [[this.nombreUsuario]],
    });

    addPageNumbers();
    this.agregarPieAuditoria(doc);

    this.muestraPDF(doc);
  }

  imprimirCajas() {
    this.otrapagina = this.formImprimir.value.otrapagina;
    let m_izquierda = 24;
    var doc = new jsPDF('p', 'pt', 'a4');
    doc.setFont('times', 'bold');
    doc.setFontSize(16);
    //doc.text('EpmapaT', m_izquierda, 10);
    doc.setFont('times', 'bold');
    doc.setFontSize(12);
    //doc.text('LISTA DE CAJAS', m_izquierda, 16);
    this._pdf.header('LISTA DE CAJAS', doc);
    var datos: any = [];
    let suma: number = 0;
    let arecaudar: number = 0;
    var i = 0;
    this._cajas.forEach(() => {
      datos.push([
        this._cajas[i].idptoemision_ptoemision.establecimiento,
        this._cajas[i].codigo,
        this._cajas[i].descripcion,
      ]);
      i++;
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

    autoTable(doc, {
      head: [['Establecimiento', 'Pto.Emisión', 'Nombre']],
      theme: 'grid',
      headStyles: {
        fillColor: [68, 103, 114],
        fontStyle: 'bold',
        halign: 'center',
      },
      styles: {
        font: 'helvetica',
        fontSize: 11,
        cellPadding: 1,
        halign: 'center',
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 92 },
        1: { halign: 'center', cellWidth: 80 },
        2: { halign: 'left', cellWidth: 230 },
      },
      margin: { left: m_izquierda - 1, top: 18, right: 71, bottom: 13 },
      body: datos,

      didParseCell: function (data) {
        var fila = data.row.index;
        var columna = data.column.index;
        if (columna > 0 && typeof data.cell.raw === 'number') {
          data.cell.text = [data.cell.raw.toLocaleString('en-US')];
        }
      },
    });
    addPageNumbers();
    this.agregarPieAuditoria(doc);

    this.muestraPDF(doc);
  }

  muestraPDF(doc: any) {
    var opciones = {
      filename: this.formImprimir.value.reporte,
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    };

    if (this.otrapagina) {
      const blob = doc.output('blob');
      const url = URL.createObjectURL(blob);
      const ventana = window.open(url, '_blank');

      if (ventana) {
        ventana.addEventListener('unload', () => URL.revokeObjectURL(url));
      }
    } else {
      const pdfBlob = doc.output('blob');
      const blobUrl = URL.createObjectURL(pdfBlob);
      const pdfViewer = document.getElementById('pdfViewer') as HTMLIFrameElement;
      if (pdfViewer) {
        if (pdfViewer.src?.startsWith('blob:')) {
          URL.revokeObjectURL(pdfViewer.src);
        }
        pdfViewer.src = blobUrl;
      } else {
        window.open(blobUrl, '_blank');
      }
    }
  }

  private agregarPieAuditoria(doc: any): void {
    const momentoImpresion = new Date();
    const fechaHora = `${momentoImpresion.toLocaleDateString('es-EC')} ${momentoImpresion.toLocaleTimeString('es-EC', {
      hour12: false,
    })}`;
    const usuario = this.authService.alias || `Usuario ${this.authService.idusuario}`;
    const pie = `Impreso el: ${fechaHora} | Usuario: ${usuario}`;
    const totalPaginas = doc.internal.pages.length - 1;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    for (let pagina = 1; pagina <= totalPaginas; pagina++) {
      doc.setPage(pagina);
      doc.text(pie, doc.internal.pageSize.getWidth() / 2, doc.internal.pageSize.height - 16, {
        align: 'center',
      });
    }
    doc.setTextColor(0, 0, 0);
  }

  private async guardarExcel(crearLibro: () => import('exceljs').Workbook) {
    this.errorReporte = '';
    this.swcalculando = true; this.swbotones = true;
    try { await descargarExcelCaja(crearLibro(), this.formImprimir.value.nombrearchivo); }
    catch { this.errorReporte = 'No se pudo descargar el archivo Excel. Intente nuevamente.'; }
    finally { this.swcalculando = false; this.swbotones = false; }
  }

  async exportarResumen() {
    await this.guardarExcel(() => excelResumenCaja(this._cobradas, this._rubrosanterior, this._formacobro,
      this.formImprimir.value.d_fecha, 'Resumen recaudacion ' + this.formImprimir.value.d_fecha + ' - ' + this.formImprimir.value.h_fecha + ' | ' + (this.nombreUsuario || '')));
  }
  async exportarFacturas() {
    await this.guardarExcel(() => excelPlanillasCaja(this._cobradas,
      'Recaudacion - Planillas ' + this.formImprimir.value.d_fecha + ' - ' + this.formImprimir.value.h_fecha + ' | ' + (this.nombreUsuario || '')));
  }
  async exportarCajas() { await this.guardarExcel(() => excelListaCajas(this._cajas)); }

  retornar() {
    this.router.navigate(['/cajas']);
  }

  private getExtensionSeleccionada(): string {
    return (this.formImprimir.value.extencion || 'pdf').toString().trim().toLowerCase();
  }

  usaVistaPreviaPdf(): boolean {
    return this.getExtensionSeleccionada() === 'pdf';
  }

  private procesarRespuestaReporte(reporte: Blob, reportName: string): void {
    const extension = this.getExtensionSeleccionada();
    const mimeType = this.getMimeType(extension);
    const file = new Blob([reporte], { type: mimeType });

    if (extension === 'pdf') {
      setTimeout(() => {
        const fileURL = URL.createObjectURL(file);
        const pdfViewer = document.getElementById('pdfViewer') as HTMLIFrameElement;

        if (pdfViewer) {
          if (pdfViewer.src?.startsWith('blob:')) {
            URL.revokeObjectURL(pdfViewer.src);
          }
          pdfViewer.src = fileURL;
        }
      }, 300);
      return;
    }

    saveAs(file, `${reportName}.${extension}`);
  }

  private getMimeType(extension: string): string {
    switch (extension) {
      case 'pdf':
        return 'application/pdf';
      case 'xml':
        return 'application/xml';
      case 'xlsx':
        return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      case 'csv':
        return 'text/csv';
      default:
        return 'application/octet-stream';
    }
  }
}
function formatNumber(num: number) {
  return num.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
}



