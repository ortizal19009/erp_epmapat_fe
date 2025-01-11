import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AsientosService } from 'src/app/servicios/contabilidad/asientos.service';
import { TransaciService } from 'src/app/servicios/contabilidad/transaci.service';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as ExcelJS from 'exceljs';

@Component({
   selector: 'app-imp-transaci',
   templateUrl: './imp-transaci.component.html',
   styleUrls: ['./imp-transaci.component.css']
})
export class ImpTransaciComponent implements OnInit {

   idasiento: number;
   swimprimir: boolean = true;
   iAsiento = {} as interfaceAsiento; //Interface para los datos del Asiento
   formImprimir: FormGroup;
   opcreporte: number = 1;
   otrapagina: boolean = false;
   swbotones: boolean = false;
   swcalculando: boolean = false;
   txtcalculando = 'Calculando';
   pdfgenerado: string;
   _transaci: any;
   nomcomprobante: string;
   nombrearchivo: string;

   constructor(public fb: FormBuilder, private router: Router,
      private asiService: AsientosService, private tranService: TransaciService) { }

   ngOnInit(): void {
      sessionStorage.setItem('ventana', '/transaci');
      let coloresJSON = sessionStorage.getItem('/transaci');
      if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));

      this.idasiento = +sessionStorage.getItem('idasientoToImpExp')!;
      if (this.idasiento) {
         this.formImprimir = this.fb.group({
            reporte: '1',
            nombrearchivo: ['', [Validators.required, Validators.minLength(3)]],
            otrapagina: ''
         });
         this.datosAsiento();
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

   datosAsiento() {
      this.idasiento = +sessionStorage.getItem('idasientoToImpExp')!;
      this.asiService.unAsiento(this.idasiento).subscribe({
         next: datos => {
            this.iAsiento.asiento = datos.asiento;
            this.iAsiento.fecha = datos.fecha;
            this.iAsiento.comprobante = this.codcomprobante(datos.tipcom) + datos.compro.toString();
            this.iAsiento.compro = datos.compro;
            // this.iAsiento.beneficiario = datos.idbene.nomben;
            // if (datos.intdoc.intdoc == 1) this.iAsiento.documento = datos.numdoc;
            // else this.iAsiento.documento = datos.intdoc.nomdoc + ' ' + datos.numdoc;
            this.iAsiento.glosa = datos.glosa;
         },
         error: err => console.error(err.error)
      });
   }

   impriexpor() { this.swimprimir = !this.swimprimir; }

   changeReporte() { this.opcreporte = +this.formImprimir.value.reporte; }

   get f() { return this.formImprimir.controls; }

   retornar() { this.router.navigate(['transaci']); }

   //Código y Nombre del Tipo de Comprobante
   codcomprobante(tipcom: number): string {
      if (tipcom == 1) {
         this.nomcomprobante = 'Comprobante de Ingreso';
         return 'I-'
      };
      if (tipcom == 2) {
         this.nomcomprobante = 'Comprobante de Egreso';
         return 'E-'
      };
      if (tipcom == 3) {
         this.nomcomprobante = 'Diario de Contabilidad';
         return 'DC-'
      };
      if (tipcom == 4) {
         this.nomcomprobante = 'Diario de Ingreso';
         return 'DI-'
      };
      if (tipcom == 5) {
         this.nomcomprobante = 'Diario de Egreso';
         return 'DE-'
      };
      return '';
   }

   async imprimir() {
      this.swbotones = true;
      this.swcalculando = true;
      // let fecha = this.formImprimir.value.fecha;
      switch (this.opcreporte) {
         case 1:  //Comprobante
            try {
               this._transaci = await this.tranService.getTransaciAsync(this.idasiento)
               this.swcalculando = false;
               if (this.swimprimir) this.txtcalculando = 'Mostrar'
               else this.txtcalculando = 'Descargar'
            } catch (error) {
               console.error('Error al obtener los datos del comprobante:', error);
            }
            break;
         case 2:  //Datos del asiento
            try {
               this._transaci = await this.tranService.getTransaciAsync(this.idasiento)
               this.swcalculando = false;
               if (this.swimprimir) this.txtcalculando = 'Mostrar'
               else this.txtcalculando = 'Descargar'
            } catch (error) {
               console.error('Error al obtener los datos del asiento:', error);
            }
            break;
      }
   }

   //Muestra cada reporte
   imprime() {
      this.swbotones = false; this.swcalculando = false; this.txtcalculando = 'Calculando'
      switch (this.opcreporte) {
         case 1:  //Lista de asientos
            if (this.swimprimir) this.imprimeComprobante();
            else this.exportaAsiento();
            break;
         case 2:  //Detalle de asientos
            if (this.swimprimir) this.imprimeAsiento();
            else this.exportaAsiento();
            break;
      }
   }

   imprimeComprobante() {
      this.otrapagina = this.formImprimir.value.otrapagina;
      const doc = new jsPDF('p', 'mm', 'a4', true);
      let m_izquierda = 20;
      doc.setFont("times", "bold"); doc.setFontSize(16); doc.text("EpmapaT", m_izquierda, 10);
      doc.setFont("times", "bold"); doc.setFontSize(12); doc.text(this.nomcomprobante + ' Nro: ' + this.iAsiento.compro, m_izquierda, 16);

      doc.setFontSize(10); doc.setFont("times", "bold");
      doc.text("FECHA: ", m_izquierda, 21);
      doc.text("CONCEPTO: ", m_izquierda, 26);

      doc.setFont("helvetica", "normal");
      doc.text(this.iAsiento.fecha.toString(), m_izquierda + 16, 21);
      doc.text(this.iAsiento.glosa.slice(0, 96), m_izquierda + 22, 26);

      const datos: any = [];
      let sumdebe = 0;
      let sumhaber = 0;
      let debe: number;
      let haber: number;
      let i = 0;
      this._transaci.forEach(() => {

         if (this._transaci[i].debcre == 1) {
            debe = this._transaci[i].valor;
            haber = 0;
            sumdebe = sumdebe + this._transaci[i].valor;
         } else {
            debe = 0;
            haber = this._transaci[i].valor;
            sumhaber = sumhaber + this._transaci[i].valor;
         }
         datos.push([this._transaci[i].codcue, this._transaci[i].idcuenta.nomcue, this._transaci[i].idbene.nomben, formatNumber(debe),
         formatNumber(haber)]);
         i++;
      });
      datos.push(['', 'TOTAL', '', formatNumber(sumdebe), formatNumber(sumhaber)]);

      autoTable(doc, {
         margin: { left: m_izquierda - 1, top: 30, right: 11, bottom: 13 },
         head: [['Cuenta', 'Denominación', 'Beneficiario', 'Debe', 'Haber']],
         theme: 'grid',
         headStyles: { fillColor: [68, 103, 114], fontStyle: 'bold', halign: 'center' },
         styles: { font: 'helvetica', fontSize: 8, cellPadding: 1, halign: 'center' },

         columnStyles: {
            0: { halign: 'left', cellWidth: 20 },
            1: { halign: 'left', cellWidth: 80 },
            2: { halign: 'left', cellWidth: 40, fontSize: 7 },
            3: { halign: 'right', cellWidth: 20 },
            4: { halign: 'right', cellWidth: 20 },
            5: { halign: 'right', cellWidth: 20 },
            6: { halign: 'left', cellWidth: 50 },
         },

         body: datos,

         didParseCell: function (hookData) {
            if (hookData.column.index == 2 && hookData.cell.text.toString() == '(Ninguno)') { hookData.cell.text = ['']; }
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

      const firmas: any = [];
      firmas.push(['', '']);
      firmas.push(['', '']);

      autoTable(doc, {
         margin: { left: m_izquierda - 1, top: 27, right: 11, bottom: 13 },
         theme: 'grid',
         // styles: { font: 'helvetica', fontSize: 8, cellPadding: 1, halign: 'center' },
         columnStyles: {
            0: { halign: 'left', cellWidth: 90 },
            1: { halign: 'left', cellWidth: 90 },
         },
         body: firmas,
      });

      // addPageNumbers();

      this.muestraPDF(doc);
   }

   imprimeAsiento() {
      this.otrapagina = this.formImprimir.value.otrapagina;
      const doc = new jsPDF('p', 'mm', 'a4', true);
      let m_izquierda = 20;
      doc.setFont("times", "bold"); doc.setFontSize(16); doc.text("EpmapaT", m_izquierda, 10);
      doc.setFont("times", "bold"); doc.setFontSize(12); doc.text("Asiento Nro: " + this.iAsiento.asiento, m_izquierda, 16);
      doc.setFontSize(10); doc.setFont("times", "bold");
      doc.text("FECHA: ", m_izquierda, 21);
      doc.text("COMPROBANTE: ", m_izquierda + 40, 21);
      doc.text("CONCEPTO: ", m_izquierda, 26);

      doc.setFont("helvetica", "normal");
      doc.text(this.iAsiento.fecha.toString(), m_izquierda + 16, 21);
      doc.text(this.iAsiento.comprobante, m_izquierda + 71, 21);

      const datosGlosa: any = [];
      datosGlosa.push([this.iAsiento.glosa.toString()]);
      autoTable(doc, {
         margin: { left: m_izquierda - 1, top: 27, right: 11, bottom: 13 },
         theme: 'grid',
         // styles: { font: 'helvetica', fontSize: 8, cellPadding: 1, halign: 'center' },
         columnStyles: {
            0: { halign: 'left', cellWidth: 180 },
         },
         body: datosGlosa,
      });

      const datos: any = [];
      let sumdebe = 0;
      let sumhaber = 0;
      let debe: number;
      let haber: number;
      let i = 0;
      this._transaci.forEach(() => {
         if (this._transaci[i].debcre == 1) {
            debe = this._transaci[i].valor;
            haber = 0;
            sumdebe = sumdebe + this._transaci[i].valor;
         } else {
            debe = 0;
            haber = this._transaci[i].valor;
            sumhaber = sumhaber + this._transaci[i].valor;
         }
         datos.push([this._transaci[i].codcue, this._transaci[i].idcuenta.nomcue, this._transaci[i].idbene.nomben, formatNumber(debe),
         formatNumber(haber)]);
         i++;
      });
      datos.push(['', 'TOTAL', '', formatNumber(sumdebe), formatNumber(sumhaber)]);

      autoTable(doc, {
         margin: { left: m_izquierda - 1, top: 0, right: 11, bottom: 13 },
         head: [['Cuenta', 'Denominación', 'Beneficiario', 'Debe', 'Haber']],
         theme: 'grid',
         headStyles: { fillColor: [68, 103, 114], fontStyle: 'bold', halign: 'center' },
         styles: { font: 'helvetica', fontSize: 8, cellPadding: 1, halign: 'center' },
         columnStyles: {
            0: { halign: 'left', cellWidth: 20 },
            1: { halign: 'left', cellWidth: 80 },
            2: { halign: 'left', cellWidth: 40, fontSize: 7 },
            3: { halign: 'right', cellWidth: 20 },
            4: { halign: 'right', cellWidth: 20 },
            5: { halign: 'right', cellWidth: 20 },
            6: { halign: 'left', cellWidth: 50 },
         },
         body: datos,

         didParseCell: function (hookData) {
            if (hookData.column.index == 2 && hookData.cell.text.toString() == '(Ninguno)') { hookData.cell.text = ['']; }
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

   exportaAsiento() {
      this.nombrearchivo = this.formImprimir.value.nombrearchivo;
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(this.nombrearchivo);
      // Fila 1
      worksheet.addRow(['Asiento Nro: ' + this.iAsiento.asiento]);
      const cellA1 = worksheet.getCell('A1');
      const customStyle = { font: { name: 'Times New Roman', bold: true, size: 14, color: { argb: '002060' } } };
      cellA1.font = customStyle.font;

      // Fila 2
      worksheet.addRow(['FECHA: ' + this.iAsiento.fecha, 'COMPROBANTE: ' + this.iAsiento.comprobante]);
      const customStyle2 = { font: { name: 'Times New Roman', bold: true, size: 10, color: { argb: '002060' } } };
      worksheet.getCell('A2').font = customStyle2.font;
      worksheet.getCell('B2').font = { name: 'Times New Roman', bold: true, size: 10, color: { argb: '002060' } };

      // Fila 3 y 4
      worksheet.addRow([this.iAsiento.glosa]);
      worksheet.addRow([]);
      let filaTit = 5
      //Fila: filaTit Cabecera 
      const headerRowCell = worksheet.addRow(['Cuenta', 'Denominación', 'Beneficiario', 'Debe', 'Haber', 'Tp', 'Documento']);
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
      this._transaci.forEach(() => {
         let nomben: string;
         if (this._transaci[i].idbene.idbene == 1) nomben = ''
         else nomben = this._transaci[i].idbene.nomben
         let debe: any; let haber: any;
         if (this._transaci[i].debcre == 1) {
            debe = this._transaci[i].valor; haber = '';
         } else {
            debe = ''; haber = this._transaci[i].valor;;
         }
         let tiptran: any = '';
         if (this._transaci[i].tiptran > 0) tiptran = this._transaci[i].tiptran
         const row = [this._transaci[i].codcue, this._transaci[i].idcuenta.nomcue, nomben,
            debe, haber, tiptran, this._transaci[i].intdoc.nomdoc + ' ' + this._transaci[i].numdoc];
         worksheet.addRow(row);
         i++;
      });

      // Establece el ancho de las columnas
      const anchoConfig = [
         { columnIndex: 1, widthInChars: 20 },
         { columnIndex: 2, widthInChars: 60 },
         { columnIndex: 3, widthInChars: 30 },
         { columnIndex: 4, widthInChars: 18 },
         { columnIndex: 5, widthInChars: 18 },
         { columnIndex: 6, widthInChars: 4 },
         { columnIndex: 7, widthInChars: 30 },
      ];
      anchoConfig.forEach(config => {
         worksheet.getColumn(config.columnIndex).width = config.widthInChars;
      });

      // Columnas centradas 
      const columnsToCenter = [6];
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
      for (let i = filaTit + 1; i <= this._transaci.length + filaTit; i++) {
         columnsToFormat1.forEach(columnIndex => {
            const cell = worksheet.getCell(i, columnIndex);
            cell.style = numeroStyle1;
         });
      }

      //Coloca la fila de Totales
      worksheet.addRow(['', 'TOTAL', '']);
      worksheet.getCell('B' + (this._transaci.length + filaTit + 1).toString()).font = { bold: true }

      let celdaD = worksheet.getCell('D' + (this._transaci.length + filaTit + 1).toString());
      celdaD.numFmt = '#,##0.00';
      celdaD.font = { bold: true };
      celdaD.value = { formula: 'SUM(D4:' + 'D' + (this._transaci.length + filaTit).toString() + ')', result: 0, sharedFormula: undefined, date1904: false };

      let celdaE = worksheet.getCell('E' + (this._transaci.length + filaTit + 1).toString());
      celdaE.numFmt = '#,##0.00';
      celdaE.font = { bold: true }
      celdaE.value = { formula: 'SUM(E4:' + 'E' + (this._transaci.length + filaTit).toString() + ')', result: 0, sharedFormula: undefined, date1904: false };

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

interface interfaceAsiento {
   asiento: number;
   fecha: Date;
   compro: number;
   comprobante: string;
   nomcomprobante: string;
   glosa: String;
}

function formatNumber(num: number) {
   return num.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
}