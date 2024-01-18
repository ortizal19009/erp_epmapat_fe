import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { PreingresoService } from 'src/app/servicios/contabilidad/preingreso.service';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as ExcelJS from 'exceljs';

@Component({
   selector: 'app-preingresos',
   templateUrl: './preingresos.component.html',
   styleUrls: ['./preingresos.component.css']
})
export class PreingresosComponent implements OnInit {

   _presupuei: any;
   formBuscar: FormGroup;
   filtro: string;
   swfiltro: boolean;
   disabled = false;
   elimdisabled = true;
   totCodificado = 0; totInicia = 0; totModifi = 0;
   totales = false;
   otraPagina: boolean = false;
   archExportar: string;

   constructor(public fb: FormBuilder, private preingService: PreingresoService, private router: Router) { }

   ngOnInit(): void {
      sessionStorage.setItem('ventana', '/preingresos');
      this.setcolor();

      this.formBuscar = this.fb.group({
         codpar: '',
         nompar: '',
         filtro: '',
      });
      let busPreingCodpar = sessionStorage.getItem("busPreingCodpar") == null ? '' : sessionStorage.getItem("busPreingCodpar");
      let busPreingNompar = sessionStorage.getItem("busPreingNompar") == null ? '' : sessionStorage.getItem("busPreingNompar");
      this.formBuscar.patchValue({
         codpar: busPreingCodpar,
         nompar: busPreingNompar
      });
      this.buscar();
   }

   setcolor() {
      let colores: string[];
      let coloresJSON = sessionStorage.getItem('/preingresos');
      if (!coloresJSON) {
         colores = ['rgb(57, 95, 95)', 'rgb(207, 221, 210)'];
         const coloresJSON = JSON.stringify(colores);
         sessionStorage.setItem('/preingresos', coloresJSON);
      } else colores = JSON.parse(coloresJSON);

      document.documentElement.style.setProperty('--bgcolor1', colores[0]);
      const cabecera = document.querySelector('.cabecera');
      if (cabecera) cabecera.classList.add('nuevoBG1')
      document.documentElement.style.setProperty('--bgcolor2', colores[1]);
      const detalle = document.querySelector('.detalle');
      if (detalle) detalle.classList.add('nuevoBG2');
   }

   buscar() {
      this.preingService.getParingreso(this.formBuscar.value.codpar, this.formBuscar.value.nompar).subscribe({
         next: resp => {
            this._presupuei = resp;
            sessionStorage.setItem('busPreingCodpar', this.formBuscar.controls['codpar'].value == null ? '' : this.formBuscar.controls['codpar'].value);
            sessionStorage.setItem('busPreingNompar', this.formBuscar.controls['nompar'].value == null ? '' : this.formBuscar.controls['nompar'].value);
            this.totales = true;
            this.total()
         },
         error: err => console.error(err.error)
      })
   }

   total() {
      let sumInicia: number = 0;
      let sumModifi: number = 0;
      let i = 0;
      this._presupuei.forEach(() => {
         sumInicia += this._presupuei[i].inicia;
         sumModifi += this._presupuei[i].totmod;
         i++;
      });
      this.totInicia = sumInicia;
      this.totModifi = sumModifi;
      this.totCodificado = sumInicia + sumModifi;
   }

   onInputChange() {
      if (this.filtro.trim() !== '') {
         this.swfiltro = true;
      } else {
         this.swfiltro = false;
      }
   }
   
   onCellClick(event: any, partida: any) {
      const tagName = event.target.tagName;
      if (tagName === 'TD') {
         sessionStorage.setItem('codparToAuxiliar', partida.codpar);
         this.router.navigate(['aux-ingreso']);
      }
   }

   addPreingreso() { this.router.navigate(['/add-preingreso']); }

