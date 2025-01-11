import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NiifcuentasService } from 'src/app/servicios/contabilidad/niifcuentas.service';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as ExcelJS from 'exceljs';

@Component({
   selector: 'app-imp-niifcuentas',
   templateUrl: './imp-niifcuentas.component.html',
   styleUrls: ['./imp-niifcuentas.component.css']
})
export class ImpNiifcuentasComponent implements OnInit {

   swimprimir: boolean = true;
   formImprimir: FormGroup;
   opcreporte: number = 1;
   otrapagina: boolean = false;
   swbotones: boolean = false;
   swcalculando: boolean = false;
   txtcalculando = 'Calculando';
   pdfgenerado: string;
   _niifcuentas: any;
   today: number = Date.now();
   date: Date = new Date();
   nombrearchivo: string;

   constructor(public fb: FormBuilder, private router: Router, private niifService: NiifcuentasService) { }

   ngOnInit(): void {
      sessionStorage.setItem('ventana', '/niifcuentas');
      let coloresJSON = sessionStorage.getItem('/niifcuentas');
      if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));

      const niifcuentasJSON = sessionStorage.getItem('niifcuentasToImpExp');
      if (niifcuentasJSON) {
         const niifcuentas = JSON.parse(niifcuentasJSON);
         this.formImprimir = this.fb.group({
            reporte: '1',
            codcue: niifcuentas.codcue,
            nomcue: niifcuentas.nomcue,
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

   retornar() { this.router.navigate(['niifcuentas']); }

   async imprimir() {
      this.swbotones = true;
      this.swcalculando = true;
      let fecha = this.formImprimir.value.fecha;
      switch (this.opcreporte) {
         case 1:  //Lista de cuentas NIIF
            try {
               let codcue = this.formImprimir.value.codcue;
               let nomcue = this.formImprimir.value.nomcue;
               this._niifcuentas = await this.niifService.getByCodigoyNombreAsync(codcue, nomcue)
               this.swcalculando = false;
               if (this.swimprimir) this.txtcalculando = 'Mostrar'
               else this.txtcalculando = 'Descargar'
            } catch (error) {
               console.error('Error al obtener los cuentas NIIF:', error);
            }
            break;
         case 2:  //Detalle de asientos
         // try {
         //    this._niifcuentas = await this.facService.getByFechacobroTotAsync(fecha);
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
            if (this.swimprimir) this.imprimeNiifcuentas();
            else this.exportaNiifcuentas();
            break;
         case 2:  //Detalle de asientos
         // if (this.swimprimir) this.imprimirFacturas();
         // else this.exportarFacturas();
         // break;
      }
   }

   imprimeNiifcuentas() {
      this.otrapagina = this.formImprimir.value.otrapagina;
      const doc = new jsPDF('p', 'mm', 'a4', true);
      let m_izquierda = 30;
      doc.setFont("times", "bold"); doc.setFontSize(16); doc.text("EpmapaT", m_izquierda, 10);
      doc.setFont("times", "bold"); doc.setFontSize(12); doc.text("Lista de cuentas NIIF", m_izquierda, 16);

      const datos: any = [];
      let i = 0;
      this._niifcuentas.forEach(() => {
         let movcue = 'No'
         if (this._niifcuentas[i].movcue) movcue = 'Si'
         datos.push([this._niifcuentas[i].codcue, this._niifcuentas[i].nomcue, this._niifcuentas[i].grucue,
         this._niifcuentas[i].nivcue, movcue]);
         i++;
      });
      datos.push(['', 'TOTAL: ' + this._niifcuentas.length]);

      autoTable(doc, {
         head: [['Código', 'Nombre', 'Grupo', 'Nivel', 'Movimiento']],
         theme: 'grid',
         headStyles: { fillColor: [68, 103, 114], fontStyle: 'bold', halign: 'center' },
         styles: { font: 'helvetica', fontSize: 8, cellPadding: 1, halign: 'center' },
         margin: { left: m_izquierda - 1, top: 18, right: 13, bottom: 13 },

         columnStyles: {
            0: { halign: 'left', cellWidth: 20 },
            1: { halign: 'left', cellWidth: 100 },
            2: { halign: 'left', cellWidth: 18 },
            3: { halign: 'center', cellWidth: 12 },
            4: { halign: 'center', cellWidth: 18 },
         },
         body: datos,

         didParseCell: function (hookData) {
            //Negrita totales y cuentas de grupo
            if ((hookData.cell.raw === '' && hookData.column.index === 0) || (hookData.column.index == 4 && hookData.cell.text.toString() == 'No')) {
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

   exportaNiifcuentas() {
      this.nombrearchivo = this.formImprimir.value.nombrearchivo;
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(this.nombrearchivo);
      // Fila 1
      worksheet.addRow(['', 'Lista de cuentas NIIF']);
      // const cellB1 = worksheet.getCell('B1');
      // const customStyle = { font: { name: 'Times New Roman', bold: true, size: 14, color: { argb: '002060' } } };
      // cellB1.font = customStyle.font;

      worksheet.getCell('B1').font = { name: 'Times New Roman', bold: true, size: 14, color: { argb: '002060' } }

      // Fila 2
      worksheet.addRow([ ]);
      // worksheet.getCell('B2').font = { name: 'Times New Roman', bold: true, size: 16, color: { argb: '001060' } };

      //Fila 3 Cabecera 
      const headerRowCell = worksheet.addRow(['Código', 'Nombre', 'Grupo', 'Nivel', 'Movimiento']);
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
      this._niifcuentas.forEach(() => {
         let movcue = 'No'
         if (this._niifcuentas[i].movcue) movcue = 'Si'
         worksheet.addRow([this._niifcuentas[i].codcue, this._niifcuentas[i].nomcue, this._niifcuentas[i].grucue,
         this._niifcuentas[i].nivcue, movcue]);
         i++;
      });

      // Establece el ancho de las columnas
      const anchoConfig = [
         { columnIndex: 1, widthInChars: 18 },
         { columnIndex: 2, widthInChars: 80 },
         { columnIndex: 3, widthInChars: 12 },
         { columnIndex: 4, widthInChars: 12 },
         { columnIndex: 5, widthInChars: 18 },
      ];
      anchoConfig.forEach(config => {
         worksheet.getColumn(config.columnIndex).width = config.widthInChars;
      });

      // Columnas centradas 
      const columnsToCenter = [4, 5];
      columnsToCenter.forEach(columnIndex => {
         worksheet.getColumn(columnIndex).eachCell({ includeEmpty: true }, cell => {
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
         });
      });
      // Columnas a la derecha 
      // let columnsToRigth = [5, 6];
      // columnsToRigth.forEach(columnIndex => {
      //    worksheet.getColumn(columnIndex).eachCell({ includeEmpty: true }, cell => {
      //       cell.alignment = { horizontal: 'right' };
      //    });
      // });

      // Formato numérico con decimales
      // const numeroStyle1 = { numFmt: '#,##0.00' };
      // const columnsToFormat1 = [5, 6];
      // for (let i = 4; i <= this._niifcuentas.length + 3; i++) {
      //    columnsToFormat1.forEach(columnIndex => {
      //       const cell = worksheet.getCell(i, columnIndex);
      //       cell.style = numeroStyle1;
      //    });
      // }

      //Coloca la fila de Totales
      worksheet.addRow(['', 'TOTAL: ' + this._niifcuentas.length]);
      worksheet.getCell('B' + (this._niifcuentas.length + 4).toString()).font = { bold: true }

      // let celdaE = worksheet.getCell('E' + (this._niifcuentas.length + 4).toString());
      // celdaE.numFmt = '#,##0.00';
      // celdaE.font = { bold: true };
      // celdaE.value = { formula: 'SUM(E4:' + 'E' + (this._niifcuentas.length + 3).toString() + ')', result: 0, sharedFormula: undefined, date1904: false };
      // console.log('celdaE: ', celdaE)

      // let celdaF = worksheet.getCell('F' + (this._niifcuentas.length + 4).toString());
      // celdaF.numFmt = '#,##0.00';
      // celdaF.font = { bold: true }
      // celdaF.value = { formula: 'SUM(F4:' + 'F' + (this._niifcuentas.length + 3).toString() + ')', result: 0, sharedFormula: undefined, date1904: false };

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
