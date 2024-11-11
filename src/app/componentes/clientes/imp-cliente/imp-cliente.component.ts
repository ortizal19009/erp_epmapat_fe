import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { FacturaService } from 'src/app/servicios/factura.service';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as ExcelJS from 'exceljs';
import { ClientesService } from 'src/app/servicios/clientes.service';
import { Clientes } from 'src/app/modelos/clientes';
import { RubroxfacService } from 'src/app/servicios/rubroxfac.service';
import { ColoresService } from 'src/app/compartida/colores.service';
import { PdfService } from 'src/app/servicios/pdf.service';
@Component({
  selector: 'app-imp-cliente',
  templateUrl: './imp-cliente.component.html',
  styleUrls: ['./imp-cliente.component.css'],
})
export class ImpClienteComponent implements OnInit {
  swimprimir: boolean = true;
  formImprimir: FormGroup;
  opcreporte: number = 1;
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

  constructor(
    public fb: FormBuilder,
    private router: Router,
    private facService: FacturaService,
    private cliService: ClientesService,
    private s_rxf: RubroxfacService,
    private coloresService: ColoresService,
    private s_pdf: PdfService
  ) {}

  ngOnInit(): void {
    sessionStorage.setItem('ventana', '/cv-facturas');
    let coloresJSON = sessionStorage.getItem('/cv-facturas');
    if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));
    else this.buscaColor();

    //
    const fecha = new Date();
    const hasta = fecha.toISOString().slice(0, 10);
    const año = fecha.getFullYear() - 1;
    this.formImprimir = this.fb.group({
      reporte: '1',
      hasta: hasta,
      desdeNum: 1,
      hastaNum: 18000,
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
  async buscaColor() {
    try {
      const datos = await this.coloresService.setcolor(1, 'cv-facturas');
      const coloresJSON = JSON.stringify(datos);
      sessionStorage.setItem('/cv-facturas', coloresJSON);
      this.colocaColor(datos);
    } catch (error) {
      console.error(error);
    }
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
    this.router.navigate(['clientes']);
  }

  async imprimir() {
    this.swbotones = true;
    this.swcalculando = true;
    switch (this.opcreporte) {
      case 1: //Cartera Vencida (Clientes)
        try {
          let hasta = this.formImprimir.value.hasta;
          this._clientes = [];
          this.barraProgreso = true;
          this.total = 0;
          let i = this.formImprimir.value.desdeNum;
          this.calClientes(i, hasta);
        } catch (error) {
          console.error('Error al obtener las partidas:', error);
        }
        break;
      case 2: //Lista de clientes
        try {
          this.swcalculando = false;
          if (this.swimprimir) this.txtcalculando = 'Mostrar';
          else this.txtcalculando = 'Descargar';
        } catch (error) {
          console.error('Error al obtener las partidas:', error);
        }
        break;
      case 3: //CARTERA VENCIDA POR RUBRO
        try {
          this.calcularCVBRubros(this.formImprimir.value.hasta);
          this.swcalculando = true;
          if (this.swimprimir) this.txtcalculando = 'Mostrar';
          else this.txtcalculando = 'Descargar';
        } catch (error) {
          console.error('Error al obtener las partidas:', error);
        }
        break;
      case 4: //CARTERA VENCIDA POR FACTURA
        try {
          this.calcularCVByFacturas(this.formImprimir.value.hasta);
          this.swcalculando = true;
          if (this.swimprimir) this.txtcalculando = 'Mostrar';
          else this.txtcalculando = 'Descargar';
        } catch (error) {
          console.error('Error al obtener las partidas:', error);
        }
        break;
    }
  }

  async calClientes(i: number, hasta: Date) {
    const cartera = await this.facService.getTotCarteraClienteAsync(i, hasta);
    let cliente: Clientes;
    let suma = +cartera;
    if (suma > 0) {
      this.cliService.getListaById(i).subscribe({
        next: (resp) => {
          cliente = resp;
          this._clientes.push([
            cliente.cedula,
            cliente.nombre,
            cliente.direccion,
            suma,
          ]);
          this.total = this.total + suma;
        },
        error: (err) => console.log(err.error),
      });
    }
    // console.log(i, tot)
    i++;
    this.progreso = (i / this.formImprimir.value.hastaNum) * 100;
    if (i < this.formImprimir.value.hastaNum) this.calClientes(i, hasta);
    else {
      this.swcalculando = false;
      this.barraProgreso = false;
      if (this.swimprimir) this.txtcalculando = 'Mostrar';
      else this.txtcalculando = 'Descargar';
    }
  }
  calcularCVBRubros(fecha: any) {
    this.s_rxf.getCarteraVencidaxRubros(fecha).subscribe({
      next: (datosCrtera: any) => {
        console.log(datosCrtera);
      },
      error: (e: any) => console.error(e),
    });
  }
  calcularCVByFacturas(fecha: any) {
    this.facService.getCarteraVencidaFacturas(fecha).subscribe({
      next: (datos: any) => {
        let doc = new jsPDF();
        console.log(datos);
        let head: any = [];
        let body: any = [];
        this.s_pdf.bodyOneTable('Cartera vencida por factura', head, body, doc);
      },
      error: (e: any) => console.error(e),
    });
  }

  //Muestra cada reporte
  imprime() {
    this.otrapagina = this.formImprimir.value.otrapagina;
    this.swbotones = false;
    this.swcalculando = false;
    this.txtcalculando = 'Calculando';
    switch (this.opcreporte) {
      case 1: //Clientes de la cartera vencida
        if (this.swimprimir) this.imprimeClientes();
        else this.exportaClientes();
        break;
      case 2: //Lista de clientes
        // if (this.swimprimir) this.imprimeClientes();
        // else this.exportaClientes();
        break;
    }
  }

  imprimeClientes() {
    const doc = new jsPDF('p', 'mm', 'a4', true);
    let m_izquierda = 20;
    doc.setFont('times', 'bold');
    doc.setFontSize(16);
    doc.text('EpmapaT', m_izquierda, 10);
    doc.setFont('times', 'normal');
    doc.setFontSize(12);
    doc.text('CARTERA VENCIDA', m_izquierda, 16);
    doc.setFont('times', 'normal');
    doc.setFontSize(12);
    doc.text('FECHA: ' + this.formImprimir.value.hasta, m_izquierda, 22);
    let cabecera = ['CEDULA', 'NOMBRE', 'DIRECCIÓN', 'VALOR'];

    const datos: any = [];

    this._clientes.push(['', 'TOTAL: ' + this._clientes.length, this.total]);
    autoTable(doc, {
      theme: 'grid',
      margin: { left: m_izquierda - 1, top: 24, right: 16, bottom: 12 },
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
      body: this._clientes,

      columnStyles: {
        0: { halign: 'center' },
        1: { halign: 'left' },
        2: { halign: 'right' },
      },

      didParseCell: function (data) {
        if (typeof data.cell.raw === 'number') {
          const formattedNumber = data.cell.raw.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          });
          data.cell.text = [formattedNumber];
        }
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

  exportaClientes() {
    this.nombrearchivo = this.formImprimir.value.nombrearchivo;
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(this.nombrearchivo);
    // Fila 1
    worksheet.addRow(['', 'CARTERA VENCIDA']);
    worksheet.getCell('B1').font = {
      name: 'Times New Roman',
      bold: true,
      size: 14,
      color: { argb: '002060' },
    };

    // Fila 2
    worksheet.addRow([, , 'FECHA: ' + this.formImprimir.value.hasta]);
    worksheet.getCell('B2').font = {
      name: 'Times New Roman',
      bold: true,
      size: 14,
      color: { argb: '001060' },
    };

    const cabecera = ['Cédula', 'Nombre', 'Dirección', 'Valor'];
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
    this._clientes.forEach((item: any) => {
      worksheet.addRow([item[0], item[1], item[2], item[3]]);
    });

    // Establece el ancho de las columnas
    const anchoConfig = [
      { columnIndex: 1, widthInChars: 15 },
      { columnIndex: 2, widthInChars: 60 },
      { columnIndex: 3, widthInChars: 30 },
      { columnIndex: 4, widthInChars: 16 },
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
    const numeroStyle = { numFmt: '#,##0.00' };
    const columnsToFormat = [3];
    for (let i = 4; i <= this._clientes.length + 3; i++) {
      columnsToFormat.forEach((columnIndex) => {
        const cell = worksheet.getCell(i, columnIndex);
        cell.style = numeroStyle;
      });
    }

    //Coloca la fila del Total
    worksheet.addRow(['', 'TOTAL']);
    worksheet.getCell('B' + (this._clientes.length + 4).toString()).font = {
      bold: true,
    };

    let celdaC = worksheet.getCell(
      'C' + (this._clientes.length + 4).toString()
    );
    celdaC.numFmt = '#,##0.00';
    celdaC.font = { bold: true };
    celdaC.value = {
      formula: 'SUM(D4:' + 'D' + (this._clientes.length + 3).toString() + ')',
      result: 0,
      sharedFormula: undefined,
      date1904: false,
    };

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
}
