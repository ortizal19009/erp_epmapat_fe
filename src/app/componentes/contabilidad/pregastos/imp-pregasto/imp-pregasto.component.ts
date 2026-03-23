import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { PregastoService } from 'src/app/servicios/contabilidad/pregasto.service';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as ExcelJS from 'exceljs';

@Component({
   selector: 'app-imp-pregasto',
   templateUrl: './imp-pregasto.component.html',
   styleUrls: ['./imp-pregasto.component.css']
})

export class ImpPregastoComponent implements OnInit {

   swimprimir: boolean = true;
   formImprimir: FormGroup;
   opcreporte: number = 1;
   otrapagina: boolean = false;
   swbotones: boolean = false;
   swcalculando: boolean = false;
   txtcalculando = 'Calculando';
   pdfgenerado: string;
   _presupuei: any;
   today: number = Date.now();
   date: Date = new Date();
   nombrearchivo: string;

   constructor(public fb: FormBuilder, private router: Router, private pregasService: PregastoService) { }

   ngOnInit(): void {
      sessionStorage.setItem('ventana', '/pregastos');
      let coloresJSON = sessionStorage.getItem('/pregastos');
      if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));

      //En preingreso siempre hay 'preingresoToImpExp' porque se buscan todas las partidas por default
      const preIngresoJSON = sessionStorage.getItem('pregastoToImpExp')!;
      const preIngreso = JSON.parse(preIngresoJSON);
      this.formImprimir = this.fb.group({
         reporte: '1',
         codpar: preIngreso.codpar,
         nompar: preIngreso.nompar,
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

   regresar() { this.router.navigate(['pregastos']); }

   async imprimir() {
      this.swbotones = true;
      this.swcalculando = true;
      let fecha = this.formImprimir.value.fecha;
      switch (this.opcreporte) {
         case 1:  //Partidas de Presupuesto de Gastos
            try {
               let codpar = this.formImprimir.value.codpar;
               let nompar = this.formImprimir.value.nompar;
               this._presupuei = await this.pregasService.getPregastoAsync(2, codpar, nompar)
               this.swcalculando = false;
               if (this.swimprimir) this.txtcalculando = 'Mostrar'
               else this.txtcalculando = 'Descargar'
            } catch (error) {
               console.error('Error al obtener las partidas de gastos:', error);
            }
            break;
         case 2:  //Saldos de las cuentas
         // try {
         //    this._cuentas = await this.facService.getByFechacobroTotAsync(fecha);
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
         case 1:  //Partidas del Presupuesto de gastos
            if (this.swimprimir) this.imprimePartidas();
            else this.exportaPartidas();
            break;
         case 2:  //Cédula de gastos
            if (this.swimprimir) this.imprimePartidas();
            else this.exportaPartidas();
            break;
         case 3:  //Cédula de gastos consolidada
            if (this.swimprimir) this.imprimePartidas();
            else this.exportaPartidas();
            break;
         case 4:  //Saldos de la Partidas de gastos
            if (this.swimprimir) this.imprimePartidas();
            else this.exportaPartidas();
            break;
      }
   }

   imprimePartidas() {
      let m_izquierda = 20;
      var doc = new jsPDF();
      doc.setFont("times", "bold"); doc.setFontSize(16); doc.text("EpmapaT", m_izquierda, 10);
      doc.setFont("times", "normal"); doc.setFontSize(12); doc.text("PRESUPUESTO DE GASTOS", m_izquierda, 16)
      let cabecera = ['PARTIDA', "NOMBRE", "CODIFICADO", "INICIAL", "REFORMA"];

      const datos: any = [];
      let totales: number[] = [0, 0, 0];
      let i = 0;
      this._presupuei.forEach(() => {
         totales[0] = totales[0] + this._presupuei[i].inicia + this._presupuei[i].totmod;
         totales[1] = totales[1] + this._presupuei[i].inicia;
         totales[2] = totales[2] + this._presupuei[i].totmod;
         datos.push([this._presupuei[i].codpar, this._presupuei[i].nompar,
         this._presupuei[i].inicia + this._presupuei[i].totmod, this._presupuei[i].inicia,
         this._presupuei[i].totmod]);
         i++;
      });
      datos.push(['', 'TOTAL: ' + this._presupuei.length, totales[0], totales[1], totales[2]]);

      autoTable(doc, {
         theme: 'grid',
         margin: { left: m_izquierda - 1, top: 18, right: 10, bottom: 12 },
         headStyles: { fillColor: [68, 103, 114], fontStyle: 'bold', halign: 'center' },
         styles: { font: 'helvetica', fontSize: 8, cellPadding: 1, halign: 'center' },
         head: [cabecera],
         body: datos,

         columnStyles: {
            0: { halign: 'center' },
            1: { halign: 'left' },
            2: { halign: 'right' },
            3: { halign: 'right' },
            4: { halign: 'right' }
         },

         didParseCell: function (data) {
            if (typeof data.cell.raw === 'number') {
               const formattedNumber = data.cell.raw.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
               });
               data.cell.text = [formattedNumber];
            };
            if (data.cell.raw == 0) { data.cell.text = ['']; }
            if (data.row.index === datos.length - 1) { data.cell.styles.fontStyle = 'bold'; } // Total Bold
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

   exportaPartidas() {
      this.nombrearchivo = this.formImprimir.value.nombrearchivo;
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(this.nombrearchivo);
      // Fila 1
      worksheet.addRow(['', '', 'PRESUPUESTO DE INGRESOS']);
      worksheet.getCell('C1').font = { name: 'Times New Roman', bold: true, size: 14, color: { argb: '002060' } }

      // Fila 2
      worksheet.addRow([]);
      // worksheet.getCell('B2').font = { name: 'Times New Roman', bold: true, size: 16, color: { argb: '001060' } };

      const cabecera = ['#', 'Código', 'Nombre', 'Codificado', 'Inicial', 'Reforma'];
      const headerRowCell = worksheet.addRow(cabecera);
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
      this._presupuei.forEach((item: any) => {
         let fila = worksheet.addRow([i, item.codpar, item.nompar, item.inicia + item.totmod, item.inicia, item.totmod]);
         i++;
      });

      // Establece el ancho de las columnas
      const anchoConfig = [
         { columnIndex: 1, widthInChars: 6 },
         { columnIndex: 2, widthInChars: 14 },
         { columnIndex: 3, widthInChars: 50 },
         { columnIndex: 4, widthInChars: 16 },
         { columnIndex: 5, widthInChars: 16 },
         { columnIndex: 6, widthInChars: 16 }
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
      let columnsToRigth = [4, 5, 6];
      columnsToRigth.forEach(columnIndex => {
         worksheet.getColumn(columnIndex).eachCell({ includeEmpty: true }, cell => {
            cell.alignment = { horizontal: 'right' };
         });
      });

      // Formato numérico
      const numeroStyle = { numFmt: '#,##0.00' };
      const columnsToFormat = [4, 5, 6];
      for (let i = 4; i <= this._presupuei.length + 3; i++) {
         columnsToFormat.forEach(columnIndex => {
            const cell = worksheet.getCell(i, columnIndex);
            cell.style = numeroStyle;
         });
      }

      //Coloca la fila del Total
      worksheet.addRow(['', '', 'TOTAL']);
      worksheet.getCell('C' + (this._presupuei.length + 4).toString()).font = { bold: true }

      let celdaD = worksheet.getCell('D' + (this._presupuei.length + 4).toString());
      celdaD.numFmt = '#,##0.00'; celdaD.font = { bold: true }
      celdaD.value = { formula: 'SUM(D4:' + 'D' + (this._presupuei.length + 3).toString() + ')', result: 0, sharedFormula: undefined, date1904: false };

      let celdaE = worksheet.getCell('E' + (this._presupuei.length + 4).toString());
      celdaE.numFmt = '#,##0.00'; celdaE.font = { bold: true }
      celdaE.value = { formula: 'SUM(E4:' + 'E' + (this._presupuei.length + 3).toString() + ')', result: 0, sharedFormula: undefined, date1904: false };

      let celdaF = worksheet.getCell('F' + (this._presupuei.length + 4).toString());
      celdaF.numFmt = '#,##0.00'; celdaF.font = { bold: true }
      celdaF.value = { formula: 'SUM(F4:' + 'F' + (this._presupuei.length + 3).toString() + ')', result: 0, sharedFormula: undefined, date1904: false };

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
