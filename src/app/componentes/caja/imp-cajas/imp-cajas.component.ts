import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { CajaService } from 'src/app/servicios/caja.service';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as ExcelJS from 'exceljs';
import { FacturaService } from 'src/app/servicios/factura.service';
import { RubroxfacService } from 'src/app/servicios/rubroxfac.service';
import { PdfService } from 'src/app/servicios/pdf.service';
import { saveAs } from 'file-saver';

@Component({
  selector: 'app-imp-cajas',
  templateUrl: './imp-cajas.component.html',
  styleUrls: ['./imp-cajas.component.css'],
})
export class ImpCajasComponent implements OnInit {
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
  swbotones: boolean = false;
  swcalculando: boolean = false;
  txtcalculando = 'Calculando';

  constructor(
    public authService: AutorizaService,
    public fb: FormBuilder,
    private router: Router,
    private cajService: CajaService,
    private facService: FacturaService,
    private rxfService: RubroxfacService,
    private _pdf: PdfService
  ) {}

  ngOnInit(): void {
    sessionStorage.setItem('ventana', '/cajas');
    let coloresJSON = sessionStorage.getItem('/cajas');
    if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));

    const fecha: Date = new Date();
    const strfecha = fecha.toISOString().slice(0, 10);
    this.formImprimir = this.fb.group({
      reporte: '1',
      d_fecha: strfecha,
      h_fecha: strfecha,
      fecha: strfecha,
      hasta: '2023-12-31',
      nombrearchivo: ['', [Validators.required, Validators.minLength(3)]],
      otrapagina: '',
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
  }

  impriexpor() {
    this.swimprimir = !this.swimprimir;
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
    this.swbotones = true;
    this.swcalculando = true;
    let d_fecha = this.formImprimir.value.d_fecha;
    let h_fecha = this.formImprimir.value.h_fecha;
    let fecha = this.formImprimir.value.fecha;
    let f: Date = new Date();
    let hasta = `${f.getFullYear() - 1}-12-31`;
    switch (this.opcreporte) {
      case 1: // Recaudacion diaria - Resumen
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
              console.error(
                'Error al obtener los totales por Forma de cobro:',
                error
              );
            }
          } catch (error) {
            console.error('Error al obtener los Rubros anteriores:', error);
          }
        } catch (error) {
          console.error('Error al obtener los Rubros actuales:', error);
        }
        break;
      case 2: // Recaudacion diaria - Planillas
        try {
          this._cobradas = await this.facService.getByFechacobroTotAsync(fecha);
          // this.sw1 = true;
          this.swcalculando = false;
          if (this.swimprimir) this.txtcalculando = 'Mostrar';
          else this.txtcalculando = 'Descargar';
        } catch (error) {
          console.error('Error al obtener las Planillas:', error);
        }
        break;
      case 4: // Recaudacion diaria - Resumen
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
              console.error(
                'Error al obtener los totales por Forma de cobro:',
                error
              );
            }
          } catch (error) {
            console.error('Error al obtener los Rubros anteriores:', error);
          }
        } catch (error) {
          console.error('Error al obtener los Rubros actuales:', error);
        }
        break;
      case 5: // Recaudacion diaria - Planillas
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
          // this.sw1 = true;
          this.swcalculando = false;
          if (this.swimprimir) this.txtcalculando = 'Mostrar';
          else this.txtcalculando = 'Descargar';
        } catch (error) {
          console.error('Error al obtener las Planillas:', error);
        }
        break;
      case 3: //Lista de Cajas
        this.cajService.getListaCaja().subscribe({
          next: (datos) => {
            this._cajas = datos;
            this.swcalculando = false;
            if (this.swimprimir) this.txtcalculando = 'Mostrar';
            else this.txtcalculando = 'Descargar';
          },
          error: (err) => console.error(err.error),
        });
        break;
      case 6:
        try {
          this._cobradas = this._cobradas =
            await this.facService.transferenciasCobradas(d_fecha, h_fecha);
          // this.sw1 = true;
          this.swcalculando = false;
          if (this.swimprimir) this.txtcalculando = 'Mostrar';
          else this.txtcalculando = 'Descargar';
        } catch (error) {
          console.error('Error al obtener las Planillas:', error);
        }
        break;
      default:
        break;
    }
  }
  imprime() {
    // this.sw1 = false;
    this.swbotones = false;
    this.swcalculando = false;
    this.txtcalculando = 'Calculando';
    switch (this.opcreporte) {
      case 1: // Recaudacion diaria - Resumen
        if (this.swimprimir) this.imprimirResumen();
        else this.exportarResumen();
        break;
      case 2: // Recaudacion diaria - Planillas
        if (this.swimprimir) this.imprimirFacturas();
        else this.exportarFacturas();
        break;
      case 4: // Recaudacion diaria - Resumen
        this.formImprimir.value.fecha = this.formImprimir.value.d_fecha;
        if (this.swimprimir) this.imprimirResumen();
        else this.exportarResumen();
        break;
      case 5: // Recaudacion diaria - Planillas
        if (this.swimprimir) this.imprimirFacturas();
        else this.exportarFacturas();
        break;
      case 6: // Recaudacion diaria - Planillas
        if (this.swimprimir) this.imprimirTransferenciasCobradas();
        else this.exportarFacturas();
        break;
      case 3: //Lista de Cajas
        if (this.swimprimir) this.imprimirCajas();
        else this.exportarCajas();
        break;
      default:
    }
  }

  async imprimirResumen() {
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
    this._cobradas.forEach((item: any) => {
      let totalRecaudado = this._cobradas[i][2];
      if (this._cobradas[i][0] != 165) {
        if (
          this._cobradas[i][3] === true &&
          this.formImprimir.value.fecha >= '2024-04-01'
        ) {
          iva1 += totalRecaudado * 0.15;
        }
        if (
          this._cobradas[i][3] === true &&
          this.formImprimir.value.fecha <= '2024-03-31'
        ) {
          iva1 += totalRecaudado * 0.12;
        }
        datos.push([
          this._cobradas[i][0],
          this._cobradas[i][1],
          formatNumber(totalRecaudado),
        ]);
        suma += totalRecaudado;
      }
      i++;
    });
    kont = kont + i;
    this.total += +suma.toFixed(2) + +iva1.toFixed(2);
    if (iva1 > 0) {
      datos.push(['', 'IVA', formatNumber(iva1)]);
    }
    datos.push(['', 'SUBTOTAL', +suma.toFixed(2) + +iva1.toFixed(2)]);

    let suma1 = 0;
    let iva2 = 0;
    i = 0;
    datos.push(['', 'PERÍODOS ANTERIORES']);
    await this._rubrosanterior.forEach(() => {
      if (this._rubrosanterior[i][0] != 165) {
        let totalRecaudado = this._rubrosanterior[i][2];
        //Math.round(this._rubrosanterior[i][2] * 100) / 100;
        if (
          this._rubrosanterior[i][3] === true &&
          this.formImprimir.value.fecha >= '2024-04-01' === true
        ) {
          iva2 += totalRecaudado * 0.15;
        }
        if (
          this._rubrosanterior[i][3] === true &&
          this.formImprimir.value.fecha <= '2024-03-31' === true
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
    this.total += +suma1.toFixed(2) + +iva2.toFixed(2);
    if (iva2 > 0) {
      datos.push(['', 'IVA', formatNumber(iva2)]);
    }
    datos.push(['', 'SUBTOTAL', +suma1.toFixed(2) + +iva2.toFixed(2)]);

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
      suma2 += totalRecaudado;
      i++;
    });
    let iva: number = 0;
    if (iva1 + iva2 > 0) {
      iva = +iva1.toFixed(2) + +iva2.toFixed(2);
      formascobro.push(['SUBTOTAL', formatNumber(suma2)]);
      formascobro.push(['IVA', formatNumber(iva)]);
    }
    formascobro.push(['TOTAL', formatNumber(suma2 + iva)]);

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
    var i = 0;
    this._cobradas.forEach((item: any) => {
      let totalPorFormaCobro =
        +this._cobradas[i][1] + +this._cobradas[i][0].swiva!;
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
      suma += +totalPorFormaCobro.toFixed(2);
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
      let totalRecaudado = this._cobradas[i][2];
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
      if (this._rubrosanterior[i][0] != 165) {
        let totalRecaudado = this._rubrosanterior[i][2];
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
      suma2 += totalRecaudado;
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
      suma += totalPorFormaCobro;
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
      head: [['Establecimiento', 'Pto.Emisón', 'Nombre']],
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
      'RECAUDACIÓN DIARIA - PLANILLAS: ' + this.formImprimir.value.fecha,
      m_izquierda,
      16
    );

    const datos: any = [];
    let suma: number = 0;
    var i = 0;
    this._cobradas.forEach(() => {
      let totalPorFormaCobro =
        this._cobradas[i][1] + this._cobradas[i][0].swiva;
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
      suma += totalPorFormaCobro;
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
    if (this.otrapagina) doc.output('dataurlnewwindow', opciones);
    else {
      const pdfDataUri = doc.output('datauristring');
      //Si ya existe el <embed> primero lo remueve
      const elementoExistente = document.getElementById('idembed');
      if (elementoExistente) {
        elementoExistente.remove();
      }
      //Crea el <embed>
      var embed = document.createElement('embed');
      embed.setAttribute('src', pdfDataUri);
      embed.setAttribute('type', 'application/pdf');
      embed.setAttribute('width', '70%');
      embed.setAttribute('height', '100%');
      embed.setAttribute('id', 'idembed');
      //Agrega el <embed> al contenedor del Modal
      var container: any;
      container = document.getElementById('pdf');
      container.appendChild(embed);
    }
  }

  exportarResumen() {
    this.nombrearchivo = this.formImprimir.value.nombrearchivo;
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(this.nombrearchivo);
    let titulo = 'Resumen recaudacion diaria ' + this.formImprimir.value.fecha;
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
    const cabecera = ['Nro', 'Rubro', 'Total Recaudado'];
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

    // Agrega los datos a la hoja de cálculo
    let i = 0;
    this._cobradas.forEach(() => {
      let totalRecaudado = Math.round(this._cobradas[i][2] * 100) / 100;
      const row = [this._cobradas[i][0], this._cobradas[i][1], totalRecaudado];
      worksheet.addRow(row);
      i++;
    });

    //Coloca la fila del Total
    worksheet.addRow(['', 'TOTAL']);
    worksheet.getCell('B' + (this._cobradas.length + 4).toString()).font = {
      bold: true,
    };

    let celdaC = worksheet.getCell(
      'C' + (this._cobradas.length + 4).toString()
    );
    celdaC.numFmt = '#,##0.00';
    celdaC.font = { bold: true };
    celdaC.value = {
      formula: 'SUM(C4:' + 'C' + (this._cobradas.length + 3).toString() + ')',
      result: 0,
      sharedFormula: undefined,
      date1904: false,
    };

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

    // Formato numérico
    // const numeroStyle = { numFmt: '#,##0' };
    // const columnsToFormat = [1 ];
    // for (let i = 4; i <= this._cobradas.length + 2; i++) {
    //    columnsToFormat.forEach(columnIndex => {
    //       const cell = worksheet.getCell(i, columnIndex);
    //       cell.style = numeroStyle;
    //    });
    // }

    // Formato numérico con decimales
    const numeroStyle1 = { numFmt: '#,##0.00' };
    const columnsToFormat1 = [3];
    for (let i = 4; i <= this._cobradas.length + 3; i++) {
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

  exportarFacturas() {
    this.nombrearchivo = this.formImprimir.value.nombrearchivo;
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(this.nombrearchivo);
    let titulo =
      'Recaudacion diaria - Planillas ' + this.formImprimir.value.fecha;
    worksheet.addRow(['', '', '', titulo]);
    // Celda D1
    const cellD1 = worksheet.getCell('D1');
    const customStyle = {
      font: {
        name: 'Times New Roman',
        bold: true,
        size: 14,
        color: { argb: '002060' },
      },
    };
    cellD1.font = customStyle.font;

    // Aplicar el estilo personalizado a los Títulos
    const cellC1 = worksheet.getCell('C1');
    cellC1.font = customStyle.font;

    worksheet.addRow([]);
    const cabecera = [
      'Nro',
      'Fecha',
      'Nro.Factura',
      'Cliente',
      'Sección',
      'Forma cobro',
      'Valor',
      'Estado',
    ];
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

    // Agrega los datos a la hoja de cálculo
    this._cobradas.forEach((factura: any) => {
      let total = factura[1];
      const row = [
        factura[0].idfactura,
        factura[0].feccrea,
        factura[0].nrofactura,
        factura[0].idcliente.nombre,
        factura[0].idmodulo.descripcion,
        factura[0].formapago,
        total,
        factura[0].estado,
      ];
      // const row = [factura[0].idfactura, total ];
      worksheet.addRow(row);
    });

    //Coloca la fila del Total
    worksheet.addRow(['', 'TOTAL']);
    worksheet.getCell('B' + (this._cobradas.length + 4).toString()).font = {
      bold: true,
    };

    let celdaG = worksheet.getCell(
      'G' + (this._cobradas.length + 4).toString()
    );
    celdaG.numFmt = '#,##0.00';
    celdaG.font = { bold: true };
    celdaG.value = {
      formula: 'SUM(G4:' + 'G' + (this._cobradas.length + 3).toString() + ')',
      result: 0,
      sharedFormula: undefined,
      date1904: false,
    };

    // Establece el ancho de las columnas
    const anchoConfig = [
      { columnIndex: 1, widthInChars: 12 },
      { columnIndex: 2, widthInChars: 16 },
      { columnIndex: 3, widthInChars: 20 },
      { columnIndex: 4, widthInChars: 50 },
      { columnIndex: 5, widthInChars: 25 },
      { columnIndex: 6, widthInChars: 18 },
      { columnIndex: 7, widthInChars: 18 },
    ];
    anchoConfig.forEach((config) => {
      worksheet.getColumn(config.columnIndex).width = config.widthInChars;
    });

    // Columnas centradas
    const columnsToCenter = [1, 2, 3, 6];
    columnsToCenter.forEach((columnIndex) => {
      worksheet
        .getColumn(columnIndex)
        .eachCell({ includeEmpty: true }, (cell) => {
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        });
    });
    // Columnas a la derecha
    let columnsToRigth = [7];
    columnsToRigth.forEach((columnIndex) => {
      worksheet
        .getColumn(columnIndex)
        .eachCell({ includeEmpty: true }, (cell) => {
          cell.alignment = { horizontal: 'right' };
        });
    });

    // Formato numérico
    // const numeroStyle = { numFmt: '#,##0' };
    // const columnsToFormat = [1 ];
    // for (let i = 4; i <= this._cobradas.length + 2; i++) {
    //    columnsToFormat.forEach(columnIndex => {
    //       const cell = worksheet.getCell(i, columnIndex);
    //       cell.style = numeroStyle;
    //    });
    // }

    // Formato numérico con decimales
    const numeroStyle1 = { numFmt: '#,##0.00' };
    const columnsToFormat1 = [7];
    for (let i = 4; i <= this._cobradas.length + 3; i++) {
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

  exportarCajas() {
    this.nombrearchivo = this.formImprimir.value.nombrearchivo;
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(this.nombrearchivo);

    worksheet.addRow(['Lista de cajas']);

    // Celda A1
    const cellA1 = worksheet.getCell('A1');
    const customStyle = {
      font: {
        name: 'Times New Roman',
        bold: true,
        size: 14,
        color: { argb: '002060' },
      },
    };
    cellA1.font = customStyle.font;

    // Aplicar el estilo personalizado a los Títulos
    // const cellC1 = worksheet.getCell('C1');
    // cellC1.font = customStyle.font;

    worksheet.addRow([]);

    const cabecera = ['Establecimiento', 'Pto.Emisión', 'Nombre'];
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

    // Agrega los datos a la hoja de cálculo
    this._cajas.forEach((caja: any) => {
      const row = [
        caja.codigo,
        caja.idptoemision_ptoemision.establecimiento,
        caja.descripcion,
      ];
      worksheet.addRow(row);
    });

    // Establece el ancho de las columnas
    const anchoConfig = [
      { columnIndex: 1, widthInChars: 20 },
      { columnIndex: 2, widthInChars: 20 },
      { columnIndex: 3, widthInChars: 50 },
    ];
    anchoConfig.forEach((config) => {
      worksheet.getColumn(config.columnIndex).width = config.widthInChars;
    });

    // Columnas centradas
    const columnsToCenter = [1, 2];
    columnsToCenter.forEach((columnIndex) => {
      worksheet
        .getColumn(columnIndex)
        .eachCell({ includeEmpty: true }, (cell) => {
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        });
    });

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

  retornar() {
    this.router.navigate(['/cajas']);
  }
}

function formatNumber(num: number) {
  return num.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
}
