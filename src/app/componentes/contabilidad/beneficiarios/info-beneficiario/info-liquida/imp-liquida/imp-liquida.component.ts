import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { BenextranService } from 'src/app/servicios/contabilidad/benextran.service';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as ExcelJS from 'exceljs';
import { PagoscobrosService } from 'src/app/servicios/contabilidad/pagoscobros.service';

@Component({
   selector: 'app-imp-liquida',
   templateUrl: './imp-liquida.component.html',
   styleUrls: ['./imp-liquida.component.css']
})
export class ImpLiquidaComponent implements OnInit {

   swimprimir: boolean = true;
   formImprimir: FormGroup;
   formMovimiento: FormGroup;
   idbenxtra: number;
   opcreporte: number = 1;
   otrapagina: boolean = false;
   swbotones: boolean = false;
   swcalculando: boolean = false;
   txtcalculando = 'Calculando';
   _liquida: any;
   anterior: number;
   sumvalor: number;
   sumhaber: number;
   pdfgenerado: string;
   nombrearchivo: string;
   sumanticipo: number;
   sumcxc: number;
   sumft: number;
   sumcxp: number;
   sumtotpagcob: number;
   sumsaldo: number;

   constructor(public fb: FormBuilder, private router: Router, private bxtService: BenextranService,
      private pagoscobroService: PagoscobrosService) { }

