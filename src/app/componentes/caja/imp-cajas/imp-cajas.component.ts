import { firstValueFrom } from 'rxjs';
import { descargarExcelCaja, excelListaCajas, excelPlanillasCaja, excelResumenCaja, excelTransferenciasCaja, excelTransferenciasGlobalCaja, resumenCaja, totalPlanillaCaja, totalTransferenciaCaja, sumarCaja, monedaCaja } from 'src/app/servicios/caja-reporte-excel';
﻿import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { CajaService } from 'src/app/servicios/caja.service';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FacturaService } from 'src/app/servicios/factura.service';
import { RubroxfacService } from 'src/app/servicios/rubroxfac.service';
import { PdfService } from 'src/app/servicios/pdf.service';
import { saveAs } from 'file-saver';
import { JasperReportService } from 'src/app/servicios/jasper-report.service';
import { LoadingService } from 'src/app/servicios/loading.service';
import { Time } from '@angular/common';

@Component({
  selector: 'app-imp-cajas',
  templateUrl: './imp-cajas.component.html',
  styleUrls: ['./imp-cajas.component.css'],
})
export class ImpCajasComponent implements OnInit {
  readonly extensionesReporte = ['pdf', 'xml', 'xlsx', 'csv'];
  swimprimir: boolean = true;
  formImprimir: FormGroup;
  opcreporte: number = 1;
  otrapagina: boolean = false;
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
  _transferidas: any;
  _p_transferidas: any;
  _np_transferidas: any;
  idusuario: number = this.authService.idusuario;
  constructor(
    public authService: AutorizaService,
    public fb: FormBuilder,
    private router: Router,
    private cajService: CajaService,
    private facService: FacturaService,
    private rxfService: RubroxfacService,
    private _pdf: PdfService,
    private jrService: JasperReportService,
    private s_loading: LoadingService,
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
      fecha: strfecha,
      hasta: '2023-12-31',
      nombrearchivo: ['', [Validators.required, Validators.minLength(3)]],
      otrapagina: '',
      horad: '07:30',
      horah: '16:30'
    });
  }

  private getLocalDate(): string {
    const fecha = new Date();
    const offset = fecha.getTimezoneOffset();
    const local = new Date(fecha.getTime() - offset * 60000);
    return local.toISOString().slice(0, 10);
  }

  private getTotalResumen(rubro: any): number {
    const total = Number(rubro?.[2] ?? 0);
    return Number.isFinite(total) ? total : 0;
  }

  private debeMostrarRubroResumen(rubro: any): boolean {
    return Math.abs(this.getTotalResumen(rubro)) > 0;
  }

  private calcularIvaResumen(rubro: any, fechaCorte: string): number {
    const totalRecaudado = this.getTotalResumen(rubro);
    if (rubro?.[3] !== true || totalRecaudado === 0) {
      return 0;
    }
    return totalRecaudado * (fechaCorte >= '2024-04-01' ? 0.15 : 0.12);
  }

  private construirFilasResumenExcel(fecha: string) {
    return resumenCaja(this._cobradas, this._rubrosanterior, fecha);
  }

  private getTotalFacturaExportacion(factura: any): number {
    return totalPlanillaCaja(factura);
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
    this.formImprimir.patchValue({
      horad: '07:30',
      horah: '16:30'
    });
  }

  impriexpor() {
    this.swimprimir = !this.swimprimir;
    this.formImprimir.patchValue({ extencion: this.swimprimir ? 'pdf' : 'xlsx' });
    this.swbotones = false;
  }
  _imprimir() {
    this.facService
      .reporteFacturas(
        this.formImprimir.value.d_fecha,
        this.formImprimir.value.h_fecha
      )
      .subscribe({
        next: (datos) => {
          const blob = new Blob([datos], { type: 'application/pdf' });
          saveAs(blob, 'report.pdf');
        },
      });
  }
  //Recupera los datos de cada reporte
  async imprimir() {
    this.errorReporte = '';
    this.opcreporte = Number(this.formImprimir.value.reporte);
    this.swbotones = true;
    this.swcalculando = true;
    let d_fecha = this.formImprimir.value.d_fecha;
    let h_fecha = this.formImprimir.value.h_fecha;
    let fecha = this.formImprimir.value.fecha;
    let horad = this.formImprimir.value.horad;
    let horah = this.formImprimir.value.horah;
    let year: number = Number((this.opcreporte === 1 ? fecha : d_fecha).slice(0, 4));
    let hasta = `${year - 1}-12-31`;
    try {
    switch (this.opcreporte) {
      case 1: // Recaudación diaria - Resumen
        try {
          this._cobradas = await this.rxfService.getTotalRubrosActualAsync(
            fecha,
            hasta
          );
          try {
            this._rubrosanterior =
              await this.rxfService.getTotalRubrosAnteriorAsync(fecha, hasta);
            try {
              this._formacobro =
                await this.facService.totalFechaFormacobroAsync(fecha);
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
        try {
          this._cobradas = await this.facService.getByFechacobroTotAsync(fecha);
          await Promise.all(
            this._cobradas.map(async (item: any) => {
              item[0] = await this.facService.getByIdAsync(item.idfactura);
            })
          );
          // this.sw1 = true;
          this.swcalculando = false;
          if (this.swimprimir) this.txtcalculando = 'Mostrar';
          else this.txtcalculando = 'Descargar';
        } catch (error) {
          throw error;
        }
        break;
      case 4: // Recaudación diaria - Resumen
        /*         this.facService
                  .reporteFacturasRubros(
                    this.formImprimir.value.d_fecha,
                    this.formImprimir.value.h_fecha,
                    this.formImprimir.value.hasta
                  )
                  .subscribe({
                    next: (datos) => {
                      const blob = new Blob([datos], { type: 'application/pdf' });
                      saveAs(
                        blob,
                        `ReporteFacturasRubros_${new Date().toDateString()}.pdf`
                      );
                    },
                  });
         */
        try {
          this._cobradas =
            await this.rxfService.getTotalRubrosActualRangosAsync(
              d_fecha,
              h_fecha,
              hasta
            );
          try {
            this._rubrosanterior =
              await this.rxfService.getTotalRubrosAnteriorRangosAsync(
                d_fecha,
                h_fecha,
                hasta
              );
            try {
              this._formacobro =
                await this.facService.totalFechaFormacobroRangosAsync(
                  d_fecha,
                  h_fecha
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
      case 5: // Recaudación diaria - Planillas
        /*         this.facService
                  .reporteFacturas(
                    this.formImprimir.value.d_fecha,
                    this.formImprimir.value.h_fecha
                  )
                  .subscribe({
                    next: (datos) => {
                      const blob = new Blob([datos], { type: 'application/pdf' });
                      saveAs(blob, `ReporteFacturas_${new Date().toDateString()}.pdf`);
                    },
                  });
         */
        try {
          this._cobradas = await this.facService.getByFechacobroTotRangosAsync(
            d_fecha,
            h_fecha
          );
          await Promise.all(
            this._cobradas.map(async (item: any) => {
              item[0] = await this.facService.getByIdAsync(item.idfactura);
            })
          );
          // this.sw1 = true;
          this.swcalculando = false;
          if (this.swimprimir) this.txtcalculando = 'Mostrar';
          else this.txtcalculando = 'Descargar';
        } catch (error) {
          throw error;
        }
        break;
      case 3: // Lista de cajas
        this._cajas = await firstValueFrom(this.cajService.getListaCaja());
        this.txtcalculando = this.swimprimir ? 'Mostrar' : 'Descargar';
        break;
      case 6:
        try {
          this._cobradas = await this.facService.transferenciasCobradas(
            d_fecha,
            h_fecha
          );
          // this.sw1 = true;
          this.swcalculando = false;
          if (this.swimprimir) this.txtcalculando = 'Mostrar';
          else this.txtcalculando = 'Descargar';
        } catch (error) {
          throw error;
        }
        break;
      case 7:
        try {
          this._transferidas = await this.facService.getFacAllTransferidas(
            d_fecha,
            h_fecha
          );
          this._p_transferidas =
            await this.facService.getFacPagadasTransferidas(d_fecha, h_fecha);
          this._np_transferidas =
            await this.facService.getFacNoPagadasTransferidas(d_fecha, h_fecha);
          this.swcalculando = false;
          if (this.swimprimir) this.txtcalculando = 'Mostrar';
          else this.txtcalculando = 'Descargar';
        } catch (error) {
          throw error;
        }
        break;
      case 8:
        this.s_loading.showLoading();
        let data: any = {
          "reportName": "FacturasCobradas",
          "parameters": {
            "desde": d_fecha,
            "hasta": h_fecha,
            "idusuario": this.authService.idusuario
          },
          "extencion": this.getExtensionSeleccionada()
        }
          ;

        let reporte = await this.jrService.getReporte(data);
        this.procesarRespuestaReporte(reporte, data.reportName);
        this.swcalculando = false;
        if (this.swimprimir) this.txtcalculando = 'Mostrar';
        else this.txtcalculando = 'Descargar';
        this.s_loading.hideLoading();
        break;
      case 9:
        this.s_loading.showLoading();
        let body: any = {
          "reportName": "RubrosCobrados",
          "parameters": {
            "desde": d_fecha,
            "hasta": h_fecha,
            "tope": hasta,
            "idusuario": this.authService.idusuario
          },
          "extencion": this.getExtensionSeleccionada()
        }
          ;

        let _reporte: any = await this.jrService.getReporte(body);
        this.procesarRespuestaReporte(_reporte, body.reportName);
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
      case 4: // Recaudación diaria - Resumen
        this.formImprimir.patchValue({ fecha: this.formImprimir.value.d_fecha }, { emitEvent: false });
        if (this.swimprimir) this.imprimirResumen();
        else await this.exportarResumen();
        break;
      case 5: // Recaudación diaria - Planillas
        if (this.swimprimir) this.imprimirFacturas();
        else await this.exportarFacturas();
        break;
      case 6: // Recaudación diaria - Planillas
        if (this.swimprimir) this.imprimirTransferenciasCobradas();
        else await this.exportarTransferenciasCobradas();
        break;
      case 7:
        if (this.swimprimir) this.imprimirTransferenciasGlobal();
        else await this.exportarTransferenciasGlobal();
        break;
      case 3: //Lista de Cajas
        if (this.swimprimir) this.imprimirCajas();
        else await this.exportarCajas();
        break;
      default:
    }
  }

  imprimirResumen() {
    this.otrapagina = this.formImprimir.value.otrapagina;
    let m_izquierda = 40;
    let doc = new jsPDF();
    doc.setFont('times', 'bold');
    doc.setFontSize(16);
    doc.text('EpmapaT', m_izquierda, 10);
    doc.setFont('times', 'bold');
    doc.setFontSize(12);
    doc.text(
      'RESUMEN RECAUDACIÓN DIARIA: ' + this.formImprimir.value.fecha,
      m_izquierda,
      16
    );
    this._pdf.header(
      'RESUMEN RECAUDACIÓN DIARIA: ' + this.formImprimir.value.fecha,
      doc
    );
    const resumen = this.construirFilasResumenExcel((this.opcreporte === 4 ? this.formImprimir.value.d_fecha : this.formImprimir.value.fecha));
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
        fontSize: 8,
        cellPadding: 1,
        halign: 'center',
      },

      columnStyles: {
        0: { halign: 'right', cellWidth: 10 },
        1: { halign: 'left', cellWidth: 80 },
        2: { halign: 'right', cellWidth: 30 },
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
    let iva: number = 0;
    if (iva1 + iva2 !== 0) {
      iva = +iva1.toFixed(2) + +iva2.toFixed(2);
      formascobro.push(['SUBTOTAL', formatNumber(suma2)]);
      formascobro.push(['IVA', formatNumber(iva)]);
    }
    formascobro.push(['TOTAL', formatNumber(sumarCaja([suma2, iva]))]);

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
        fontSize: 8,
        cellPadding: 1,
        halign: 'center',
      },
      columnStyles: {
        0: { halign: 'left', cellWidth: 30 },
        1: { halign: 'right', cellWidth: 30 },
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
    let m_izquierda = 50;
    let doc = new jsPDF();
    doc.setFont('times', 'bold');
    doc.setFontSize(16);
    doc.text('EpmapaT', m_izquierda, 10);
    doc.setFont('times', 'bold');
    doc.setFontSize(12);
    doc.text(
      'RECAUDACIÓN DIARIA - PLANILLAS: ' + this.formImprimir.value.fecha,
      m_izquierda,
      16
    );

    const datos: any = [];
    let suma: number = 0;
    let i = 0;
    this._cobradas.forEach((item: any) => {
      const factura = item?.[0];
      if (!factura) {
        console.warn('No se encontró la factura para el reporte:', item?.idfactura);
        return;
      }

      const totalPorFormaCobro = totalPlanillaCaja(item);
      datos.push([
        factura.idfactura,
        factura.feccrea,
        factura.nrofactura,
        factura.formapago,
        formatNumber(totalPorFormaCobro),
      ]);
      suma = sumarCaja([suma, totalPorFormaCobro]);
      i++;
    });
    this.sumtotaltarifa = suma;
    datos.push(['', 'TOTAL', i, '', this.sumtotaltarifa.toFixed(2)]);

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
      head: [['Nro', 'Fecha', 'Factura', 'F.Cob', 'Valor']],
      theme: 'grid',
      headStyles: {
        fillColor: [68, 103, 114],
        fontStyle: 'bold',
        halign: 'center',
      },
      styles: {
        font: 'helvetica',
        fontSize: 8,
        cellPadding: 1,
        halign: 'center',
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 16 },
        1: { halign: 'center', cellWidth: 18 },
        2: { halign: 'center', cellWidth: 29 },
        3: { halign: 'center', cellWidth: 12 },
        // 4: { halign: 'left', cellWidth: 75 },
        4: { halign: 'right', cellWidth: 20 },
      },
      margin: { left: m_izquierda - 1, top: 18, right: 66, bottom: 13 },
      body: datos,
      didParseCell: function (data) {
        var fila = data.row.index;
        var columna = data.column.index;
        if (fila === datos.length - 1) {
          data.cell.styles.fontStyle = 'bold';
        }
      },
    });

    addPageNumbers();
    this.agregarPieAuditoria(doc);

    this.muestraPDF(doc);
  }
  imprimirResumenRangos() {
    this.otrapagina = this.formImprimir.value.otrapagina;
    let m_izquierda = 40;
    let doc = new jsPDF();
    doc.setFont('times', 'bold');
    doc.setFontSize(16);
    doc.text('EpmapaT', m_izquierda, 10);
    doc.setFont('times', 'bold');
    doc.setFontSize(12);
    doc.text(
      'RESUMEN RECAUDACIÓN DIARIA: ' + this.formImprimir.value.fecha,
      m_izquierda,
      16
    );
    const datos: any = [];
    this.total = 0;
    let kont = 1; //Para la fila de la segunda Tabla
    let suma: number = 0;
    datos.push(['', 'PERÍODO ACTUAL']);
    let i = 0;
    let iva1 = 0;
    this._cobradas.forEach(() => {
      let totalRecaudado = this.getTotalResumen(this._cobradas[i]);
      if (!this.debeMostrarRubroResumen(this._cobradas[i])) {
        i++;
        return;
      }
      // Math.round(this._cobradas[i][2] * 100) / 100;
      if (
        this._cobradas[i][3] === true &&
        this.formImprimir.value.fecha >= '2024-04-01' === true
      ) {
        iva1 += totalRecaudado * 0.15;
      }
      if (
        this._cobradas[i][3] === true &&
        this.formImprimir.value.fecha < '2024-04-01' === true
      ) {
        iva1 += totalRecaudado * 0.12;
      }
      datos.push([
        this._cobradas[i][0],
        this._cobradas[i][1],
        formatNumber(totalRecaudado),
      ]);

      suma += totalRecaudado;
      i++;
    });
    kont = kont + i;
    this.total += suma + iva1;
    if (iva1 > 0) {
      datos.push(['', 'IVA', formatNumber(iva1)]);
    }
    datos.push(['', 'SUBTOTAL', formatNumber(+suma.toFixed(2) + iva1)]);

    let suma1 = 0;
    let iva2 = 0;
    i = 0;
    datos.push(['', 'PERÍODOS ANTERIORES']);
    this._rubrosanterior.forEach(() => {
      if (this.debeMostrarRubroResumen(this._rubrosanterior[i])) {
        let totalRecaudado = this.getTotalResumen(this._rubrosanterior[i]);
        //Math.round(this._rubrosanterior[i][2] * 100) / 100;
        if (
          this._rubrosanterior[i][3] === true &&
          this.formImprimir.value.fecha >= '2024-04-01' === true
        ) {
          iva2 += totalRecaudado * 0.15;
        }
        if (
          this._rubrosanterior[i][3] === true &&
          this.formImprimir.value.fecha < '2024-04-01' === true
        ) {
          iva2 += totalRecaudado * 0.12;
        }
        datos.push([
          this._rubrosanterior[i][0],
          this._rubrosanterior[i][1],
          formatNumber(totalRecaudado),
        ]);
        suma1 += totalRecaudado;
      }
      i++;
    });
    kont = kont + i;
    this.total += suma1 + iva2;
    if (iva1 > 0) {
      datos.push(['', 'IVA', formatNumber(iva2)]);
    }
    datos.push(['', 'SUBTOTAL', formatNumber(+suma1.toFixed(2) + iva2)]);
    // datos.push(['', 'TOTAL', this.total.toLocaleString("es-ES", { maximumFractionDigits: 2 })]);
    datos.push(['', 'TOTAL', formatNumber(this.total)]);
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
        fontSize: 8,
        cellPadding: 1,
        halign: 'center',
      },

      columnStyles: {
        0: { halign: 'right', cellWidth: 10 },
        1: { halign: 'left', cellWidth: 80 },
        2: { halign: 'right', cellWidth: 30 },
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
    if (iva1 + iva2 > 0) {
      formascobro.push(['SUBTOTAL', formatNumber(suma2)]);
      formascobro.push([
        'IVA',
        formatNumber(+iva1.toFixed(2) + +iva2.toFixed(2)),
      ]);
    }
    formascobro.push(['TOTAL', formatNumber(suma2 + iva1 + iva2)]);

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
        fontSize: 8,
        cellPadding: 1,
        halign: 'center',
      },
      columnStyles: {
        0: { halign: 'left', cellWidth: 30 },
        1: { halign: 'right', cellWidth: 30 },
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

  imprimirFacturasRangos() {
    this.otrapagina = this.formImprimir.value.otrapagina;
    let m_izquierda = 50;
    let doc = new jsPDF();
    doc.setFont('times', 'bold');
    doc.setFontSize(16);
    doc.text('EpmapaT', m_izquierda, 10);
    doc.setFont('times', 'bold');
    doc.setFontSize(12);
    doc.text(
      'RECAUDACIÓN DIARIA - PLANILLAS: ' + this.formImprimir.value.fecha,
      m_izquierda,
      16
    );

    const datos: any = [];
    let suma: number = 0;
    var i = 0;
    this._cobradas.forEach(() => {
      let totalPorFormaCobro =
        +this._cobradas[i][1].toFixed(2) + this._cobradas[i][0].swiva;
      /*       Math.round( * 100) /
              100; */
      // datos.push([this._cobradas[i][0].idfactura, this._cobradas[i][0].feccrea, this._cobradas[i][0].nrofactura, this._cobradas[i][0].formapago,
      // this._cobradas[i][0].idcliente.nombre, formatNumber(totalPorFormaCobro)]);
      datos.push([
        this._cobradas[i][0].idfactura,
        this._cobradas[i][0].feccrea,
        this._cobradas[i][0].nrofactura,
        this._cobradas[i][0].formapago,
        formatNumber(totalPorFormaCobro),
      ]);
      suma = sumarCaja([suma, totalPorFormaCobro]);
      i++;
    });
    this.sumtotaltarifa = suma;
    datos.push([
      '',
      'TOTAL',
      i,
      '',
      this.sumtotaltarifa.toLocaleString('es-ES', { maximumFractionDigits: 2 }),
    ]);

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
      head: [['Nro', 'Fecha', 'Factura', 'F.Cob', 'Valor']],
      theme: 'grid',
      headStyles: {
        fillColor: [68, 103, 114],
        fontStyle: 'bold',
        halign: 'center',
      },
      styles: {
        font: 'helvetica',
        fontSize: 8,
        cellPadding: 1,
        halign: 'center',
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 16 },
        1: { halign: 'center', cellWidth: 18 },
        2: { halign: 'center', cellWidth: 29 },
        3: { halign: 'center', cellWidth: 12 },
        // 4: { halign: 'left', cellWidth: 75 },
        4: { halign: 'right', cellWidth: 20 },
      },
      margin: { left: m_izquierda - 1, top: 18, right: 66, bottom: 13 },
      body: datos,
      didParseCell: function (data) {
        var fila = data.row.index;
        var columna = data.column.index;
        if (fila === datos.length - 1) {
          data.cell.styles.fontStyle = 'bold';
        }
      },
    });

    addPageNumbers();
    this.agregarPieAuditoria(doc);

    this.muestraPDF(doc);
  }

  imprimirCajas() {
    this.otrapagina = this.formImprimir.value.otrapagina;
    let m_izquierda = 24;
    var doc = new jsPDF();
    doc.setFont('times', 'bold');
    doc.setFontSize(16);
    doc.text('EpmapaT', m_izquierda, 10);
    doc.setFont('times', 'bold');
    doc.setFontSize(12);
    doc.text('LISTA DE CAJAS', m_izquierda, 16);
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
        fontSize: 8,
        cellPadding: 1,
        halign: 'center',
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 26 },
        1: { halign: 'center', cellWidth: 20 },
        2: { halign: 'left', cellWidth: 70 },
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
  imprimirTransferenciasCobradas() {
    this.otrapagina = this.formImprimir.value.otrapagina;
    let m_izquierda = 50;
    let doc = new jsPDF();
    doc.setFont('times', 'bold');
    doc.setFontSize(16);
    doc.text('EpmapaT', m_izquierda, 10);
    doc.setFont('times', 'bold');
    doc.setFontSize(12);
    doc.text(
      'RECAUDACIÓN DIARIA - PLANILLAS: ' +
      this.formImprimir.value.d_fecha +
      ' / ' +
      this.formImprimir.value.h_fecha,
      m_izquierda,
      16
    );

    const datos: any = [];
    let suma: number = 0;
    var i = 0;
    this._cobradas.forEach(() => {
      let totalPorFormaCobro = totalTransferenciaCaja(this._cobradas[i]);
      /*       Math.round( * 100) /
              100; */
      // datos.push([this._cobradas[i][0].idfactura, this._cobradas[i][0].feccrea, this._cobradas[i][0].nrofactura, this._cobradas[i][0].formapago,
      // this._cobradas[i][0].idcliente.nombre, formatNumber(totalPorFormaCobro)]);
      datos.push([
        this._cobradas[i].idfactura,
        this._cobradas[i].nombre,
        this._cobradas[i].cedula,
        this._cobradas[i].fechatransferencia,
        this._cobradas[i].nrofactura,
        this._cobradas[i].formapago,
        formatNumber(totalPorFormaCobro),
      ]);
      suma = sumarCaja([suma, totalPorFormaCobro]);
      i++;
    });
    this.sumtotaltarifa = suma;
    datos.push(['', 'TOTAL', i, '', '', '', formatNumber(this.sumtotaltarifa)]);

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
      head: [['Nro', 'Nom. Cliente', 'Identificación', 'Fecha', 'Factura', 'F.Cob', 'Valor']],
      theme: 'grid',
      headStyles: {
        fillColor: [68, 103, 114],
        fontStyle: 'bold',
        halign: 'center',
      },
      styles: {
        font: 'helvetica',
        fontSize: 8,
        cellPadding: 1,
        halign: 'center',
      },
      /*       columnStyles: {
              0: { halign: 'center', cellWidth: 16 },
              1: { halign: 'center', cellWidth: 18 },
              2: { halign: 'center', cellWidth: 29 },
              3: { halign: 'center', cellWidth: 12 },
              // 4: { halign: 'left', cellWidth: 75 },
              4: { halign: 'right', cellWidth: 20 },
            }, */
      margin: { top: 18, bottom: 13 },
      body: datos,
      didParseCell: function (data) {
        var fila = data.row.index;
        var columna = data.column.index;
        if (fila === datos.length - 1) {
          data.cell.styles.fontStyle = 'bold';
        }
      },
    });

    addPageNumbers();
    this.agregarPieAuditoria(doc);

    this.muestraPDF(doc);
  }
  async imprimirTransferenciasGlobal() {
    let doc = new jsPDF();
    let heder1: any = [
      ['TRANSFERENCIAS EMITIDAS'],
      ['Planilla', 'NroFactura', 'Cliente', 'F. transferencia', 'Modulo', 'total'],
    ];
    let heder2: any = [
      ['TRANSFERENCIAS COBRADAS'],
      ['Planilla', 'Cliente', 'F. transferencia', 'Modulo', 'total'],
    ];
    let heder3: any = [
      ['TRANSFERENCIAS POR COBRAR'],
      ['Planilla', 'Cliente', 'F. transferencia', 'Modulo', 'total'],
    ];
    let suma1 = 0;
    let suma2 = 0;
    let suma3 = 0;

    let body1: any = [];
    let body2: any = [];
    let body3: any = [];
    await this._transferidas.forEach((item: any) => {
      body1.push([
        item.idfactura,
        item.nrofactura,
        item.nombre,
        item.fechatransferencia,
        item.idmodulo,
        monedaCaja(item.total),
      ]);
      suma1 = sumarCaja([suma1, item.total]);
    });
    body1.push(['', '', 'TOTAL', '', '', suma1.toFixed(2)]);
    await this._p_transferidas.forEach((item: any) => {
      body2.push([
        item.idfactura,
        item.nombre,
        item.fechatransferencia,
        item.idmodulo,
        monedaCaja(item.total),
      ]);
      suma2 = sumarCaja([suma2, item.total]);
    });
    body2.push(['', '', 'TOTAL', '', suma2.toFixed(2)]);
    await this._np_transferidas.forEach((item: any) => {
      body3.push([
        item.idfactura,
        item.nombre,
        item.fechatransferencia,
        item.idmodulo,
        monedaCaja(item.total),
      ]);
      suma3 = sumarCaja([suma3, item.total]);
    });
    body3.push(['', '', 'TOTAL', '', suma3.toFixed(2)]);
    this._pdf.bodyThreeTables(
      'Reporte de transferencias',
      heder1,
      body1,
      heder2,
      body2,
      heder3,
      body3,
      doc
    );
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

      // Libera memoria cuando la ventana se cierre
      if (ventana) {
        ventana.addEventListener('unload', () => URL.revokeObjectURL(url));
      }
    }
    else {
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
      doc.text(pie, 50, doc.internal.pageSize.height - 16);
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
      (this.opcreporte === 4 ? this.formImprimir.value.d_fecha : this.formImprimir.value.fecha), 'Resumen recaudacion ' + (this.opcreporte === 1 ? this.formImprimir.value.fecha : this.formImprimir.value.d_fecha + ' - ' + this.formImprimir.value.h_fecha)));
  }
  async exportarFacturas() {
    await this.guardarExcel(() => excelPlanillasCaja(this._cobradas,
      'Recaudacion - Planillas ' + (this.opcreporte === 2 ? this.formImprimir.value.fecha : this.formImprimir.value.d_fecha + ' - ' + this.formImprimir.value.h_fecha)));
  }
  async exportarCajas() { await this.guardarExcel(() => excelListaCajas(this._cajas)); }

  async exportarTransferenciasCobradas() {
    await this.guardarExcel(() => excelTransferenciasCaja(this._cobradas,
      'Transferencias cobradas ' + this.formImprimir.value.d_fecha + ' - ' + this.formImprimir.value.h_fecha));
  }
  async exportarTransferenciasGlobal() {
    await this.guardarExcel(() => excelTransferenciasGlobalCaja(this._transferidas, this._p_transferidas, this._np_transferidas,
      'Transferencias ' + this.formImprimir.value.d_fecha + ' - ' + this.formImprimir.value.h_fecha));
  }

  retornar() {
    this.router.navigate(['/cajas']);
  }
  getFacturaById(idfactura: number) {
    let factura = this.facService.getById(idfactura).toPromise();
    return factura;
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



