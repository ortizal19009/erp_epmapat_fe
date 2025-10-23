import { Component, OnInit } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as ExcelJS from 'exceljs';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { FacturaService } from 'src/app/servicios/factura.service';
import { RubroxfacService } from 'src/app/servicios/rubroxfac.service';
import { InteresesService } from 'src/app/servicios/intereses.service';
@Component({
  selector: 'app-imp-infocliente',
  templateUrl: './imp-infocliente.component.html',
  styleUrls: ['./imp-infocliente.component.css'],
})
export class ImpInfoclienteComponent implements OnInit {
  swimprimir: boolean = true;
  formCliente: FormGroup;
  formImprimir: FormGroup;
  idcliente: number;
  opcreporte: number = 1;
  otrapagina: boolean = false;
  swbotones: boolean = false;
  swcalculando: boolean = false;
  txtcalculando = 'Calculando';
  pdfgenerado: string;
  _cartera: any;
  arrrubros: any[] = [];
  today: number = Date.now();
  date: Date = new Date();
  nombrearchivo: string;
  barraProgreso: boolean = false;
  public progreso = 0;

  constructor(
    public fb: FormBuilder,
    private router: Router,
    private facService: FacturaService,
    private rxfService: RubroxfacService,
    private s_interes: InteresesService
  ) {}

