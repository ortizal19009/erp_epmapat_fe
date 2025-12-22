import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AsientosService } from 'src/app/servicios/contabilidad/asientos.service';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as ExcelJS from 'exceljs';
import { TransaciService } from 'src/app/servicios/contabilidad/transaci.service';

@Component({
   selector: 'app-imp-asientos',
   templateUrl: './imp-asientos.component.html',
   styleUrls: ['./imp-asientos.component.css']
})
export class ImpAsientosComponent implements OnInit {

   swimprimir: boolean = true;
   formImprimir: FormGroup;
   opcreporte: number = 1;
   otrapagina: boolean = false;
   swbotones: boolean = false;
   swcalculando: boolean = false;
   txtcalculando = 'Calculando';
   pdfgenerado: string;
   _asientos: any;
   today: number = Date.now();
   date: Date = new Date();
   nombrearchivo: string;
   antasiento: number;

   constructor(public fb: FormBuilder, private router: Router, private asiService: AsientosService,
      private tranService: TransaciService) { }

   ngOnInit(): void {
      sessionStorage.setItem('ventana', '/asientos');
      let coloresJSON = sessionStorage.getItem('/asientos');
      if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));

      const asientos = JSON.parse(sessionStorage.getItem('asientosToImpExp')!);
      this.formImprimir = this.fb.group({
         reporte: '1',
         tipcom: asientos.tipcom,
         desdeNum: asientos.desdeNum,
         hastaNum: asientos.hastaNum,
         desdeFecha: asientos.desdeFecha,
         hastaFecha: asientos.hastaFecha,
         nombrearchivo: ['', [Validators.required, Validators.minLength(3)]],
         otrapagina: ''
      });
   }

   colocaColor(colores: any) {
      document.documentElement.style.setProperty('--bgcolor1', colores[0]);
      const cabecera = document.querySelector('.cabecera');
      if (cabecera) cabecera.classList.add('nuevoBG1')
      document.documentElement.style.setProperty('--bgcolor2', colores[1]);
      const detalle = document.querySelector('.detalle');
      if (detalle) detalle.classList.add('nuevoBG2');
   }

   get f() { return this.formImprimir.controls; }

   changeReporte() { this.opcreporte = +this.formImprimir.value.reporte; }

   impriexpor() { this.swimprimir = !this.swimprimir; }

   retornar() { this.router.navigate(['asientos']); }

   //Recupera los datos de cada reporte
   async imprimir() {
      this.swbotones = true;
      this.swcalculando = true;
      let fecha = this.formImprimir.value.fecha;
      switch (this.opcreporte) {
         case 1:  // Lista de asientos
            try {
               let desdeNum: number = 1;
               if (this.formImprimir.value.desdeNum != null) { desdeNum = this.formImprimir.value.desdeNum; }
               let hastaNum: number = 999999999;
               if (this.formImprimir.value.hastaNum != null) { hastaNum = this.formImprimir.value.hastaNum; }
               if (this.formImprimir.value.tipcom == 0) {   //Asientos
                  this._asientos = await this.asiService.getAsientosAsync(1, desdeNum, hastaNum,
                     this.formImprimir.value.desdeFecha, this.formImprimir.value.hastaFecha)
               } else {    //Comprobantes
                  this._asientos = await this.asiService.getComprobantesAsync(2, this.formImprimir.value.tipcom, desdeNum, hastaNum,
                     this.formImprimir.value.desdeFecha, this.formImprimir.value.hastaFecha)
               }
               this.swcalculando = false;
               if (this.swimprimir) this.txtcalculando = 'Mostrar'
               else this.txtcalculando = 'Descargar'
            } catch (error) {
               console.error('Error al obtener los asientos:', error);
            }
            break;
         case 2:  //Detalle de asientos
            try {
               let desdeNum: number = 1;
               if (this.formImprimir.value.desdeNum != null) { desdeNum = this.formImprimir.value.desdeNum; }
               let hastaNum: number = 999999999;
               if (this.formImprimir.value.hastaNum != null) { hastaNum = this.formImprimir.value.hastaNum; }
               if (this.formImprimir.value.tipcom == 0) {   //Detalle de Asientos
                  this._asientos = await this.tranService.tranAsientosAsync(1, desdeNum, hastaNum,
                     this.formImprimir.value.desdeFecha, this.formImprimir.value.hastaFecha)
               } else {    //Detalle de Comprobantes
                  this._asientos = await this.asiService.getComprobantesAsync(2, this.formImprimir.value.tipcom, desdeNum, hastaNum,
                     this.formImprimir.value.desdeFecha, this.formImprimir.value.hastaFecha)
               }
               this.swcalculando = false;
               if (this.swimprimir) this.txtcalculando = 'Mostrar'
               else this.txtcalculando = 'Descargar'
            } catch (error) {
               console.error('Error al obtener los asientos:', error);
            }
            break;
      }
   }

   //Muestra cada reporte
   imprime() {
      this.swbotones = false; this.swcalculando = false; this.txtcalculando = 'Calculando'
      switch (this.opcreporte) {
         case 1:  //Lista de asientos
            if (this.swimprimir) this.imprimeAsientos();
            else this.exportaAsientos();
            break;
         case 2:  //Detalle de asientos
            if (this.swimprimir) this.imprimeDetalle();
            else this.exportaDetalle();
            break;
      }
   }

   opcionTipcom() {
      if (this.formImprimir.value.tipcom == 0) return "Asientos";
      if (this.formImprimir.value.tipcom == 1) return "Ingresos";
      if (this.formImprimir.value.tipcom == 2) return "Egresos";
      if (this.formImprimir.value.tipcom == 3) return "Diarios Contabilidad";
      if (this.formImprimir.value.tipcom == 4) return "Diarios Ingreso";
      if (this.formImprimir.value.tipcom == 5) return "Diarios Egreso";
      return '';
   }

   imprimeAsientos() {
      this.otrapagina = this.formImprimir.value.otrapagina;
      const doc = new jsPDF('l', 'mm', 'a4', true);
      let m_izquierda = 10;
      doc.setFont("times", "bold"); doc.setFontSize(16); doc.text("EpmapaT", m_izquierda, 10);
      doc.setFont("times", "bold"); doc.setFontSize(12); doc.text("Lista de Asientos", m_izquierda, 16);

      let m_desde = 0;
      if (this.formImprimir.value.desdeNum != null && this.formImprimir.value.hastaNum != null) {
         doc.setFontSize(11); doc.text(this.opcionTipcom() + " desde el " + this.formImprimir.value.desdeNum + ' hasta el ' + this.formImprimir.value.hastaNum, m_izquierda, 21);
         m_desde = 80;
      }
      doc.setFont("times", "bold"); doc.setFontSize(11); doc.text(this.opcionTipcom() + " del " + this.formImprimir.value.desdeFecha + ' al ' + this.formImprimir.value.hastaFecha, m_izquierda + m_desde, 21);

      const datos: any = [];
      let sumtotdeb = 0;
      let sumtotcre = 0;
      let i = 0;
      this._asientos.forEach(() => {
         sumtotdeb = sumtotdeb + this._asientos[i].totdeb;
         sumtotcre = sumtotcre + this._asientos[i].totcre;
         datos.push([this._asientos[i].asiento, this.comprobante(this._asientos[i].tipcom, this._asientos[i].compro),
         this._asientos[i].fecha, this._asientos[i].intdoc.nomdoc + ' ' + this._asientos[i].numdoc, formatNumber(this._asientos[i].totdeb),
         formatNumber(this._asientos[i].totcre), this._asientos[i].idbene.nomben, this._asientos[i].glosa]);
         i++;
      });
      datos.push(['', '', '', 'TOTAL', formatNumber(sumtotdeb), formatNumber(sumtotcre)]);

      autoTable(doc, {
         head: [['Asie', 'Cmprbnt', 'Fecha', 'Documento', 'Debito', 'Crédito', 'Beneficiario', 'Descripción']],
         theme: 'grid',
         headStyles: { fillColor: [68, 103, 114], fontStyle: 'bold', halign: 'center' },
         styles: { font: 'helvetica', fontSize: 8, cellPadding: 1, halign: 'center' },

         columnStyles: {
            0: { halign: 'center', cellWidth: 10 },
            1: { halign: 'center', cellWidth: 16 },
            2: { halign: 'center', cellWidth: 18 },
            3: { halign: 'left', cellWidth: 30, fontSize: 7 },
            4: { halign: 'right', cellWidth: 20 },
            5: { halign: 'right', cellWidth: 20 },
            6: { halign: 'left', cellWidth: 50 },
            7: { halign: 'left', cellWidth: 118, fontSize: 7 },
         },
         margin: { left: m_izquierda - 1, top: 24, right: 6, bottom: 13 },
         body: datos,

         didParseCell: function (hookData) {
            if (hookData.column.index == 6 && hookData.cell.text.toString() == '(Ninguno)') { hookData.cell.text = ['']; }
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

   comprobante(tipcom: number, compro: number): string {
      if (tipcom == 1) return 'I-' + compro.toString();
      if (tipcom == 2) return 'E-' + compro.toString();
      if (tipcom == 3) return 'DC-' + compro.toString();
      if (tipcom == 4) return 'DI-' + compro.toString();
      if (tipcom == 5) return 'DE-' + compro.toString();
      return '';
   }

   imprimeDetalle() {
      this.otrapagina = this.formImprimir.value.otrapagina;
      const doc = new jsPDF('l', 'mm', 'a4', true);
      let m_izquierda = 10;
      doc.setFont("times", "bold"); doc.setFontSize(16); doc.text("EpmapaT", m_izquierda, 10);
      doc.setFont("times", "bold"); doc.setFontSize(14); doc.text("Detalle de Asientos", m_izquierda, 16);
      doc.setFont("times", "bold"); doc.setFontSize(12); doc.text("DESDE: " + this.formImprimir.value.desdeNum + ' HASTA: ' + this.formImprimir.value.hastaNum, m_izquierda, 21);

      let antasiento = this._asientos[0].idasiento.asiento;
      let i = 0;
      let datos: any = [];

      let debe = ''; let haber = ''; let nomben = '';
      let totdebe = 0; let tothaber = 0;
      this._asientos.forEach(() => {
         if (antasiento == this._asientos[i].idasiento.asiento) {
            debe = ''; haber = '';
            if (this._asientos[i].debcre == 1) {
               debe = formatNumber(this._asientos[i].valor);
               totdebe = totdebe + this._asientos[i].valor;
            }
            else {
               haber = formatNumber(this._asientos[i].valor);
               tothaber = tothaber + this._asientos[i].valor;
            };
            nomben = '';
            if (this._asientos[i].idbene.idbene != 1) nomben = this._asientos[i].idbene.nomben;
            datos.push([this._asientos[i].idcuenta.codcue, this._asientos[i].idcuenta.nomcue, nomben, debe, haber, this._asientos[i].intdoc.nomdoc + ' ' + this._asientos[i].numdoc]);
         } else {
            datos.push(['TOTAL:', , , formatNumber(totdebe), formatNumber(tothaber),]);
            totdebe = 0; tothaber = 0;
            // Encabezado del Asiento
            const head = [];
            let compro = comprobante(this._asientos[i - 1].idasiento.tipcom, this._asientos[i - 1].idasiento.compro)
            head.push(['ASIENTO: ' + this._asientos[i - 1].idasiento.asiento + '  ' + compro + ' DEL ' + this._asientos[i - 1].idasiento.fecha]);
            head.push([this._asientos[i - 1].idasiento.glosa]);
            autoTable(doc, {
               head: head,
               styles: { halign: 'left' },
               margin: { left: m_izquierda - 1, top: 24, right: 6, bottom: 13 },
            });

            autoTable(doc, {
               head: [['Cuenta', 'Denominación', 'Beneficiario', 'Debe', 'Haber', 'Documento']],
               headStyles: {
                  fillColor: [230, 230, 230], // Color de fondo gris claro
                  textColor: [0, 0, 0], // Color de texto negro
               },
               margin: { left: m_izquierda - 1, right: 6 },
               columnStyles: { 3: { halign: 'right' }, 4: { halign: 'right' } },

               body: datos,

               didParseCell: function (hookData) {
                  //Cabecera Debe y Haber a la derecha
                  if (hookData.row.index === 0 && (hookData.column.index === 3 || hookData.column.index === 4)) {
                     hookData.cell.styles.halign = 'right';
                  }
                  if (hookData.column.index === 0 && hookData.cell.raw === 'TOTAL:') {
                     Object.values(hookData.row.cells).forEach(function (cell) { cell.styles.fontStyle = 'bold'; });
                  }
               }
            });
            datos = [];
            debe = ''; haber = '';
            if (this._asientos[i].debcre == 1) {
               debe = formatNumber(this._asientos[i].valor);
               totdebe = this._asientos[i].valor;
               tothaber = 0;
            }
            else {
               haber = formatNumber(this._asientos[i].valor);
               totdebe = 0;
               tothaber = this._asientos[i].valor;
            }
            nomben = '';
            if (this._asientos[i].idbene.idbene != 1) nomben = this._asientos[i].idbene.nomben;
            datos.push([this._asientos[i].idcuenta.codcue, this._asientos[i].idcuenta.nomcue, nomben, debe, haber, this._asientos[i].intdoc.nomdoc + ' ' + this._asientos[i].numdoc]);
         }
         antasiento = this._asientos[i].idasiento.asiento;
         i++
      });
      //Muestra el último
      datos.push(['TOTAL:', , , formatNumber(totdebe), formatNumber(tothaber),]);
      const head = [];
      let compro = comprobante(this._asientos[i - 1].idasiento.tipcom, this._asientos[i - 1].idasiento.compro)
      head.push(['ASIENTO: ' + this._asientos[i - 1].idasiento.asiento + '  ' + compro + ' DEL ' + this._asientos[i - 1].idasiento.fecha]);
      head.push([this._asientos[i - 1].idasiento.glosa]);

      autoTable(doc, {
         head: head,
         styles: { halign: 'left' },
         margin: { left: m_izquierda - 1, top: 24, right: 6, bottom: 13 },
      });
      autoTable(doc, {
         head: [['Cuenta', 'Denominación', 'Beneficiario', 'Debe', 'Haber', 'Documento']],
         headStyles: {
            fillColor: [230, 230, 230], // Color de fondo gris claro
            textColor: [0, 0, 0], // Color de texto negro
         },
         margin: { left: m_izquierda - 1, right: 6 },
         columnStyles: { 3: { halign: 'right' }, 4: { halign: 'right' } },
         body: datos,

         didParseCell: function (hookData) {
            //Cabecera Debe y Haber a la derecha
            if (hookData.row.index === 0 && (hookData.column.index === 3 || hookData.column.index === 4)) {
               hookData.cell.styles.halign = 'right';
            }
            if (hookData.column.index === 0 && hookData.cell.raw === 'TOTAL:') {
               Object.values(hookData.row.cells).forEach(function (cell) { cell.styles.fontStyle = 'bold'; });
            }
         }
      });
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

   exportaAsientos() {
      this.nombrearchivo = this.formImprimir.value.nombrearchivo;
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(this.nombrearchivo);
      // Fila 1
      worksheet.addRow(['', '', '', 'Lista de Asientos']);
      const cellD1 = worksheet.getCell('D1');
      const customStyle = { font: { name: 'Times New Roman', bold: true, size: 14, color: { argb: '002060' } } };
      cellD1.font = customStyle.font;

      // Fila 2
      if (this.formImprimir.value.desdeNum != null && this.formImprimir.value.hastaNum != null) {
         worksheet.addRow(['', '', '', this.opcionTipcom() + ' desde el ' + this.formImprimir.value.desdeNum + ' hasta el ' + this.formImprimir.value.hastaNum + ' del ' + this.formImprimir.value.desdeFecha + ' al ' + this.formImprimir.value.hastaFecha]);
      } else {
         worksheet.addRow(['', '', '', this.opcionTipcom() + ' del ' + this.formImprimir.value.desdeFecha + ' al ' + this.formImprimir.value.hastaFecha]);
      }
      const cellD2 = worksheet.getCell('D2');
      const customStyle2 = { font: { name: 'Times New Roman', bold: true, size: 10, color: { argb: '002060' } } };
      cellD2.font = customStyle2.font;
      // Fila 3: Anterior
      // if (this.anterior != 0) {
      //    worksheet.addRow(['', '', '', '', '', 'Anterior', this.anterior]);
      //    const cellF3 = worksheet.getCell('F3');
      //    cellF3.font = customStyle2.font;
      //    const cellG3 = worksheet.getCell('G3');
      //    const customStyleG3 = { font: { name: 'Times New Roman', bold: true, size: 10, color: { argb: '002060' } } };
      //    const numeroStyleG3 = { numFmt: '#,##0.00' };
      //    cellG3.style = numeroStyleG3;
      //    cellG3.font = customStyleG3.font;
      // } else worksheet.addRow([]);

      //Fila 3 Cabecera
      const headerRowCell = worksheet.addRow(['Asie', 'Cmprbnt', 'Fecha', 'Documento', 'Débito', 'Crédito', 'Beneficiario', 'Descripción']);
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
      this._asientos.forEach(() => {
         let nomben: string;
         if (this._asientos[i].idbene.idbene == 1) nomben = ''
         else nomben = this._asientos[i].idbene.nomben
         const row = [this._asientos[i].idasiento.asiento, this.comprobante(this._asientos[i].tipcom, this._asientos[i].compro), this._asientos[i].fecha,
         this._asientos[i].intdoc.nomdoc + ' ' + this._asientos[i].numdoc, this._asientos[i].totdeb, this._asientos[i].totcre, nomben, this._asientos[i].glosa];
         worksheet.addRow(row);
         i++;
      });

      // Establece el ancho de las columnas
      const anchoConfig = [
         { columnIndex: 1, widthInChars: 8 },
         { columnIndex: 2, widthInChars: 12 },
         { columnIndex: 3, widthInChars: 12 },
         { columnIndex: 4, widthInChars: 20 },
         { columnIndex: 5, widthInChars: 16 },
         { columnIndex: 6, widthInChars: 16 },
         { columnIndex: 7, widthInChars: 40 },
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
      let columnsToRigth = [5, 6];
      columnsToRigth.forEach(columnIndex => {
         worksheet.getColumn(columnIndex).eachCell({ includeEmpty: true }, cell => {
            cell.alignment = { horizontal: 'right' };
         });
      });

      // Formato numérico con decimales
      const numeroStyle1 = { numFmt: '#,##0.00' };
      const columnsToFormat1 = [5, 6];
      for (let i = 4; i <= this._asientos.length + 3; i++) {
         columnsToFormat1.forEach(columnIndex => {
            const cell = worksheet.getCell(i, columnIndex);
            cell.style = numeroStyle1;
         });
      }

      //Coloca la fila de Totales
      worksheet.addRow(['', '', '', 'TOTAL']);
      worksheet.getCell('D' + (this._asientos.length + 4).toString()).font = { bold: true }

      let celdaE = worksheet.getCell('E' + (this._asientos.length + 4).toString());
      celdaE.numFmt = '#,##0.00';
      celdaE.font = { bold: true };
      celdaE.value = { formula: 'SUM(E4:' + 'E' + (this._asientos.length + 3).toString() + ')', result: 0, sharedFormula: undefined, date1904: false };

      let celdaF = worksheet.getCell('F' + (this._asientos.length + 4).toString());
      celdaF.numFmt = '#,##0.00';
      celdaF.font = { bold: true }
      celdaF.value = { formula: 'SUM(F4:' + 'F' + (this._asientos.length + 3).toString() + ')', result: 0, sharedFormula: undefined, date1904: false };

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

   exportaDetalle() {
      this.nombrearchivo = this.formImprimir.value.nombrearchivo;
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(this.nombrearchivo);

      const customStyle14 = { font: { name: 'Times New Roman', bold: true, size: 14, color: { argb: '002060' } } };
      const customStyle12 = { font: { name: 'Times New Roman', bold: true, size: 12, color: { argb: '002060' } } };
      const customStyle11 = { font: { name: 'Times New Roman', bold: true, size: 11, color: { argb: '002060' } } };

      // Fila 1
      worksheet.addRow(['Detalle de Asientos']);
      worksheet.getCell('A1').font = customStyle14.font

      // Fila 2
      if (this.formImprimir.value.desdeNum != null && this.formImprimir.value.hastaNum != null) {
         worksheet.addRow([this.opcionTipcom() + ' desde el ' + this.formImprimir.value.desdeNum + ' hasta el ' + this.formImprimir.value.hastaNum + ' del ' + this.formImprimir.value.desdeFecha + ' al ' + this.formImprimir.value.hastaFecha]);
      } else {
         worksheet.addRow([this.opcionTipcom() + ' del ' + this.formImprimir.value.desdeFecha + ' al ' + this.formImprimir.value.hastaFecha]);
      }
      worksheet.getCell('A2').font = customStyle12.font;

      //Fila 3 Cabecera
      const headerRowCell = worksheet.addRow(['Cuenta', 'Asiento / Denominación', 'Beneficiario', 'Debe', 'Haber', 'Concepto / Documento']);
      headerRowCell.eachCell(cell => {
         cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '002060' } };
         cell.font = { bold: true, name: 'Times New Roman', color: { argb: 'FFFFFF' } };
      });

      // Agrega los datos a la hoja de cálculo
      let antasiento = 0;
      let i = 0;
      let nomben: string;
      let row: any;
      this._asientos.forEach(() => {
         if (antasiento != this._asientos[i].idasiento.asiento) {
            if (i > 0) { worksheet.addRow([]) };
            worksheet.addRow([" ", this._asientos[i].idasiento.asiento + '   ' +
               comprobante(this._asientos[i].idasiento.tipcom, this._asientos[i].idasiento.compro) + ' DEL ' + this._asientos[i].idasiento.fecha, ,
               this._asientos[i].idasiento.totdeb, this._asientos[i].idasiento.totcre, this._asientos[i].idasiento.glosa ]);
            const lastRowNumber = worksheet.lastRow!.number;
            worksheet.getCell('B' + lastRowNumber).font = customStyle11.font
            worksheet.getCell('D' + lastRowNumber).font = customStyle11.font;
            worksheet.getCell('E' + lastRowNumber).font = customStyle11.font;

            antasiento = this._asientos[i].idasiento.asiento;
         }
         if (this._asientos[i].idbene.idbene == 1) nomben = ''
         else nomben = this._asientos[i].idbene.nomben;
         row = [];
         if (this._asientos[i].debcre == 1) { row = [this._asientos[i].codcue, this._asientos[i].idcuenta.nomcue, nomben, this._asientos[i].valor, , this._asientos[i].intdoc.nomdoc + ' ' + this._asientos[i].numdoc] }
         else { row = [this._asientos[i].codcue, this._asientos[i].idcuenta.nomcue, nomben, , this._asientos[i].valor, this._asientos[i].intdoc.nomdoc + ' ' + this._asientos[i].numdoc] };

         worksheet.addRow(row);
         i++;
      });

      // Establece el ancho de las columnas
      const anchoConfig = [
         { columnIndex: 1, widthInChars: 12 },
         { columnIndex: 2, widthInChars: 50 },
         { columnIndex: 3, widthInChars: 30 },
         { columnIndex: 4, widthInChars: 16 },
         { columnIndex: 5, widthInChars: 16 },
         { columnIndex: 6, widthInChars: 100 },
      ];
      anchoConfig.forEach(config => {
         worksheet.getColumn(config.columnIndex).width = config.widthInChars;
      });

      // Columnas a la derecha
      let columnsToRigth = [4, 5];
      columnsToRigth.forEach(columnIndex => {
         worksheet.getColumn(columnIndex).eachCell({ includeEmpty: true }, cell => {
            cell.alignment = { horizontal: 'right' };
         });
      });

      // Formato numérico
      const lastRowNumber = worksheet.lastRow!.number;
      const columnsToFormat = [4, 5];
      for (let i = 4; i <= lastRowNumber + 3; i++) {
         columnsToFormat.forEach(columnIndex => {
            worksheet.getCell(i, columnIndex).style = { numFmt: '#,##0.00' };
            //Celdas en Negrita
            const celdaAi = worksheet.getCell('A' + i.toString()).value;
            if (celdaAi == " ") {
               for (let col = 4; col <= 5; col++) {
                  worksheet.getCell(String.fromCharCode(64 + col) + i.toString()).font = { bold: true };
               }
            }
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

//Código Tipo de Comprobante
function comprobante(tipcom: number, compro: number): string {
   if (tipcom == 1) return 'I-' + compro;
   if (tipcom == 2) return 'E-' + compro;
   if (tipcom == 3) return 'DC-' + compro;
   if (tipcom == 4) return 'DI-' + compro;
   if (tipcom == 5) return 'DE-' + compro;
   return '';
}
