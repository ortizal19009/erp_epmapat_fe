import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { BenextranService } from 'src/app/servicios/contabilidad/benextran.service';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as ExcelJS from 'exceljs';

@Component({
   selector: 'app-imp-movibene',
   templateUrl: './imp-movibene.component.html',
   styleUrls: ['./imp-movibene.component.css']
})
export class ImpMovibeneComponent implements OnInit {

   swimprimir: boolean = true;
   formImprimir: FormGroup;
   formBeneficiario: FormGroup;
   idbene: number;
   opcreporte: number = 1;
   otrapagina: boolean = false;
   swbotones: boolean = false;
   swcalculando: boolean = false;
   txtcalculando = 'Calculando';
   _movibene: any;
   anterior: number;
   sumdebe: number;
   sumhaber: number;
   pdfgenerado: string;
   nombrearchivo: string;
	sumanticipo: number;
	sumcxc: number;
	sumft: number;
	sumcxp: number;
	sumtotpagcob: number;
	sumsaldo: number;

   constructor(public fb: FormBuilder, private router: Router, private bxtService: BenextranService) { }

   ngOnInit(): void {
      sessionStorage.setItem('ventana', '/beneficiarios');
      let coloresJSON = sessionStorage.getItem('/beneficiarios');
      if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));

      const movibeneJSON = sessionStorage.getItem('movibeneToImpExp');
      if ( movibeneJSON ) {
         const movibene = JSON.parse( movibeneJSON );
         this.idbene = movibene.idbene;
         this.formBeneficiario = this.fb.group({
            nomben: movibene.nomben
         });
         this.formImprimir = this.fb.group({
            reporte: '1',
            desde: movibene.desde,
            hasta: movibene.hasta,
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

   retornar() { this.router.navigate(['info-beneficiario']); }

   //Recupera los datos de cada reporte
   async imprimir() {
      this.swbotones = true;
      this.swcalculando = true;
      let fecha = this.formImprimir.value.fecha;
      switch (this.opcreporte) {
         case 1:  // Movimientos del beneficiario
            this.pdfgenerado = 'movimientos_' + this.formBeneficiario.value.nomben;
            try {
               this._movibene = await this.bxtService.getByIdbeneDesdeHastaAsync(this.idbene, this.formImprimir.value.desde, this.formImprimir.value.hasta);
               this.total();
               // console.log('this._movibene: ', this._movibene)
               this.swcalculando = false;
               if (this.swimprimir) this.txtcalculando = 'Mostrar'
               else this.txtcalculando = 'Descargar'
            } catch (error) {
               console.error('Error al obtener las transacciones de la cuenta:', error);
            }
            break;
         case 2:  // Liquidación de movimientos
         // try {
         //    this._movibene = await this.facService.getByFechacobroTotAsync(fecha);
         //    // this.sw1 = true;
         //    this.swcalculando = false;
         //    if(this.swimprimir) this.txtcalculando = 'Mostrar'
         //    else this.txtcalculando = 'Descargar'
         // } catch (error) {
         //    console.error('Error al obtener las Planillas:', error);
         // }
         // break;
         default:
      }
   }

   comprobante(tipcom: number, compro: number): string {
      if(tipcom == 1) return 'I-' + compro.toString();
      if(tipcom == 2) return 'E-' + compro.toString();
      if(tipcom == 3) return 'DC-' + compro.toString();
      if(tipcom == 4) return 'DI-' + compro.toString();
      if(tipcom == 5) return 'DE-' + compro.toString();
      return '';
   }

   total() {
		this.sumanticipo = 0;
		this.sumcxc = 0;
		this.sumft = 0;
		this.sumcxp = 0;
		this.sumtotpagcob = 0;
		this.sumsaldo = 0;
		let i = 0;
		this._movibene.forEach(() => {
			switch (this._movibene[i].inttra.tiptran) {
				case 2:
					this._movibene[i].anticipo = formatNumber(this._movibene[i].valor);
               this._movibene[i].anticipoN = this._movibene[i].valor;
					this.sumanticipo = this.sumanticipo + this._movibene[i].valor;
					break;
				case 3:
					this._movibene[i].cxc = formatNumber(this._movibene[i].valor); //Con formato para imprimir
               this._movibene[i].cxcN = this._movibene[i].valor;              //Como número para exportar
					this.sumcxc = this.sumcxc + this._movibene[i].valor;
					break;
				case 4:
					this._movibene[i].cxc = formatNumber(this._movibene[i].valor);
               this._movibene[i].cxcN = this._movibene[i].valor;
					this.sumcxc = this.sumcxc + this._movibene[i].valor;
					break;
				case 5:
					this._movibene[i].ft = formatNumber(this._movibene[i].valor);
               this._movibene[i].ftN = this._movibene[i].valor;
					this.sumft = this.sumft + this._movibene[i].valor;
					break;
				case 6:
					this._movibene[i].cxp = formatNumber(this._movibene[i].valor);
               this._movibene[i].cxpN = this._movibene[i].valor;
					this.sumcxp = this.sumcxp + this._movibene[i].valor;
					break;
				case 7:
					this._movibene[i].cxp = formatNumber(this._movibene[i].valor);
               this._movibene[i].cxpN = this._movibene[i].valor;
					this.sumcxp = this.sumcxp + this._movibene[i].valor;
					break;
				default:

			}
			this._movibene[i].saldo = formatNumber(this._movibene[i].valor - this._movibene[i].totpagcob);
         this._movibene[i].saldoN = this._movibene[i].valor - this._movibene[i].totpagcob;
			this.sumtotpagcob = this.sumtotpagcob + this._movibene[i].totpagcob;
			this.sumsaldo = this.sumsaldo + (this._movibene[i].valor - this._movibene[i].totpagcob);
			i++;
		});
	}

   //Muestra cada reporte
   imprime() {
      this.swbotones = false; this.swcalculando = false; this.txtcalculando = 'Calculando'
      switch (this.opcreporte) {
         case 1:  // Recaudacion diaria - Resumen
            if (this.swimprimir) this.imprimeMovibene();
            else this.exportaMovibene();
            break;
         case 2:  // Recaudacion diaria - Planillas
         // if (this.swimprimir) this.imprimirFacturas();
         // else this.exportarFacturas();
         // break;
         case 3:  //Lista de Cajas
         // if (this.swimprimir) this.imprimirCajas();
         // else this.exportarCajas();
         // break;
         default:
      }
   }

   imprimeMovibene() {
      this.otrapagina = this.formImprimir.value.otrapagina;
      const doc = new jsPDF('l', 'mm', 'a4', true);
      let m_izquierda = 10;
      doc.setFont("times", "bold"); doc.setFontSize(16); doc.text("EpmapaT", m_izquierda, 10);
      doc.setFont("times", "bold"); doc.setFontSize(12); doc.text("Movimientos: " + this.formBeneficiario.value.nomben, m_izquierda, 16);
      doc.setFont("times", "bold"); doc.setFontSize(11); doc.text("Del " + this.formImprimir.value.desde + ' al ' + this.formImprimir.value.hasta, m_izquierda, 22);
      // if (this.anterior != 0) { doc.setFont("helvetica"); doc.setFontSize(10); doc.text("Anterior: " + formatNumber(this.anterior), m_izquierda + 132, 22) };

      const datos: any = [];
      let i = 0;
      this._movibene.forEach(() => {
         datos.push([this._movibene[i].inttra.idasiento.fecha, this._movibene[i].inttra.idasiento.asiento, this.comprobante(this._movibene[i].inttra.idasiento.tipcom, this._movibene[i].inttra.idasiento.compro),
         this._movibene[i].inttra.codcue, this._movibene[i].anticipo, this._movibene[i].cxc, this._movibene[i].ft, this._movibene[i].cxp, 
         this._movibene[i].totpagcob, this._movibene[i].saldo, this._movibene[i].inttra.descri ]);
         i++;
      });
      datos.push(['', '', '', 'TOTAL: '+this._movibene.length, formatNumber(this.sumanticipo), formatNumber(this.sumcxc), formatNumber(this.sumft), formatNumber(this.sumcxp),
      formatNumber(this.sumtotpagcob), this.sumsaldo ]);

      autoTable(doc, {
         head: [['Fecha','Asie','Cmprbnt','Cuenta','Anticipo','CxC','F.T','CxP','Liquida','Saldo','Descripción']],
         theme: 'grid',
         headStyles: { fillColor: [68, 103, 114], fontStyle: 'bold', halign: 'center' },
         styles: { font: 'helvetica', fontSize: 8, cellPadding: 1, halign: 'center' },

         columnStyles: {
            0: { halign: 'center', cellWidth: 18 },
            1: { halign: 'center', cellWidth: 10 },
            2: { halign: 'center', cellWidth: 16 },
            3: { halign: 'left', cellWidth: 20 },
            4: { halign: 'right', cellWidth: 16 },
            5: { halign: 'right', cellWidth: 16 },
            6: { halign: 'right', cellWidth: 16 },
            7: { halign: 'right', cellWidth: 16 },
            8: { halign: 'right', cellWidth: 16 },
            9: { halign: 'right', cellWidth: 16 },
            10: { halign: 'left', cellWidth: 122, fontSize: 7 },
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

   exportaMovibene() {
      this.nombrearchivo = this.formImprimir.value.nombrearchivo;
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(this.nombrearchivo);
      // Fila 1
      worksheet.addRow(['', '', '', 'Movimientos ' + this.formBeneficiario.value.nomben ]);
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
         worksheet.addRow([ ]);
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
      const headerRowCell = worksheet.addRow( [ 'Fecha','Asie','Cmprbnt','Cuenta','Anticipo','CxC','F.T','CxP','Liquida','Saldo','Descripción' ] );
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
      this._movibene.forEach(() => {
         // let nomben: string;
         // if (this._movibene[i].idbene.idbene == 1) nomben = ''
         // else nomben = this._movibene[i].idbene.nomben
         // let debe: any; let haber: any;
         // if (this._movibene[i].debcre == 1) {
         //    debe = this._movibene[i].debe;
         //    haber = '';
         // }
         // else {
         //    debe = '';
         //    haber = this._movibene[i].haber;
         // }
         const row = [this._movibene[i].inttra.idasiento.fecha, this._movibene[i].inttra.idasiento.asiento, 
         this.comprobante(this._movibene[i].inttra.idasiento.tipcom, this._movibene[i].inttra.idasiento.compro),
         this._movibene[i].inttra.codcue, this._movibene[i].anticipoN, this._movibene[i].cxcN, this._movibene[i].ftN,
         this._movibene[i].cxpN, this._movibene[i].totpagcob, this._movibene[i].saldoN, this._movibene[i].inttra.descri];
         worksheet.addRow(row);
         i++;
      });

      //Coloca la fila del Total
      worksheet.addRow(['', '', '', 'TOTAL']);
      worksheet.getCell('D' + (this._movibene.length + 5).toString()).font = { bold: true }

      // Coloca negrita y formato numerico a la fila de totales
      const lastRowIndex = this._movibene.length + 5; // Último índice de fila
      for (let colIndex = 0; colIndex < 10; colIndex++) { // Recorrer columnas
         const cell = worksheet.getCell(String.fromCharCode(65 + colIndex) + lastRowIndex.toString()); // Obtener celda
         cell.font = { bold: true }; // Aplicar negrita
         cell.numFmt = '#,##0.00';
       }
       
      let celdaE = worksheet.getCell('E' + (this._movibene.length + 5).toString());
      celdaE.value = { formula: 'SUM(E5:' + 'E' + (this._movibene.length + 4).toString() + ')', result: 0, sharedFormula: undefined, date1904: false };
      
      let celdaF = worksheet.getCell('F' + (this._movibene.length + 5).toString());
      celdaF.value = { formula: 'SUM(F5:' + 'F' + (this._movibene.length + 4).toString() + ')', result: 0, sharedFormula: undefined, date1904: false };

      let celdaG = worksheet.getCell('G' + (this._movibene.length + 5).toString());
      celdaG.value = { formula: 'SUM(G5:' + 'G' + (this._movibene.length + 4).toString() + ')', result: 0, sharedFormula: undefined, date1904: false };
      
      let celdaH = worksheet.getCell('H' + (this._movibene.length + 5).toString());
      celdaH.value = { formula: 'SUM(H5:' + 'H' + (this._movibene.length + 4).toString() + ')', result: 0, sharedFormula: undefined, date1904: false };

      let celdaI = worksheet.getCell('I' + (this._movibene.length + 5).toString());
      celdaI.value = { formula: 'SUM(I5:' + 'I' + (this._movibene.length + 4).toString() + ')', result: 0, sharedFormula: undefined, date1904: false };

      let celdaJ = worksheet.getCell('J' + (this._movibene.length + 5).toString());
      celdaJ.value = { formula: 'SUM(J5:' + 'J' + (this._movibene.length + 4).toString() + ')', result: 0, sharedFormula: undefined, date1904: false };

      // Establece el ancho de las columnas
      const anchoConfig = [
         { columnIndex: 1, widthInChars: 12 },
         { columnIndex: 2, widthInChars: 8 },
         { columnIndex: 3, widthInChars: 10 },
         { columnIndex: 4, widthInChars: 15 },
         { columnIndex: 5, widthInChars: 14 },
         { columnIndex: 6, widthInChars: 14 },
         { columnIndex: 7, widthInChars: 14 },
         { columnIndex: 8, widthInChars: 14 },
         { columnIndex: 9, widthInChars: 14 },
         { columnIndex: 10, widthInChars: 14 },
         { columnIndex: 11, widthInChars: 180 },
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
      let columnsToRigth = [5, 6, 7, 8, 9, 10 ];
      columnsToRigth.forEach(columnIndex => {
         worksheet.getColumn(columnIndex).eachCell({ includeEmpty: true }, cell => {
            cell.alignment = { horizontal: 'right' };
         });
      });

      // Formato numérico con decimales
      const numeroStyle1 = { numFmt: '#,##0.00' };
      const columnsToFormat1 = [5, 6, 7, 8, 9, 10];
      for (let i = 5; i <= this._movibene.length + 4; i++) {
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