  ngOnInit(): void {
    sessionStorage.setItem('ventana', '/clientes');
    let coloresJSON = sessionStorage.getItem('/clientes');
    if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));

    // const infoclienteJSON = sessionStorage.getItem('infoclienteToImpExp')!;
    // const infocliente = JSON.parse(infoclienteJSON);
    const infocliente = JSON.parse(
      sessionStorage.getItem('infoclienteToImpExp')!
    );
    this.idcliente = infocliente.idcliente;
    this.formCliente = this.fb.group({
      cedula: infocliente.cedula,
      nombre: infocliente.nombre,
    });

    const fecha = new Date();
    const hasta = fecha.toISOString().slice(0, 10);
    this.formImprimir = this.fb.group({
      reporte: '1',
      hasta: hasta,
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

  regresar() {
    this.router.navigate(['detalles-cliente']);
  }

  async imprimir() {
    this.swbotones = true;
    this.swcalculando = true;
    switch (this.opcreporte) {
      case 1: // Cartera (Facturas)
        try {
          let hasta = this.formImprimir.value.hasta;
          this._cartera = await this.facService.getCarteraClienteAsync(
            this.idcliente,
            hasta
          );
          this.swcalculando = false;
          if (this.swimprimir) this.txtcalculando = 'Mostrar';
          else this.txtcalculando = 'Descargar';
        } catch (error) {
          console.error('Error al obtener las facturas (planillas):', error);
        }
        break;
      case 2: //
        try {
          this.barraProgreso = true;
          this.arrrubros = [];
          this._cartera = await this.facService.getCarteraClienteAsync(
            this.idcliente,
            this.formImprimir.value.hasta
          );
          let i = 0;
          this.rubros(i);
          // this.swcalculando = false;
          // if (this.swimprimir) this.txtcalculando = 'Mostrar'
          // else this.txtcalculando = 'Descargar'
        } catch (error) {
          console.error('Error al obtener las facturas (planillas):', error);
        }
        break;
    }
  }

  rubros(i: number) {
    // let _rubros: any;
    let idfactura = this._cartera[i].idfactura;
    this.rxfService.getByIdfactura1(idfactura).subscribe({
      next: (datos) => {
        let j = 0;
        datos.forEach(() => {
          // let busca = datos[j].idrubro_rubros.idrubro;
          const resultIndex = this.arrrubros.findIndex(
            (rubro) => rubro.idrubro === datos[j].idrubro_rubros.idrubro
          );
          if (resultIndex !== null && resultIndex !== -1)
            this.arrrubros[resultIndex].valorunitario += datos[j].valorunitario;
          else {
            if (datos[j].valorunitario != 0) {
              this.arrrubros.push({
                idrubro: datos[j].idrubro_rubros.idrubro,
                descripcion: datos[j].idrubro_rubros.descripcion,
                valorunitario: datos[j].valorunitario,
              });
            }
          }
          j++;
        });
        i++;
        this.progreso = (i / this._cartera.length) * 100;
        if (i < this._cartera.length) this.rubros(i);
        else {
          this.swcalculando = false;
          this.barraProgreso = false;
          if (this.swimprimir) this.txtcalculando = 'Mostrar';
          else this.txtcalculando = 'Descargar';
        }
      },
      error: (err) => console.error('Al obtener los rubros: ', err.error),
    });
  }

  //Muestra cada reporte
  imprime() {
    this.otrapagina = this.formImprimir.value.otrapagina;
    this.swbotones = false;
    this.swcalculando = false;
    this.txtcalculando = 'Calculando';
    switch (this.opcreporte) {
      case 1: //Cartera por cobrar
        if (this.swimprimir) this.imprimeCarteraFacturas();
        else this.exportaPartidas();
        break;
      case 2: //Cartera por cobrar (Rubros)
        if (this.swimprimir) this.imprimeRubros();
        else this.exportaPartidas();
        break;
    }
  }

  imprimeCarteraFacturas() {
    const doc = new jsPDF('p', 'mm', 'a4', true);
    let m_izquierda = 20;
    doc.setFont('times', 'bold');
    doc.setFontSize(16);
    doc.text('EpmapaT', m_izquierda, 10);
    doc.setFont('times', 'normal');
    doc.setFontSize(12);
    doc.text('CARTERA POR COBRAR', m_izquierda, 16);
    doc.setFont('times', 'normal');
    doc.setFontSize(12);
    doc.text(
      'CLIENTE: ' +
        this.formCliente.value.cedula +
        '  ' +
        this.formCliente.value.nombre,
      m_izquierda,
      22
    );
    doc.setFont('times', 'normal');
    doc.setFontSize(12);
    doc.text('FECHA: ' + this.formImprimir.value.hasta, m_izquierda, 28);
    let cabecera = [
      'CUENTA',
      'PLANILLA',
      'FECHA',
      'MÓDULO',
      'VALOR',
      'INTERES',
    ];

    const datos: any = [];
    let totales: number[] = [0];
    let i = 0;
    this._cartera.forEach(async () => {
      if (this._cartera[i].idmodulo.idmodulo == 3)
        this._cartera[i].totaltarifa = this._cartera[i].totaltarifa + 1;
      totales[0] = totales[0] + this._cartera[i].totaltarifa;
      let interes: any = await this.s_interes.getInteresTemporal(
        this._cartera[i].idfactura
      );

      datos.push([
        this._cartera[i].idabonado,
        this._cartera[i].idfactura,
        this._cartera[i].feccrea,
        this._cartera[i].idmodulo.descripcion,
        formatNumber(this._cartera[i].totaltarifa),
        formatNumber(interes),
      ]);
      i++;
    });
    datos.push([
      '',
      '',
      '',
      'TOTAL: ' + this._cartera.length,
      formatNumber(totales[0]),
    ]);

    autoTable(doc, {
      theme: 'grid',
      margin: { left: m_izquierda - 1, top: 30, right: 10, bottom: 12 },
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
      head: [cabecera],
      body: datos,

      columnStyles: {
        0: { halign: 'center' },
        1: { halign: 'center' },
        2: { halign: 'center' },
        3: { halign: 'left' },
        4: { halign: 'right' },
      },

      didParseCell: function (data) {
        // if (typeof data.cell.raw === 'number') {
        //    const formattedNumber = data.cell.raw.toLocaleString('en-US', {
        //       minimumFractionDigits: 2,
        //       maximumFractionDigits: 2,
        //    });
        //    data.cell.text = [formattedNumber];
        // };
        if (data.cell.raw == 0) {
          data.cell.text = [''];
        }
        if (data.row.index === datos.length - 1) {
          data.cell.styles.fontStyle = 'bold';
        } // Total Bold
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

  imprimeRubros() {
    let m_izquierda = 40;
    var doc = new jsPDF();
    doc.setFont('times', 'bold');
    doc.setFontSize(16);
    doc.text('EpmapaT', m_izquierda, 10);
    doc.setFont('times', 'normal');
    doc.setFontSize(12);
    doc.text('CARTERA POR COBRAR (Rubros)', m_izquierda, 16);
    doc.setFont('times', 'normal');
    doc.setFontSize(12);
    doc.text(
      'CLIENTE: ' +
        this.formCliente.value.cedula +
        '  ' +
        this.formCliente.value.nombre,
      m_izquierda,
      22
    );
    doc.setFont('times', 'normal');
    doc.setFontSize(12);
    doc.text('FECHA: ' + this.formImprimir.value.hasta, m_izquierda, 28);
    let cabecera = ['ID', 'NOMBRE', 'VALOR'];

    const datos: any = [];
    let totales: number[] = [0];
    let i = 0;
    this.arrrubros.forEach(() => {
      totales[0] = totales[0] + this.arrrubros[i].valorunitario;
      datos.push([
        this.arrrubros[i].idrubro,
        this.arrrubros[i].descripcion,
        formatNumber(this.arrrubros[i].valorunitario),
      ]);
      i++;
    });
    datos.push([
      '',
      'TOTAL: ' + this.arrrubros.length,
      formatNumber(totales[0]),
    ]);

    autoTable(doc, {
      theme: 'grid',
      margin: { left: m_izquierda - 1, top: 30, right: 30, bottom: 12 },
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
      head: [cabecera],
      body: datos,

      columnStyles: {
        0: { halign: 'center' },
        1: { halign: 'left' },
        2: { halign: 'right' },
      },

      didParseCell: function (data: any) {
        // if (typeof data.cell.raw === 'number') {
        //    const formattedNumber = data.cell.raw.toLocaleString('en-US', {
        //       minimumFractionDigits: 2,
        //       maximumFractionDigits: 2,
        //    });
        //    data.cell.text = [formattedNumber];
        // };
        if (data.cell.raw == 0) {
          data.cell.text = [''];
        }
        if (data.row.index === datos.length - 1) {
          data.cell.styles.fontStyle = 'bold';
        } // Total Bold
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

  muestraPDF(doc: any) {
    var opciones = { filename: this.pdfgenerado };
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

  exportaPartidas() {
    this.nombrearchivo = this.formImprimir.value.nombrearchivo;
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(this.nombrearchivo);
    // Fila 1
    worksheet.addRow(['', '', 'PRESUPUESTO DE INGRESOS']);
    worksheet.getCell('C1').font = {
      name: 'Times New Roman',
      bold: true,
      size: 14,
      color: { argb: '002060' },
    };

    // Fila 2
    worksheet.addRow([]);
    // worksheet.getCell('B2').font = { name: 'Times New Roman', bold: true, size: 16, color: { argb: '001060' } };

    const cabecera = [
      '#',
      'Código',
      'Nombre',
      'Codificado',
      'Inicial',
      'Reforma',
    ];
    const headerRowCell = worksheet.addRow(cabecera);
    headerRowCell.eachCell((cell: any) => {
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
    this._cartera.forEach((item: any) => {
      let fila = worksheet.addRow([
        i,
        item.codpar,
        item.nompar,
        item.inicia + item.totmod,
        item.inicia,
        item.totmod,
      ]);
      i++;
    });

    // Establece el ancho de las columnas
    const anchoConfig = [
      { columnIndex: 1, widthInChars: 6 },
      { columnIndex: 2, widthInChars: 14 },
      { columnIndex: 3, widthInChars: 50 },
      { columnIndex: 4, widthInChars: 16 },
      { columnIndex: 5, widthInChars: 16 },
      { columnIndex: 6, widthInChars: 16 },
    ];
    anchoConfig.forEach((config) => {
      worksheet.getColumn(config.columnIndex).width = config.widthInChars;
    });

    // Columnas centradas
    const columnsToCenter = [1];
    columnsToCenter.forEach((columnIndex) => {
      worksheet
        .getColumn(columnIndex)
        .eachCell({ includeEmpty: true }, (cell: any) => {
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        });
    });
    // Columnas a la derecha
    let columnsToRigth = [4, 5, 6];
    columnsToRigth.forEach((columnIndex) => {
      worksheet
        .getColumn(columnIndex)
        .eachCell({ includeEmpty: true }, (cell: any) => {
          cell.alignment = { horizontal: 'right' };
        });
    });

    // Formato numérico
    const numeroStyle = { numFmt: '#,##0.00' };
    const columnsToFormat = [4, 5, 6];
    for (let i = 4; i <= this._cartera.length + 3; i++) {
      columnsToFormat.forEach((columnIndex) => {
        const cell = worksheet.getCell(i, columnIndex);
        cell.style = numeroStyle;
      });
    }

    //Coloca la fila del Total
    worksheet.addRow(['', '', 'TOTAL']);
    worksheet.getCell('C' + (this._cartera.length + 4).toString()).font = {
      bold: true,
    };

    let celdaD = worksheet.getCell('D' + (this._cartera.length + 4).toString());
    celdaD.numFmt = '#,##0.00';
    celdaD.font = { bold: true };
    celdaD.value = {
      formula: 'SUM(D4:' + 'D' + (this._cartera.length + 3).toString() + ')',
      result: 0,
      sharedFormula: undefined,
      date1904: false,
    };

    let celdaE = worksheet.getCell('E' + (this._cartera.length + 4).toString());
    celdaE.numFmt = '#,##0.00';
    celdaE.font = { bold: true };
    celdaE.value = {
      formula: 'SUM(E4:' + 'E' + (this._cartera.length + 3).toString() + ')',
      result: 0,
      sharedFormula: undefined,
      date1904: false,
    };

    let celdaF = worksheet.getCell('F' + (this._cartera.length + 4).toString());
    celdaF.numFmt = '#,##0.00';
    celdaF.font = { bold: true };
    celdaF.value = {
      formula: 'SUM(F4:' + 'F' + (this._cartera.length + 3).toString() + ')',
      result: 0,
      sharedFormula: undefined,
      date1904: false,
    };

    // Crea el archivo Excel
    workbook.xlsx.writeBuffer().then((buffer: any) => {
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
}
function formatNumber(num: number) {
  return num.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
}
