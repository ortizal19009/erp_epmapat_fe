import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as ExcelJS from 'exceljs';
import { CuentasService } from 'src/app/servicios/contabilidad/cuentas.service';
import { TransaciService } from 'src/app/servicios/contabilidad/transaci.service';
import { BenextranService } from 'src/app/servicios/contabilidad/benextran.service';

@Component({
   selector: 'app-imp-mayor',
   templateUrl: './imp-mayor.component.html',
   styleUrls: ['./imp-mayor.component.css']
})
export class ImpMayorComponent implements OnInit {

   swimprimir: boolean = true;
   formImprimir: FormGroup;
   formCuenta: FormGroup;
   opcreporte: number = 1;
   otrapagina: boolean = false;
   swbotones: boolean = false;
   swcalculando: boolean = false;
   txtcalculando = 'Calculando';
   _mayor: any;
   anterior: number;
   sumdebe: number;
   sumhaber: number;
   _totxbenefi: any = [];
   pdfgenerado: string;
   nombrearchivo: string;

   constructor(public fb: FormBuilder, private router: Router, private cueService: CuentasService, private traService: TransaciService,
      private benxtraService: BenextranService) { }

   ngOnInit(): void {
      sessionStorage.setItem('ventana', '/cuentas');
      let coloresJSON = sessionStorage.getItem('/cuentas');
      if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));

      this.formCuenta = this.fb.group({
         codcue: '',
         nomcue: ''
      });

      const cuentaJSON = sessionStorage.getItem('cuentaToImpExp');
      if (cuentaJSON) {
         const cuenta = JSON.parse(cuentaJSON);
         this.cueService.getNombre(cuenta.codcue).subscribe({
            next: nomcue => {
               this.formCuenta.patchValue({
                  codcue: cuenta.codcue,
                  nomcue: nomcue
               });
            },
            error: err => console.error('Al buscar la cuenta: ', err.error)
         });

         this.formImprimir = this.fb.group({
            reporte: '1',
            desde: cuenta.desde,
            hasta: cuenta.hasta,
            nombrearchivo: ['', [Validators.required, Validators.minLength(3)]],
            otrapagina: ''
         });
      }
   }

   colocaColor(colores: any) {
      document.documentElement.style.setProperty('--bgcolor1', colores[0]);
      const cabecera = document.querySelector('.cabecera');
      if (cabecera) cabecera.classList.add('nuevoBG1')
      document.documentElement.style.setProperty('--bgcolor2', colores[1]);
      const detalle = document.querySelector('.detalle');
      if (detalle) detalle.classList.add('nuevoBG2');
   }

   buscaNomcue() {
      this.cueService.getNombre(this.formCuenta.value.codcue).subscribe({
         next: nomcue => this.formCuenta.patchValue({ nomcue: nomcue }),
         error: err => console.error('Al buscar la cuenta: ', err.error)
      });
   }

   get f() { return this.formImprimir.controls; }

   changeReporte() { this.opcreporte = +this.formImprimir.value.reporte; }

   retornar() { this.router.navigate(['info-cuenta']); }

   impriexpor() { this.swimprimir = !this.swimprimir; }

   //Recupera los datos de cada reporte
   async imprimir() {
      this.swbotones = true;
      this.swcalculando = true;
      // let fecha = this.formImprimir.value.fecha;
      switch (this.opcreporte) {
         case 1:  // Mayor de la cuenta
            this.pdfgenerado = 'mayor_' + this.formCuenta.value.codcue;
            try {
               this.anterior = await this.traService.saldoAsync(this.formCuenta.value.codcue, this.formImprimir.value.desde);
               this._mayor = await this.traService.getByCodcueAsync(this.formCuenta.value.codcue, this.formImprimir.value.desde, this.formImprimir.value.hasta);
               this.totalesMayor();
               this.swcalculando = false;
               if (this.swimprimir) this.txtcalculando = 'Mostrar'
               else this.txtcalculando = 'Descargar'
            } catch (error) {
               console.error('Error al obtener las transacciones de la cuenta:', error);
            }
            break;
         case 2:  //Totales por Beneficiario
            try {
               // this.sw1 = true;
               this.swcalculando = false;
               if (this.swimprimir) this.txtcalculando = 'Mostrar'
               else this.txtcalculando = 'Descargar'
            } catch (error) {
               console.error('Error al obtener los Totales por Beneficiario:', error);
            }
            break;
         default:
      }
   }

   totalesMayor() {
      this.sumdebe = 0;
      this.sumhaber = 0;
      let saldo = this.anterior;
      let i = 0;
      this._mayor.forEach(() => {
         if (this._mayor[i].debcre == 1) {
            this._mayor[i].debe = this._mayor[i].valor;
            this._mayor[i].haber = 0;
            this.sumdebe += this._mayor[i].valor;
            if (this._mayor[i].codcue.slice(0, 1) == '1' || this._mayor[i].codcue.slice(0, 2) == '63' || this._mayor[i].codcue.slice(0, 2) == '91') saldo = saldo + this._mayor[i].valor;
            else saldo = saldo - this._mayor[i].valor;
         }
         else {
            this._mayor[i].debe = 0;
            this._mayor[i].haber = this._mayor[i].valor;
            this.sumhaber += this._mayor[i].valor;
            if (this._mayor[i].codcue.slice(0, 1) == '1' || this._mayor[i].codcue.slice(0, 2) == '63' || this._mayor[i].codcue.slice(0, 2) == '91') saldo = saldo - this._mayor[i].valor;
            else saldo = saldo + this._mayor[i].valor;
         }
         this._mayor[i].saldo = saldo;
         i++;
      });
   }

   //Muestra cada reporte
   imprime() {
      this.swbotones = false; this.swcalculando = false; this.txtcalculando = 'Calculando'
      switch (this.opcreporte) {
         case 1:  // Imprime Mayor de la cuenta
            if (this.swimprimir) this.imprimeMayor();
            else this.exportaMayor();
            break;
         case 2:  // Imprime Totales por Beneficiario
            if (this.swimprimir) this.imprimeTotxbenefi();
            else this.exportaTotxbenefi();
            break;
         default:
      }
   }

   comprobante(tipcom: number, compro: number): string {
      switch (tipcom) {
         case 1:
            return 'I-' + compro.toString();
         case 2:
            return 'E-' + compro.toString();
         case 3:
            return 'DC-' + compro.toString();
         case 4:
            return 'DI-' + compro.toString();
         case 5:
            return 'DE-' + compro.toString();
         default:
            return '-' + compro.toString();
      }
   }

   imprimeMayor() {
      this.otrapagina = this.formImprimir.value.otrapagina;
      const doc = new jsPDF('l', 'mm', 'a4', true);
      let m_izquierda = 10;
      doc.setFont("times", "bold"); doc.setFontSize(16); doc.text("EpmapaT", m_izquierda, 10);
      doc.setFont("times", "bold"); doc.setFontSize(12); doc.text("Mayor de la cuenta: " + this.formCuenta.value.codcue + '  ' + this.formCuenta.value.nomcue, m_izquierda, 16);
      doc.setFont("times", "bold"); doc.setFontSize(11); doc.text("Del " + this.formImprimir.value.desde + ' al ' + this.formImprimir.value.hasta, m_izquierda, 22);
      if (this.anterior != 0) { doc.setFont("helvetica"); doc.setFontSize(10); doc.text("Anterior: " + formatNumber(this.anterior), m_izquierda + 132, 22) };

      const datos: any = [];
      let i = 0;
      this._mayor.forEach(() => {
         datos.push([this._mayor[i].idasiento.fecha, this._mayor[i].idasiento.asiento, this.comprobante(this._mayor[i].idasiento.tipcom, this._mayor[i].idasiento.compro),
         this._mayor[i].idbene.nomben, formatNumber(this._mayor[i].debe), formatNumber(this._mayor[i].haber), formatNumber(this._mayor[i].saldo),
         this._mayor[i].descri]);
         i++;
      });
      datos.push(['', '', '', 'TOTAL', formatNumber(this.sumdebe), formatNumber(this.sumhaber)]);

      autoTable(doc, {
         head: [['Fecha', 'Asie', 'Cmprbnt', 'Beneficiario', 'Debe', 'Haber', 'Saldo', 'Descripción']],
         theme: 'grid',
         headStyles: { fillColor: [68, 103, 114], fontStyle: 'bold', halign: 'center' },
         styles: { font: 'helvetica', fontSize: 8, cellPadding: 1, halign: 'center' },

         columnStyles: {
            0: { halign: 'center', cellWidth: 18 },
            1: { halign: 'center', cellWidth: 10 },
            2: { halign: 'center', cellWidth: 16 },
            3: { halign: 'left', cellWidth: 70, fontSize: 7 },
            4: { halign: 'right', cellWidth: 16 },
            5: { halign: 'right', cellWidth: 16 },
            6: { halign: 'right', cellWidth: 16 },
            7: { halign: 'left', cellWidth: 120, fontSize: 7 },
         },
         margin: { left: m_izquierda - 1, top: 24, right: 6, bottom: 13 },
         body: datos,

         didParseCell: function (hookData) {
            if (hookData.column.index == 3 && hookData.cell.text.toString() == '(Ninguno)') { hookData.cell.text = ['']; }
            if (hookData.cell.raw == 0) { hookData.cell.text = ['']; }
            // Cambia el estilo de toda la fila a negrita
            if (hookData.cell.raw === '' && hookData.column.index === 0) {
               Object.values(hookData.row.cells).forEach(function (cell) { cell.styles.fontStyle = 'bold'; });
            }
         }
      });

      const addPageNumbers = function () {
         const pageCount = doc.internal.pages.length;
         for (let i = 1; i <= pageCount - 1; i++) {
            doc.setPage(i);
            doc.setFontSize(10);
            doc.text('Página ' + i + ' de ' + (pageCount - 1), m_izquierda, doc.internal.pageSize.height - 10);
         }
      };

      addPageNumbers();

      this.muestraPDF(doc);
   }

   imprimeTotxbenefi() {
      this.otrapagina = this.formImprimir.value.otrapagina;
      const doc = new jsPDF('p', 'mm', 'a4', true);
      let m_izquierda = 30;
      doc.setFont("times", "bold"); doc.setFontSize(16); doc.text("EpmapaT", m_izquierda, 10);
      doc.setFont("times", "bold"); doc.setFontSize(12); doc.text("Totales por Beneficiario", m_izquierda, 16);
      doc.setFont("times", "bold"); doc.setFontSize(10); doc.text("Cuenta: " + this.formCuenta.value.codcue + '  ' + this.formCuenta.value.nomcue, m_izquierda, 22);
      // doc.setFont("times", "bold"); doc.setFontSize(11); doc.text("Del " + this.formImprimir.value.desde + ' al ' + this.formImprimir.value.hasta, m_izquierda, 22);
      // if (this.anterior != 0) { doc.setFont("helvetica"); doc.setFontSize(10); doc.text("Anterior: " + formatNumber(this.anterior), m_izquierda + 132, 22) };

      const datos: any = [];
      let i = 0;
      this._totxbenefi.forEach(() => {
         datos.push([this._totxbenefi[i].codben, this._totxbenefi[i].nomben, this._totxbenefi[i].valor]);
         i++;
      });
      // datos.push(['', '', '', 'TOTAL', formatNumber(this.sumdebe), formatNumber(this.sumhaber)]);

      autoTable(doc, {
         head: [['Código', 'Nombre', 'Valor']],
         theme: 'grid',
         headStyles: { fillColor: [68, 103, 114], fontStyle: 'bold', halign: 'center' },
         styles: { font: 'helvetica', fontSize: 8, cellPadding: 1, halign: 'center' },

         columnStyles: {
            0: { halign: 'center', cellWidth: 12 },
            1: { halign: 'left', cellWidth: 60 },
            2: { halign: 'right', cellWidth: 18 }
         },
         margin: { left: m_izquierda - 1, top: 24, right: 30, bottom: 13 },
         body: datos,

         didParseCell: function (hookData) {
            if (hookData.column.index == 3 && hookData.cell.text.toString() == '(Ninguno)') { hookData.cell.text = ['']; }
            if (hookData.cell.raw == 0) { hookData.cell.text = ['']; }
            // Cambia el estilo de toda la fila a negrita
            if (hookData.cell.raw === '' && hookData.column.index === 0) {
               Object.values(hookData.row.cells).forEach(function (cell) { cell.styles.fontStyle = 'bold'; });
            }
         }
      });

      const addPageNumbers = function () {
         const pageCount = doc.internal.pages.length;
         for (let i = 1; i <= pageCount - 1; i++) {
            doc.setPage(i);
            doc.setFontSize(10);
            doc.text('Página ' + i + ' de ' + (pageCount - 1), m_izquierda, doc.internal.pageSize.height - 10);
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
         if (elementoExistente) { elementoExistente.remove(); }
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

   exportaMayor() {
      this.nombrearchivo = this.formImprimir.value.nombrearchivo;
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(this.nombrearchivo);
      // Fila 1
      worksheet.addRow(['', '', '', 'Mayor de la cuenta ' + this.formCuenta.value.codcue + ' ' + this.formCuenta.value.nomcue]);
      const cellD1 = worksheet.getCell('D1');
      const customStyle = { font: { name: 'Times New Roman', bold: true, size: 14, color: { argb: '002060' } } };
      cellD1.font = customStyle.font;

      // Fila 2
      worksheet.addRow(['', '', '', 'Del ' + this.formImprimir.value.desde + ' al ' + this.formImprimir.value.hasta]);
      const cellD2 = worksheet.getCell('D2');
      const customStyle2 = { font: { name: 'Times New Roman', bold: true, size: 10, color: { argb: '002060' } } };
      cellD2.font = customStyle2.font;
      // Fila 3: Anterior
      if (this.anterior != 0) {
         worksheet.addRow(['', '', '', '', '', 'Anterior', this.anterior]);
         const cellF3 = worksheet.getCell('F3');
         cellF3.font = customStyle2.font;
         const cellG3 = worksheet.getCell('G3');
         const customStyleG3 = { font: { name: 'Times New Roman', bold: true, size: 10, color: { argb: '002060' } } };
         const numeroStyleG3 = { numFmt: '#,##0.00' };
         cellG3.style = numeroStyleG3;
         cellG3.font = customStyleG3.font;
      } else worksheet.addRow([]);

      //Fila 4 Cabecera 
      // const cabecera = ['Fecha', 'Asie', 'Cmprbnt', 'Beneficiario', 'Debe', 'Haber', 'Saldo', 'Descripción'];
      const headerRowCell = worksheet.addRow(['Fecha', 'Asie', 'Cmprbnt', 'Beneficiario', 'Debe', 'Haber', 'Saldo', 'Descripción']);
      headerRowCell.eachCell(cell => {
         cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: '002060' }
         };
         cell.font = { bold: true, name: 'Times New Roman', color: { argb: 'FFFFFF' } };
      });

      // Agrega los datos a la hoja de cálculo
      let i = 0;
      this._mayor.forEach(() => {
         let nomben: string;
         if (this._mayor[i].idbene.idbene == 1) nomben = ''
         else nomben = this._mayor[i].idbene.nomben
         let debe: any; let haber: any;
         if (this._mayor[i].debcre == 1) {
            debe = this._mayor[i].debe;
            haber = '';
         }
         else {
            debe = '';
            haber = this._mayor[i].haber;
         }
         const row = [this._mayor[i].idasiento.fecha, this._mayor[i].idasiento.asiento, this.comprobante(this._mayor[i].idasiento.tipcom, this._mayor[i].idasiento.compro),
            nomben, debe, haber, this._mayor[i].saldo, this._mayor[i].descri];
         worksheet.addRow(row);
         i++;
      });

      //Coloca la fila del Total
      worksheet.addRow(['', '', '', 'TOTAL']);
      worksheet.getCell('D' + (this._mayor.length + 5).toString()).font = { bold: true }

      let celdaE = worksheet.getCell('E' + (this._mayor.length + 5).toString());
      celdaE.numFmt = '#,##0.00';
      celdaE.font = { bold: true }
      celdaE.value = { formula: 'SUM(E5:' + 'E' + (this._mayor.length + 4).toString() + ')', result: 0, sharedFormula: undefined, date1904: false };

      let celdaF = worksheet.getCell('F' + (this._mayor.length + 5).toString());
      celdaF.numFmt = '#,##0.00';
      celdaF.font = { bold: true }
      celdaF.value = { formula: 'SUM(F5:' + 'F' + (this._mayor.length + 4).toString() + ')', result: 0, sharedFormula: undefined, date1904: false };

      // Establece el ancho de las columnas
      const anchoConfig = [
         { columnIndex: 1, widthInChars: 12 },
         { columnIndex: 2, widthInChars: 8 },
         { columnIndex: 3, widthInChars: 12 },
         { columnIndex: 4, widthInChars: 40 },
         { columnIndex: 5, widthInChars: 16 },
         { columnIndex: 6, widthInChars: 16 },
         { columnIndex: 7, widthInChars: 16 },
         { columnIndex: 8, widthInChars: 200 },
      ];
      anchoConfig.forEach(config => {
         worksheet.getColumn(config.columnIndex).width = config.widthInChars;
      });

      // Columnas centradas 
      const columnsToCenter = [1, 2, 3];
      columnsToCenter.forEach(columnIndex => {
         worksheet.getColumn(columnIndex).eachCell({ includeEmpty: true }, cell => {
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
         });
      });
      // Columnas a la derecha 
      let columnsToRigth = [5, 6, 7];
      columnsToRigth.forEach(columnIndex => {
         worksheet.getColumn(columnIndex).eachCell({ includeEmpty: true }, cell => {
            cell.alignment = { horizontal: 'right' };
         });
      });

      // Formato numérico con decimales
      const numeroStyle1 = { numFmt: '#,##0.00' };
      const columnsToFormat1 = [5, 6, 7];
      for (let i = 5; i <= this._mayor.length + 4; i++) {
         columnsToFormat1.forEach(columnIndex => {
            const cell = worksheet.getCell(i, columnIndex);
            cell.style = numeroStyle1;
         });
      }

      // Crea el archivo Excel
      workbook.xlsx.writeBuffer().then(buffer => {
         const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
         const url = window.URL.createObjectURL(blob);
         // Crear un enlace para descargar el archivo
         const a = document.createElement('a');
         a.href = url;
         a.download = `${this.nombrearchivo}.xlsx`; // Usa el nombre proporcionado por el usuario
         a.click();
         window.URL.revokeObjectURL(url); // Libera recursos
      });
   }

   exportaTotxbenefi() {
      this.nombrearchivo = this.formImprimir.value.nombrearchivo;
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(this.nombrearchivo);
      // Fila 1
      worksheet.addRow(['', 'Totales por Beneficiario ']);
      worksheet.getCell('B1').font = { name: 'Times New Roman', bold: true, size: 14, color: { argb: '002060' } }

      // const cellD1 = worksheet.getCell('B1');
      // const customStyle = { font: { name: 'Times New Roman', bold: true, size: 14, color: { argb: '002060' } } };
      // cellD1.font = customStyle.font;

      // Fila 2
      worksheet.addRow(['', 'Cuenta ' + this.formCuenta.value.codcue + ' ' + this.formCuenta.value.nomcue]);
      worksheet.getCell('B2').font = { name: 'Times New Roman', bold: true, size: 12, color: { argb: '002060' } }

      // const cellB2 = worksheet.getCell('B2');
      // const customStyle2 = { font: { name: 'Times New Roman', bold: true, size: 12, color: { argb: '002060' } } };
      // cellB2.font = customStyle2.font;
      // Fila 3
      worksheet.addRow([]);

      //Fila 4 Cabecera 
      const headerRowCell = worksheet.addRow(['Código', 'Nombre', 'Valor']);
      headerRowCell.eachCell(cell => {
         cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: '002060' }
         };
         cell.font = { bold: true, name: 'Times New Roman', color: { argb: 'FFFFFF' } };
      });

      // Agrega los datos a la hoja de cálculo
      let i = 0;
      this._totxbenefi.forEach(() => {
         let nomben: string;
         if (this._mayor[i].idbene.idbene == 1) nomben = ''
         else nomben = this._mayor[i].idbene.nomben
         let debe: any; let haber: any;
         if (this._mayor[i].debcre == 1) {
            debe = this._mayor[i].debe;
            haber = '';
         }
         else {
            debe = '';
            haber = this._mayor[i].haber;
         }
         const row = [this._totxbenefi[i].codigo, this._totxbenefi[i].nombre, this._totxbenefi[i].valor];
         worksheet.addRow(row);
         i++;
      });

      //Coloca la fila del Total
      worksheet.addRow(['', 'TOTAL']);
      worksheet.getCell('B' + (this._totxbenefi.length + 5).toString()).font = { bold: true }

      if (this._totxbenefi.length > 0) {
         let celdaC = worksheet.getCell('C' + (this._totxbenefi.length + 5).toString());
         celdaC.numFmt = '#,##0.00';
         celdaC.font = { bold: true }
         celdaC.value = { formula: 'SUM(C5:' + 'C' + (this._totxbenefi.length + 4).toString() + ')', result: 0, sharedFormula: undefined, date1904: false };
      }
      // Establece el ancho de las columnas
      const anchoConfig = [
         { columnIndex: 1, widthInChars: 12 },
         { columnIndex: 2, widthInChars: 60 },
         { columnIndex: 3, widthInChars: 18 }
      ];
      anchoConfig.forEach(config => {
         worksheet.getColumn(config.columnIndex).width = config.widthInChars;
      });

      // Columnas centradas 
      const columnsToCenter = [1];
      columnsToCenter.forEach(columnIndex => {
         worksheet.getColumn(columnIndex).eachCell({ includeEmpty: true }, cell => {
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
         });
      });
      // Columnas a la derecha 
      let columnsToRigth = [3];
      columnsToRigth.forEach(columnIndex => {
         worksheet.getColumn(columnIndex).eachCell({ includeEmpty: true }, cell => {
            cell.alignment = { horizontal: 'right' };
         });
      });

      // Formato numérico con decimales
      const numeroStyle1 = { numFmt: '#,##0.00' };
      const columnsToFormat1 = [3];
      for (let i = 5; i <= this._totxbenefi.length + 4; i++) {
         columnsToFormat1.forEach(columnIndex => {
            const cell = worksheet.getCell(i, columnIndex);
            cell.style = numeroStyle1;
         });
      }

      // Crea el archivo Excel
      workbook.xlsx.writeBuffer().then(buffer => {
         const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
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