   pdf() {
      let m_izquierda = 20;
      var doc = new jsPDF();
      doc.setFont("times", "bold"); doc.setFontSize(16); doc.text("EpmapaT", m_izquierda, 10);
      doc.setFont("times", "normal"); doc.setFontSize(12); doc.text("PRESUPUESTO DE INGRESOS", m_izquierda, 16)
      let cabecera = ['PARTIDA', "NOMBRE", "CODIFICADO", "INICIAL", "REFORMA"];

      var datos: any = [];
      var i = 0;
      this._presupuei.forEach(() => {
         datos.push([this._presupuei[i].codpar, this._presupuei[i].nompar,
         this._presupuei[i].inicia + this._presupuei[i].totmod, this._presupuei[i].inicia,
         this._presupuei[i].totmod]);
         i++;
      });
      datos.push(['', 'TOTAL:', this.totCodificado, this.totInicia, this.totModifi]);

      const addPageNumbers = function () {
         const pageCount = doc.internal.pages.length;
         for (let i = 1; i <= pageCount - 1; i++) {
            doc.setPage(i);
            doc.setFont("courier", "normal");
            doc.setFontSize(8);
            doc.text('Página ' + i + ' de ' + (pageCount - 1), m_izquierda, doc.internal.pageSize.height - 10);
         }
      };

      autoTable(doc, {
         theme: 'grid',
         headStyles: { fillColor: [57, 95, 95], fontStyle: 'bold', halign: 'center' },
         styles: { font: 'helvetica', fontSize: 9, cellPadding: 1, halign: 'center' },
         columnStyles: {
            0: { halign: 'center' },
            1: { halign: 'left' },
            2: { halign: 'right' },
            3: { halign: 'right' },
            4: { halign: 'right' }
         },

         margin: { left: m_izquierda - 1, top: 18, right: 10, bottom: 12 },
         head: [cabecera],
         body: datos,

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
      addPageNumbers();

      var opciones = {
         filename: 'intereses.pdf',
         orientation: 'portrait',
         unit: 'mm',
         format: 'a4',
         compress: true
      };

      if (this.otraPagina) doc.output('dataurlnewwindow', opciones);
      else {
         const pdfDataUri = doc.output('datauristring');
         //Si ya existe el <embed> primero lo remueve
         const elementoExistente = document.getElementById('idembed');
         if (elementoExistente) { elementoExistente.remove(); }
         //Crea el <embed>
         var embed = document.createElement('embed');
         embed.setAttribute('src', pdfDataUri);
         embed.setAttribute('type', 'application/pdf');
         embed.setAttribute('width', '75%');
         embed.setAttribute('height', '100%');
         embed.setAttribute('id', 'idembed');
         //Agrega el <embed> al contenedor del Modal
         var container: any;
         container = document.getElementById('pdf');
         container.appendChild(embed);
      }
   }

   exportar() { this.archExportar = 'Presupuesto_Ingresos'; }

   //Exporta
   async exporta() {
      // const nombreEmision = new NombreEmisionPipe(); // Crea una instancia del pipe
      
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Rutas por Emisión');

      worksheet.addRow(['', '', 'PRESUPUESTO DE INGRESOS' ]);

      // Formato Celda C1
      const cellC1 = worksheet.getCell('C1');
      const customStyle = { font: { name: 'Times New Roman', bold: true, size: 14, color: { argb: '002060' } } };
      cellC1.font = customStyle.font;

      worksheet.addRow([]);

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
      let i = 1;
      this._presupuei.forEach((item: any) => {
         let fila = worksheet.addRow([i, item.codpar, item.nompar, item.inicia + item.totmod,  item.inicia, item.totmod ]);
         i++;
      });

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

      // Crea un archivo Excel
      workbook.xlsx.writeBuffer().then(buffer => {
         const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
         const url = window.URL.createObjectURL(blob);

         // Crear un enlace para descargar el archivo
         const a = document.createElement('a');
         a.href = url;
         a.download = `${this.archExportar}.xlsx`; // Usa el nombre proporcionado por el usuario
         a.click();

         window.URL.revokeObjectURL(url); // Libera recursos
      });
   }

}
