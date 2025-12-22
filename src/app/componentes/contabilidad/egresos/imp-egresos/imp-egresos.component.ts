import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AsientosService } from 'src/app/servicios/contabilidad/asientos.service';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as ExcelJS from 'exceljs';

@Component({
   selector: 'app-imp-egresos',
   templateUrl: './imp-egresos.component.html',
   styleUrls: ['./imp-egresos.component.css']
})
export class ImpEgresosComponent implements OnInit {

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

   constructor(public fb: FormBuilder, private router: Router, private asiService: AsientosService) { }

   ngOnInit(): void {
      sessionStorage.setItem('ventana', '/egresos');
      let coloresJSON = sessionStorage.getItem('/egresos');
      if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));

      const asientosJSON = sessionStorage.getItem('egresosToImpExp');
      if (asientosJSON) {
         const asientos = JSON.parse(asientosJSON);
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

   retornar() { this.router.navigate(['egresos']); }

   //Recupera los datos de cada reporte
   async imprimir() {
      this.swbotones = true;
      this.swcalculando = true;
      let fecha = this.formImprimir.value.fecha;
      switch (this.opcreporte) {
         case 1:  // Lista de Egresos
            try {
               //Numeros
               let desdeNum: number = 1;
               if (this.formImprimir.value.desdeNum != null) { desdeNum = this.formImprimir.value.desdeNum; }
               let hastaNum: number = 999999999;
               if (this.formImprimir.value.hastaNum != null) { hastaNum = this.formImprimir.value.hastaNum; }
               //Comprobantes
               this._asientos = await this.asiService.getComprobantesAsync(2, 2, desdeNum, hastaNum,
                  this.formImprimir.value.desdeFecha, this.formImprimir.value.hastaFecha)
               this.swcalculando = false;
               if (this.swimprimir) this.txtcalculando = 'Mostrar'
               else this.txtcalculando = 'Descargar'
            } catch (error) {
               console.error('Error al obtener los Egresos:', error);
            }
            break;
         case 2:  //Detalle de Egresos
         // try {
         //    this._asientos = await this.facService.getByFechacobroTotAsync(fecha);
         //    // this.sw1 = true;
         //    this.swcalculando = false;
         //    if(this.swimprimir) this.txtcalculando = 'Mostrar'
         //    else this.txtcalculando = 'Descargar'
         // } catch (error) {
         //    console.error('Error al obtener las Planillas:', error);
         // }
         // break;
      }
   }

   //Muestra cada reporte
   imprime() {
      this.swbotones = false; this.swcalculando = false; this.txtcalculando = 'Calculando'
      switch (this.opcreporte) {
         case 1:  //Lista de asientos
            if (this.swimprimir) this.imprimeEgresos();
            else this.exportaEgresos();
            break;
         case 2:  //Detalle de Egresos
         // if (this.swimprimir) this.imprimeDetegresos();
         // else this.exportaDetegresos();
         // break;
      }
   }

   imprimeEgresos() {
      this.otrapagina = this.formImprimir.value.otrapagina;
      const doc = new jsPDF('l', 'mm', 'a4', true);
      let m_izquierda = 10;
      doc.setFont("times", "bold"); doc.setFontSize(16); doc.text("EpmapaT", m_izquierda, 10);
      doc.setFont("times", "bold"); doc.setFontSize(12); doc.text("Lista de Egresos", m_izquierda, 16);

      let m_desde = 0;
      if (this.formImprimir.value.desdeNum != null && this.formImprimir.value.hastaNum != null) {
         doc.setFontSize(11); doc.text('Desde el ' + this.formImprimir.value.desdeNum + ' hasta el ' + this.formImprimir.value.hastaNum, m_izquierda, 21);
         m_desde = 80;
      }
      doc.setFont("times", "bold"); doc.setFontSize(11); doc.text("Del " + this.formImprimir.value.desdeFecha + ' al ' + this.formImprimir.value.hastaFecha, m_izquierda + m_desde, 21);

      const datos: any = [];
      let sumtotdeb = 0;
      let sumtotcre = 0;
      let i = 0;
      this._asientos.forEach(() => {
         sumtotdeb = sumtotdeb + this._asientos[i].totdeb;
         sumtotcre = sumtotcre + this._asientos[i].totcre;
         datos.push([ this._asientos[i].compro, this._asientos[i].asiento,
         this._asientos[i].fecha, this._asientos[i].intdoc.nomdoc + ' ' + this._asientos[i].numdoc, formatNumber(this._asientos[i].totdeb),
         formatNumber(this._asientos[i].totcre), this._asientos[i].idbene.nomben, this._asientos[i].glosa]);
         i++;
      });
      datos.push(['', '', '', 'TOTAL', formatNumber(sumtotdeb), formatNumber(sumtotcre)]);

      autoTable(doc, {
         head: [[ 'Egreso','Asie','Fecha','Documento','Debito','Crédito','Beneficiario','Descripción']],
         theme: 'grid',
         headStyles: { fillColor: [68, 103, 114], fontStyle: 'bold', halign: 'center' },
         styles: { font: 'helvetica', fontSize: 8, cellPadding: 1, halign: 'center' },

         columnStyles: {
            0: { halign: 'center', cellWidth: 12 },
            1: { halign: 'center', cellWidth: 16 },
            2: { halign: 'center', cellWidth: 18 },
            3: { halign: 'left', cellWidth: 30, fontSize: 7 },
            4: { halign: 'right', cellWidth: 20 },
            5: { halign: 'right', cellWidth: 20 },
            6: { halign: 'left', cellWidth: 50 },
            7: { halign: 'left', cellWidth: 116, fontSize: 7 },
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

   exportaEgresos() {
      this.nombrearchivo = this.formImprimir.value.nombrearchivo;
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(this.nombrearchivo);
      // Fila 1
      worksheet.addRow(['', '', '', 'Lista de Egresos']);
      const cellD1 = worksheet.getCell('D1');
      const customStyle = { font: { name: 'Times New Roman', bold: true, size: 14, color: { argb: '002060' } } };
      cellD1.font = customStyle.font;

      // Fila 2
      if( this.formImprimir.value.desdeNum != null && this.formImprimir.value.hastaNum != null ){
         worksheet.addRow(['', '', '', 'Desde el ' +this.formImprimir.value.desdeNum+' hasta el ' +this.formImprimir.value.hastaNum + ' del ' + this.formImprimir.value.desdeFecha + ' al ' + this.formImprimir.value.hastaFecha]);
      }else{
         worksheet.addRow(['', '', '',  'Del ' + this.formImprimir.value.desdeFecha + ' al ' + this.formImprimir.value.hastaFecha]);
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
      const headerRowCell = worksheet.addRow(['Egreso','Asie','Fecha','Documento','Débito','Crédito','Beneficiario','Descripción']);
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
         const row = [ this._asientos[i].compro, this._asientos[i].asiento,  this._asientos[i].fecha,
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
      console.log('celdaE: ', celdaE)

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

}

function formatNumber(num: number) {
   return num.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
}