   ngOnInit(): void {

      sessionStorage.setItem('ventana', '/beneficiarios');
      let coloresJSON = sessionStorage.getItem('/beneficiarios');
      if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));

      const liquidaJSON = sessionStorage.getItem('liquidaToImpExp');
      if (liquidaJSON) {
         const liquida = JSON.parse(liquidaJSON);
         this.idbenxtra = liquida.idbenxtra;
         this.formMovimiento = this.fb.group({
            nomben: liquida.nomben,
            tiptran: liquida.tiptran,
            valor: liquida.valor,
            fecha: liquida.fecha
         });

         this.formImprimir = this.fb.group({
            reporte: '1',
            // desde: movibene.desde,
            // hasta: movibene.hasta,
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

   retornar() { this.router.navigate(['info-liquida']); }

   //Recupera los datos de cada reporte
   async imprimir() {
      this.swbotones = true;
      this.swcalculando = true;
      let fecha = this.formImprimir.value.fecha;
      switch (this.opcreporte) {
         case 1:  //Liquidacion(es)
            this.pdfgenerado = 'liquidaciones_' + this.formMovimiento.value.nomben;
            try {
               this._liquida = await this.pagoscobroService.getByIdbenxtraAsync(this.idbenxtra);
               this.total();
               this.swcalculando = false;
               if (this.swimprimir) this.txtcalculando = 'Mostrar'
               else this.txtcalculando = 'Descargar'
            } catch (error) {
               console.error('Error al obtener las liquidaciones:', error);
            }
            break;
      }
   }

   comprobante(tipcom: number, compro: number): string {
      if (tipcom == 1) return 'I-' + compro.toString();
      if (tipcom == 2) return 'E-' + compro.toString();
      if (tipcom == 3) return 'DC-' + compro.toString();
      if (tipcom == 4) return 'DI-' + compro.toString();
      if (tipcom == 5) return 'DE-' + compro.toString();
      return '';
   }

   total() {
      this.sumvalor = 0;
      let saldo = this.formMovimiento.value.valor;
      this._liquida.forEach((liquida: any) => {
         this.sumvalor = this.sumvalor + liquida.valor;
         liquida.saldo = saldo - this.sumvalor;

      });
   }

   //Muestra cada reporte
   imprime() {
      this.swbotones = false; this.swcalculando = false; this.txtcalculando = 'Calculando'
      switch (this.opcreporte) {
         case 1:  // Liquidaciones
            if (this.swimprimir) this.imprimeLiquida();
            else this.exportaLiquida();
            break;
      }
   }

   imprimeLiquida() {
      this.otrapagina = this.formImprimir.value.otrapagina;
      const doc = new jsPDF('p', 'mm', 'a4', true);
      let m_izquierda = 10;
      doc.setFont("times", "bold"); doc.setFontSize(16); doc.text("EpmapaT", m_izquierda, 10);
      doc.setFont("times", "bold"); doc.setFontSize(12); doc.text("Liquidacion(es): " + this.formMovimiento.value.nomben, m_izquierda, 16);
      doc.setFont("times", "bold"); doc.setFontSize(11); doc.text(this.formMovimiento.value.tiptran + ': ' + this.formMovimiento.value.valor + '   Fecha: ' +
         this.formMovimiento.value.fecha, m_izquierda, 22);

      const datos: any = [];
      let i = 0;
      this._liquida.forEach(() => {
         datos.push([this._liquida[i].inttra.idasiento.fecha, this._liquida[i].inttra.idasiento.asiento,
         this.comprobante(this._liquida[i].inttra.idasiento.tipcom, this._liquida[i].inttra.idasiento.compro),
         formatNumber(this._liquida[i].valor), formatNumber(this._liquida[i].saldo), this._liquida[i].inttra.descri]);
         i++;
      });
      datos.push(['', '', 'TOTAL: ' + this._liquida.length, formatNumber(this.sumvalor)]);

      autoTable(doc, {
         head: [['Fecha', 'Asie', 'Cmprbnt', 'Liquida', 'Saldo', 'Descripción']],
         theme: 'grid',
         headStyles: { fillColor: [68, 103, 114], fontStyle: 'bold', halign: 'center' },
         styles: { font: 'helvetica', fontSize: 8, cellPadding: 1, halign: 'center' },

         columnStyles: {
            0: { halign: 'center', cellWidth: 18 },
            1: { halign: 'center', cellWidth: 10 },
            2: { halign: 'center', cellWidth: 16 },
            3: { halign: 'right', cellWidth: 20 },
            4: { halign: 'right', cellWidth: 20 },
            5: { halign: 'left', cellWidth: 111, fontSize: 7 },
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

   exportaLiquida() {
      this.nombrearchivo = this.formImprimir.value.nombrearchivo;
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(this.nombrearchivo);

      const customStyle14 = { font: { name: 'Times New Roman', bold: true, size: 14, color: { argb: '002060' } } };
      const customStyle12 = { font: { name: 'Times New Roman', bold: true, size: 12, color: { argb: '002060' } } };
      // Fila 1
      worksheet.addRow(['', 'Liquidacioness ']);
      worksheet.getCell('B1').font = customStyle14.font;
      // Fila 2
      worksheet.addRow(['', this.formMovimiento.value.nomben]);
      worksheet.getCell('B2').font = customStyle12.font;

      // Fila 3
      worksheet.addRow(['', this.formMovimiento.value.tiptran, , , this.formMovimiento.value.valor,'Fecha: '+ this.formMovimiento.value.fecha ]);
      worksheet.getCell('B3').font = customStyle12.font;
      worksheet.getCell('E3').font = customStyle12.font;
      worksheet.getCell('F3').font = customStyle12.font;

      //Fila 4 Cabecera 
      const headerRowCell = worksheet.addRow(['Fecha', 'Asie', 'Cmprbnt', 'Liquida', 'Saldo', 'Descripción']);
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
      this._liquida.forEach(() => {
         const row = [this._liquida[i].inttra.idasiento.fecha, this._liquida[i].inttra.idasiento.asiento,
         this.comprobante(this._liquida[i].inttra.idasiento.tipcom, this._liquida[i].inttra.idasiento.compro),
         this._liquida[i].valor, this._liquida[i].saldo, this._liquida[i].inttra.descri];
         worksheet.addRow(row);
         i++;
      });

      //Coloca la fila del Total
      worksheet.addRow(['', '', 'TOTAL']);
      worksheet.getCell('D' + (this._liquida.length + 5).toString()).font = { bold: true }

      // Coloca negrita y formato numerico a la fila de totales
      const lastRowIndex = this._liquida.length + 5; // Último índice de fila
      for (let colIndex = 0; colIndex < 10; colIndex++) { // Recorrer columnas
         const cell = worksheet.getCell(String.fromCharCode(65 + colIndex) + lastRowIndex.toString()); // Obtener celda
         cell.font = { bold: true }; // Aplicar negrita
         cell.numFmt = '#,##0.00';
      }

      let celdaD = worksheet.getCell('D' + (this._liquida.length + 5).toString());
      celdaD.value = { formula: 'SUM(D5:' + 'D' + (this._liquida.length + 4).toString() + ')', result: 0, sharedFormula: undefined, date1904: false };


      // Establece el ancho de las columnas
      const anchoConfig = [
         { columnIndex: 1, widthInChars: 12 },
         { columnIndex: 2, widthInChars: 8 },
         { columnIndex: 3, widthInChars: 10 },
         { columnIndex: 4, widthInChars: 14 },
         { columnIndex: 5, widthInChars: 14 },
         { columnIndex: 6, widthInChars: 120 },
      ];
      anchoConfig.forEach(config => {
         worksheet.getColumn(config.columnIndex).width = config.widthInChars;
      });

      // Columnas centradas 
      const columnsToCenter = [1, 3];
         columnsToCenter.forEach(columnIndex => {
            worksheet.getColumn(columnIndex).eachCell({ includeEmpty: true }, cell => {
               cell.alignment = { vertical: 'middle', horizontal: 'center' };
            });
         });
      // Columnas a la derecha 
      let columnsToRigth = [4, 5];
      columnsToRigth.forEach(columnIndex => {
         worksheet.getColumn(columnIndex).eachCell({ includeEmpty: true }, cell => {
            cell.alignment = { horizontal: 'right' };
         });
      });

      // Formato numérico con decimales
      const numeroStyle1 = { numFmt: '#,##0.00' };
      const columnsToFormat1 = [4, 5];
      for (let i = 5; i <= this._liquida.length + 4; i++) {
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