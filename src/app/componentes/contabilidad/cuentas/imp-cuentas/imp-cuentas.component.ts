import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CuentasService } from 'src/app/servicios/contabilidad/cuentas.service';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as ExcelJS from 'exceljs';
import { TransaciService } from 'src/app/servicios/contabilidad/transaci.service';

@Component({
   selector: 'app-imp-cuentas',
   templateUrl: './imp-cuentas.component.html',
   styleUrls: ['./imp-cuentas.component.css']
})
export class ImpCuentasComponent implements OnInit {

   swimprimir: boolean = true;
   formImprimir: FormGroup;
   opcreporte: number = 1;
   otrapagina: boolean = false;
   swbotones: boolean = false;
   swcalculando: boolean = false;
   txtcalculando = 'Calculando';
   pdfgenerado: string;
   _cuentas: any;
   _cuentasF: any;
   today: number = Date.now();
   date: Date = new Date();
   nombrearchivo: string;

   constructor(public fb: FormBuilder, private router: Router, private cueService: CuentasService,
      private tranService: TransaciService) { }

   ngOnInit(): void {
      sessionStorage.setItem('ventana', '/cuentas');
      let coloresJSON = sessionStorage.getItem('/cuentas');
      if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));

      const fechaActual = new Date();
      let hasta = fechaActual.toISOString().slice(0, 10);
      let fechaRestada: Date = new Date();
      fechaRestada.setMonth(fechaActual.getMonth() - 1);
      let desde = fechaRestada.toISOString().slice(0, 10);

      const cuentasJSON = sessionStorage.getItem('cuentasToImpExp');
      if (cuentasJSON) {
         const cuentas = JSON.parse(cuentasJSON);
         this.formImprimir = this.fb.group({
            reporte: '1',
            codcue: cuentas.codcue,
            nomcue: cuentas.nomcue,
            desde: desde,
            hasta: hasta,
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

   retornar() { this.router.navigate(['cuentas']); }

   async imprimir() {
      this.swbotones = true;
      this.swcalculando = true;
      let fecha = this.formImprimir.value.fecha;
      switch (this.opcreporte) {
         case 1:  //Lista de cuentas
            try {
               let codcue = this.formImprimir.value.codcue;
               let nomcue = this.formImprimir.value.nomcue;
               this._cuentas = await this.cueService.getByCodigoyNombreAsync(codcue, nomcue)
               this.swcalculando = false;
               if (this.swimprimir) this.txtcalculando = 'Mostrar'
               else this.txtcalculando = 'Descargar'
            } catch (error) {
               console.error('Error al obtener las cuentas:', error);
            }
            break;
         case 2:  //Saldos de las cuentas
            try {
               let codcue = this.formImprimir.value.codcue;
               let nomcue = this.formImprimir.value.nomcue;
               this._cuentas = await this.cueService.getByCodigoyNombreAsync(codcue, nomcue);
               // let i = 0
               this.saldos(0);
               // console.log('Después de this.saldos(i)')
               // this.swcalculando = false;
               // if (this.swimprimir) this.txtcalculando = 'Mostrar'
               // else this.txtcalculando = 'Descargar'
            } catch (error) {
               console.error('Error al obtener las cuentas:', error);
            }
            break;

      }
   }

   //Saldos de las Cuentas
   saldos(i: number) {
      //Débitos
      let desde = this.formImprimir.value.desde;
      let hasta = this.formImprimir.value.hasta;
      // console.log(desde, hasta)
      this.tranService.sumValor(this._cuentas[i].codcue, 1, desde, hasta).subscribe({
         next: resp1 => {
            this._cuentas[i].debitos = Math.round(resp1 * 100) / 100;
            //Créditos
            this.tranService.sumValor(this._cuentas[i].codcue, 2, desde, hasta).subscribe({
               next: resp2 => {
                  this._cuentas[i].creditos = Math.round(resp2 * 100) / 100;
                  let primerCaracter = this._cuentas[i].codcue.charAt(0);
                  let primerosDosCaracteres = this._cuentas[i].codcue.substr(0, 2);
                  if (primerCaracter == '1' || primerosDosCaracteres == '63' || primerosDosCaracteres == '91') this._cuentas[i].saldo = Math.round((this._cuentas[i].debitos - this._cuentas[i].creditos) * 100) / 100
                  else this._cuentas[i].saldo = Math.round((this._cuentas[i].creditos - this._cuentas[i].debitos) * 100) / 100
                  i++
                  if (i < this._cuentas.length) this.saldos(i)
                  else {
                     this.swcalculando = false;
                     if (this.swimprimir) this.txtcalculando = 'Mostrar'
                     else this.txtcalculando = 'Descargar'
                     // Filtra las cuentas que tienen debitos o créditos
                     this._cuentasF = this._cuentas.filter((cuenta: { debitos: number; creditos: number; }) => cuenta.debitos !== 0 || cuenta.creditos !== 0);
                  }
               },
               error: err => console.error(err.error)
            });
         },
         error: err => console.error(err.error)
      });


   }

   //Muestra cada reporte
   imprime() {
      this.swbotones = false; this.swcalculando = false; this.txtcalculando = 'Calculando'
      switch (this.opcreporte) {
         case 1:  //Lista de asientos
            if (this.swimprimir) this.imprimeCuentas();
            else this.exportaCuentas();
            break;
         case 2:  //Detalle de asientos
            if (this.swimprimir) this.imprimeSaldos();
            else this.exportaSaldos();
            break;
      }
   }

   imprimeCuentas() {
      this.otrapagina = this.formImprimir.value.otrapagina;
      const doc = new jsPDF('p', 'mm', 'a4', true);
      let m_izquierda = 10;
      doc.setFont("times", "bold"); doc.setFontSize(16); doc.text("EpmapaT", m_izquierda, 10);
      doc.setFont("times", "bold"); doc.setFontSize(12); doc.text("Lista de cuentas", m_izquierda, 16);

      const datos: any = [];
      let i = 0;
      this._cuentas.forEach(() => {
         let movcue = 'No'
         if (this._cuentas[i].movcue == 2) movcue = 'Si'
         let sigef = 'No'
         if (this._cuentas[i].sigef == 1) sigef = 'Si'
         datos.push([this._cuentas[i].codcue, this._cuentas[i].nomcue, this._cuentas[i].grucue, movcue,
            sigef, this._cuentas[i].tiptran, this._cuentas[i].asodebe, this._cuentas[i].asohaber]);
         i++;
      });
      datos.push(['', 'TOTAL: ' + this._cuentas.length]);

      autoTable(doc, {
         head: [['Código', 'Nombre', 'Grupo', 'Movi', 'Sinafip', 'Tipo', 'Aso.Debe', 'Aso.Haber']],
         theme: 'grid',
         headStyles: { fillColor: [68, 103, 114], fontStyle: 'bold', halign: 'center' },
         styles: { font: 'helvetica', fontSize: 8, cellPadding: 1, halign: 'center' },
         margin: { left: m_izquierda - 1, top: 18, right: 7, bottom: 13 },

         columnStyles: {
            0: { halign: 'left', cellWidth: 20 },
            1: { halign: 'left', cellWidth: 80 },
            2: { halign: 'left', cellWidth: 18 },
            3: { halign: 'center', cellWidth: 10 },
            4: { halign: 'center', cellWidth: 12 },
            5: { halign: 'center', cellWidth: 8 },
            6: { halign: 'left', cellWidth: 23 },
            7: { halign: 'left', cellWidth: 23 },
         },
         body: datos,

         didParseCell: function (hookData) {
            if (hookData.cell.raw == 0) { hookData.cell.text = ['']; }
            //Negrita totales y cuentas de grupo
            if ((hookData.cell.raw === '' && hookData.column.index === 0) || (hookData.column.index == 3 && hookData.cell.text.toString() == 'No')) {
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

   imprimeSaldos() {
      this.otrapagina = this.formImprimir.value.otrapagina;
      const doc = new jsPDF('p', 'mm', 'a4', true);
      let m_izquierda = 20;
      doc.setFont("times", "bold"); doc.setFontSize(16); doc.text("EpmapaT", m_izquierda, 10);
      doc.setFont("times", "bold"); doc.setFontSize(12); doc.text("Saldos de las Cuentas", m_izquierda, 16);
      doc.setFont("times", "bold"); doc.setFontSize(11); doc.text("Del " + this.formImprimir.value.desde + ' al ' + this.formImprimir.value.hasta, m_izquierda, 22);

      let grupos: number[] = [];
      const datos: any = [];
      let i = 0;
      this._cuentasF.forEach(() => {
         if (this._cuentasF[i].movcue == 1) grupos.push(i);
         datos.push([this._cuentasF[i].codcue, this._cuentasF[i].nomcue, formatNumber(this._cuentasF[i].debitos),
         formatNumber(this._cuentasF[i].creditos), formatNumber(this._cuentasF[i].saldo)]);
         i++;
      });
      datos.push(['', 'TOTAL: ' + this._cuentasF.length]);

      autoTable(doc, {
         head: [['Código', 'Nombre', 'Débitos', 'Créditos', 'Saldos']],
         theme: 'grid',
         headStyles: { fillColor: [68, 103, 114], fontStyle: 'bold', halign: 'center' },
         styles: { font: 'helvetica', fontSize: 8, cellPadding: 1, halign: 'center' },
         margin: { left: m_izquierda - 1, top: 24, right: 14, bottom: 13 },

         columnStyles: {
            0: { halign: 'left', cellWidth: 20 },
            1: { halign: 'left', cellWidth: 97 },
            2: { halign: 'right', cellWidth: 20 },
            3: { halign: 'right', cellWidth: 20 },
            4: { halign: 'right', cellWidth: 20 },
         },
         body: datos,

         didParseCell: function (hookData) {
            if (hookData.cell.raw == 0) { hookData.cell.text = ['']; }  //No muestra ceros
            //Negrita en Cuentas de grupo
            let encontrado = grupos.find(grupo => grupo === hookData.row.index);
            if (encontrado != undefined) {
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

   exportaCuentas() {
      this.nombrearchivo = this.formImprimir.value.nombrearchivo;
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(this.nombrearchivo);
      // Fila 1
      worksheet.addRow(['', 'Lista de Cuentas']);
      worksheet.getCell('B1').font = { name: 'Times New Roman', bold: true, size: 14, color: { argb: '002060' } }

      // Fila 2
      worksheet.addRow([]);
      // worksheet.getCell('B2').font = { name: 'Times New Roman', bold: true, size: 16, color: { argb: '001060' } };

      //Fila 3 Cabecera 
      const headerRowCell = worksheet.addRow(['Código', 'Nombre', 'Grupo', 'Movi', 'Sigef', 'Tipo', 'Aso.Debe', 'Aso.Haber']);
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
      this._cuentas.forEach(() => {
         let movcue = 'No';
         if (this._cuentas[i].movcue == 2) movcue = 'Si';
         let sigef = 'No';
         if (this._cuentas[i].sigef == 1) sigef = 'Si';
         worksheet.addRow([this._cuentas[i].codcue, this._cuentas[i].nomcue, this._cuentas[i].grucue, movcue,
            sigef, this._cuentas[i].tiptran, this._cuentas[i].asodebe, this._cuentas[i].asohaber]);
         i++;
      });

      // Establece el ancho de las columnas
      const anchoConfig = [
         { columnIndex: 1, widthInChars: 18 },
         { columnIndex: 2, widthInChars: 80 },
         { columnIndex: 3, widthInChars: 12 },
         { columnIndex: 4, widthInChars: 12 },
         { columnIndex: 5, widthInChars: 18 },
         { columnIndex: 6, widthInChars: 12 },
         { columnIndex: 7, widthInChars: 20 },
         { columnIndex: 8, widthInChars: 20 },
      ];
      anchoConfig.forEach(config => {
         worksheet.getColumn(config.columnIndex).width = config.widthInChars;
      });

      // Columnas centradas 
      const columnsToCenter = [4, 5, 6];
      columnsToCenter.forEach(columnIndex => {
         worksheet.getColumn(columnIndex).eachCell({ includeEmpty: true }, cell => {
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
         });
      });

      //Coloca la fila de Totales
      worksheet.addRow(['', 'TOTAL: ' + this._cuentas.length]);
      worksheet.getCell('B' + (this._cuentas.length + 4).toString()).font = { bold: true }

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

   exportaSaldos() {
      this.nombrearchivo = this.formImprimir.value.nombrearchivo;
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(this.nombrearchivo);
      // Fila 1
      worksheet.addRow(['', 'Saldos de las Cuentas']);
      worksheet.getCell('B1').font = { name: 'Times New Roman', bold: true, size: 14, color: { argb: '002060' } }

      // Fila 2
      worksheet.addRow(['', 'Del ' + this.formImprimir.value.desde + ' al ' + this.formImprimir.value.hasta]);
      worksheet.getCell('B2').style = { font: { name: 'Times New Roman', bold: true, size: 10, color: { argb: '002060' } } };

      //Fila 3 Cabecera 
      const cabecera = worksheet.addRow(['Código', 'Nombre', 'Débitos', 'Créditos', 'Saldo']);
      cabecera.eachCell(celda => {
         celda.style = { fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: '002060' } }, font: { bold: true, name: 'Times New Roman', color: { argb: 'FFFFFF' } } }
      });

      // Agrega los datos a la hoja de cálculo
      let grupos: number[] = [];
      let i = 0;
      this._cuentasF.forEach(() => {
         if (this._cuentasF[i].movcue == 1) grupos.push(i);
         worksheet.addRow([this._cuentasF[i].codcue, this._cuentasF[i].nomcue, this._cuentasF[i].debitos,
         this._cuentasF[i].creditos, this._cuentasF[i].saldo]);
         i++;
      });

      // Establece el ancho de las columnas
      const ancho = [
         { columnIndex: 1, widthInChars: 18 },
         { columnIndex: 2, widthInChars: 80 },
         { columnIndex: 3, widthInChars: 18 },
         { columnIndex: 4, widthInChars: 18 },
         { columnIndex: 5, widthInChars: 18 },

      ];
      ancho.forEach(config => {
         worksheet.getColumn(config.columnIndex).width = config.widthInChars;
      });

      //Filas de grupo en negrita (codigo y nombre)
      for (let i = 4; i <= this._cuentasF.length + 3; i++) {
         let encontrado = grupos.find(grupo => grupo === i - 4);
         if (encontrado != undefined) {
            encontrado = encontrado + 4;
            const row = worksheet.getRow(encontrado);
            row.eachCell((celda) => { celda.font = { bold: true }; });
         }
      }

      // Formato numérico con decimales, alineadas a la derecha y Grupos en negrita
      const columnasFormato = [3, 4, 5];
      for (let i = 4; i <= this._cuentasF.length + 3; i++) {
         columnasFormato.forEach(indiceColumna => {
            const cell = worksheet.getCell(i, indiceColumna);
            let b = false
            if (grupos.includes(i - 4)) b = true;
            cell.style = { numFmt: '#,##0.00', font: { bold: b }, alignment: { horizontal: 'right' } };
         });
      }

      //Coloca la fila de Totales
      // worksheet.addRow(['', 'TOTAL: ' + this._cuentas.length]);
      // worksheet.getCell('B' + (this._cuentas.length + 4).toString()).font = { bold: true }

      // let celdaE = worksheet.getCell('E' + (this._cuentas.length + 4).toString());
      // celdaE.numFmt = '#,##0.00';
      // celdaE.font = { bold: true };
      // celdaE.value = { formula: 'SUM(E4:' + 'E' + (this._cuentas.length + 3).toString() + ')', result: 0, sharedFormula: undefined, date1904: false };
      // console.log('celdaE: ', celdaE)

      // let celdaF = worksheet.getCell('F' + (this._cuentas.length + 4).toString());
      // celdaF.numFmt = '#,##0.00';
      // celdaF.font = { bold: true }
      // celdaF.value = { formula: 'SUM(F4:' + 'F' + (this._cuentas.length + 3).toString() + ')', result: 0, sharedFormula: undefined, date1904: false };

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