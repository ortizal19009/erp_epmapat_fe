import { Component, OnInit } from '@angular/core';

import { NombreAuxiliarPipe } from 'src/app/pipes/nombre-auxiliar.pipe';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as ExcelJS from 'exceljs';
import { FormBuilder, FormGroup } from '@angular/forms';
import { EjecucionService } from 'src/app/servicios/contabilidad/ejecucio.service';
import { ClasificadorService } from 'src/app/servicios/clasificador.service';
import { CuentasService } from 'src/app/servicios/contabilidad/cuentas.service';
import { Router } from '@angular/router';
import { Cuentas } from 'src/app/modelos/contabilidad/cuentas.model';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { ColoresService } from 'src/app/compartida/colores.service';
import { PresupueService } from 'src/app/servicios/contabilidad/presupue.service';

@Component({
   selector: 'app-est-ejecucion-pre',
   templateUrl: './est-ejecucion-pre.component.html',
   styleUrls: ['./est-ejecucion-pre.component.css']
})

export class EstEjecucionPreComponent implements OnInit {

   _cuentas: any;
   formBuscar: FormGroup;
   archExportar: string;
   swfiltro: boolean;
   filtro: string;
   arreglo1: any[] = [];
   date: Date = new Date();
   today: number = Date.now();
   desdeFecha: String;
   hastaFecha: String;
   otraPagina: boolean = false;
   tb1: number;
   tb2: number;
   tb3: number;
   tb4: number;
   tg1 = 0;
   tg2 = 0;
   t37 = 0;
   ts1 = 0;
   ts2 = 0;
   nompar: String;
   codcue: String;
   codpar: String;
   asodebe: String;
   tippar: number = 0;
   tinicia: number;
   tmodi: number;
   tdeven: number;

   constructor(private fb: FormBuilder, private router: Router, private cuentasService: CuentasService,
      public authService: AutorizaService, private coloresService: ColoresService, private presupueService: PresupueService,
      private clasificadorService: ClasificadorService, private ejecuService: EjecucionService) { }

   ngOnInit(): void {
      sessionStorage.setItem('ventana', '/ejecupresup');
      let coloresJSON = sessionStorage.getItem('/ejecupresup');
      if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));
      else this.buscaColor();
      
      const fecha = new Date();
      const año = fecha.getFullYear()
      this.formBuscar = this.fb.group({
         desdeFecha: año + '-01-01',
         hastaFecha: año + '-01-31',
         filtro: '',
      },
         { updateOn: "blur" });
      let buscaDesdeFecha = sessionStorage.getItem("buscaDesdeFecha");
      let buscaHastaFecha = sessionStorage.getItem("buscaHastaFecha");

      this.archExportar = 'Estado de Ejecucion Presupuestario';

      if (buscaDesdeFecha == null || buscaHastaFecha == null) {
         this.buscar();
      } else this.formBuscar.patchValue({
         desdeFecha: buscaDesdeFecha,
         hastaFecha: buscaHastaFecha
      });

      this.filtrar_ctas_aso();
   }

   colocaColor(colores: any) {
      document.documentElement.style.setProperty('--bgcolor1', colores[0]);
      const cabecera = document.querySelector('.cabecera');
      if (cabecera) cabecera.classList.add('nuevoBG1')
      document.documentElement.style.setProperty('--bgcolor2', colores[1]);
      const detalle = document.querySelector('.detalle');
      if (detalle) detalle.classList.add('nuevoBG2');
   }

   async buscaColor() {
      try {
         const datos = await this.coloresService.setcolor(this.authService.idusuario, 'ejecupresup');
         const coloresJSON = JSON.stringify(datos);
         sessionStorage.setItem('/ejecupresup', coloresJSON);
         this.colocaColor(datos);
      } catch (error) { console.error(error); }
   }

   onInputChange() {
      if (this.filtro.trim() !== '') {
         this.swfiltro = true;
      } else {
         this.swfiltro = false;
      }
   }

   async buscar() {
      // console.log('_cta', this._cuentas)
      sessionStorage.setItem('buscaDesdeFecha', this.formBuscar?.controls['desdeFecha'].value.toString());
      sessionStorage.setItem('buscaHastaFecha', this.formBuscar?.controls['hastaFecha'].value.toString());
      this.arreglo1 = [];
      this.tb1 = 0;
      this.tb2 = 0;
      this.tb3 = 0;
      this.tb4 = 0;
      for (const cuentas of this._cuentas) {
         this.codcue = cuentas.codcue;
         this.codpar = cuentas.asodebe;
         if (cuentas.asodebe.substring(0, 1) >= '1' && cuentas.asodebe.substring(0, 1) < '4') {
            this.asodebe = cuentas.asodebe;
            this.tippar = 1;
         } else if (cuentas.asodebe.substring(0, 1) > '4') {
            this.asodebe = '___' + cuentas.asodebe;
            this.tippar = 2;
         }
         // Usamos la palabra clave await para esperar a que se resuelva la promesa
         this.tinicia = await this.totalCodpar();
         if (this.tinicia > 0) {
            this.tmodi = await this.totalModi();
            this.tdeven = await this.totalDeven();
            this.nompar = await this.clasificador();
            if (cuentas.asodebe.substring(0, 1) >= '1' && cuentas.asodebe.substring(0, 1) < '4') {
               this.tb1 += (this.tinicia + this.tmodi);
               this.tb3 += this.tdeven;
            } else {
               this.tb2 += (this.tinicia + this.tmodi);
               this.tb4 += this.tdeven;
            }
            //      console.log('tbbbb', this.tb1, this.tb2, this.tb3)
            this.arreglo1.push({
               codcue: this.codcue, nompar: this.nompar, presupuesto: (this.tinicia + this.tmodi), ejecucion: this.tdeven,
               diferencia: (this.tinicia + this.tmodi) - this.tdeven
            })
         }
         // console.log('nom-re:', this.arreglo1);
      }
      this.totales();
   }

   totalCodpar(): Promise<number> {
      return new Promise((resolve, reject) => {
         this.presupueService.getTotalCodpar(this.tippar, this.asodebe).subscribe({
           next: datos => {
             // Resolvemos la promesa con el valor de datos
             resolve(datos);
             //   console.log('total:', datos);
           },
           error: err => {
             // Rechazamos la promesa con el error
             reject(err);
           }
         });
      });
   }

   totalModi(): Promise<number> {
      return new Promise((resolve, reject) => {
         this.ejecuService.getTotalModi(this.asodebe, this.formBuscar.value.desdeFecha, this.formBuscar.value.hastaFecha).subscribe({
            next: datos => {
               // Resolvemos la promesa con el valor de datos
               resolve(datos);
               //      console.log('total:', datos);
            },
            error: err => {
               // Rechazamos la promesa con el error
               reject(err);
            }
         });
      });
   }

   totalDeven(): Promise<number> {
      return new Promise((resolve, reject) => {
         this.ejecuService.getTotalDeven(this.asodebe, this.formBuscar.value.desdeFecha, this.formBuscar.value.hastaFecha).subscribe({
            next: datos => {
               // Resolvemos la promesa con el valor de datos
               resolve(datos);
               //      console.log('total:', datos);
            },
            error: err => {
               // Rechazamos la promesa con el error
               reject(err);
            }
         });
      });
   }

   totales() {
      var k = 0;
      var sw1 = 0;
      var sw2 = 0;
      this.tg1 = 0;
      this.tg2 = 0;
      this.t37 = 0;
      this.ts1 = 0;
      this.ts2 = 0;
      this.t37 = this.tb2 - this.tb1;
      this.tg1 = this.tb1 + this.tb2 + this.t37;
      this.tg2 = this.tb3 + this.tb4;
      this.ts1 = (this.tb1 + this.t37) - this.tb2;
      this.ts2 = this.tb3 - this.tb4;
      for (k = 0; k < this.arreglo1.length; k++) {
         if (sw1 === 0) {
            this.arreglo1.splice(k, 0, ({ codcue: '', nompar: '', presupuesto: this.tg1, ejecucion: this.tg2, diferencia: this.tg1 - this.tg2 }));
            sw1 = 1;
         }
         if (this.arreglo1[k].codcue == '113.97' && sw2 === 0) {
            this.arreglo1.splice(k, 0, ({ codcue: '37', nompar: 'SALDOS DISPONIBLES', presupuesto: this.t37, ejecucion: 0, diferencia: this.t37 }));
            sw2 = 1;
         }
      }
      // this.arreglo1.push({ codcue: '', nompar: 'SUPERAVIT DE FINANCIAMIENTO', presupuesto: ts1, ejecucion: ts2, diferencia: ts1-ts2});
      if ((this.ts1 - this.ts2) >= 0) {
         this.arreglo1.push({ codcue: '', nompar: 'SUPERAVIT PRESUPUESTARIO', presupuesto: this.ts1, ejecucion: this.ts2, diferencia: this.ts1 - this.ts2 });
      } else {
         this.arreglo1.push({ codcue: '', nompar: 'DEFICIT PRESUPUESTARIO', presupuesto: this.ts1, ejecucion: this.ts2, diferencia: this.ts1 - this.ts2 });
      }

   }

   clasificador(): Promise<String> {
      //  console.log('cccc', this.codpar)
      return new Promise((resolve, reject) => {
         this.clasificadorService.getByCodigo(this.codpar).subscribe({
            next: datos => {
               // Resolvemos la promesa con el valor de datos
               resolve(datos[0].nompar);
            },
            error: err => {
               // Rechazamos la promesa con el error
               reject(err);
            }
         });
      });
   }

   onCellClick(event: any, cuentas: Cuentas) {
      const tagName = event.target.tagName;
      if (tagName === 'TD') {
         //    this.datosBuscar();
         sessionStorage.setItem('codcueToPresupue', cuentas.codcue.toString());
         //  this.router.navigate(['presupue']);
      }
   }

   filtrar_ctas_aso() {
      // console.log('Está en filtrar_ctas_aso()')
      this.cuentasService.getListaCuentas().subscribe({
         next: resp => {
            this._cuentas = resp.filter(data => (data.asodebe != null && data.asohaber != null) && (data.asodebe.length === 2 || data.asohaber.length === 2));
         },
         error: err => console.log(err.error)
      });
   }

   exportar() {
      this.exporta();
   };

   pdf() {
      console.log('pdf', this.arreglo1)
      const nombreEmision = new NombreAuxiliarPipe(); // Crea una instancia del pipe
      let m_izquierda = 20;
      var doc = new jsPDF({});
      doc.setFont("times", "bold"); doc.setFontSize(16); doc.text("EpmapaT", m_izquierda, 10);
      doc.setFont("times", "bold"); doc.setFontSize(12); doc.text("ESTADO DE EJECUCIÓN PRESUPUESTARIA", m_izquierda, 16);
      doc.setFont("times", "bold"); doc.setFontSize(10); doc.text("Del " + this.formBuscar.value.desdeFecha + " Al " +
         this.formBuscar.value.hastaFecha, m_izquierda, 24);
      let datos: any = [];
      this.arreglo1.forEach(function (articulo) {
         datos.push(Object.values(articulo));
      })

      const addPageNumbers = function () {
         const pageCount = doc.internal.pages.length;
         for (let i = 1; i <= pageCount - 1; i++) {
            doc.setPage(i);
            doc.setFontSize(10);
            doc.text('Página ' + i + ' de ' + (pageCount - 1), m_izquierda, doc.internal.pageSize.height - 10);
         }
      };

      autoTable(doc, {
         head: [['CÓDIGO', 'CONCEPTOS', 'PRESUPUESTO', 'EJECUCIÓN', 'DIFERENCIA']],
         theme: 'grid',
         headStyles: { fillColor: [68, 103, 114], fontStyle: 'bold', halign: 'center' },
         styles: { font: 'helvetica', fontSize: 7, cellPadding: 1, halign: 'center' },
         columnStyles: {
            0: { halign: 'left' },
            1: { halign: 'left' },
            2: { halign: 'right' },
            3: { halign: 'right' },
            4: { halign: 'right' },
         },
         margin: { left: m_izquierda - 4, top: 26, right: 4, bottom: 13 },
         //   body: [datos.codcue, datos.nompar, datos.presupuesto, datos.ejecucion, datos.diferencia],
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
         filename: 'est_ejeccion_pre.pdf',
         orientation: 'portrait',
         unit: 'mm',
         format: 'a4',
         compress: true,

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

   // Excel ESTADO DE EJECUCIÓN PRESUPUESTARIA
   exporta() {
      console.log('excel', this.arreglo1)
      const nombreEmision = new NombreAuxiliarPipe(); // Crea una instancia del pipe
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('EstadoEjecucionPre');
      worksheet.addRow(['EpmapaT', 'ESTADO DE EJECUCIÓN PRESUPUESTARIA']);
      worksheet.addRow(['Del ' + this.formBuscar.value.desdeFecha + ' Al ' + this.formBuscar.value.hastaFecha]);
      // Formato Celda C1
      const cellC1 = worksheet.getCell('C1');
      const customStyle = { font: { name: 'Times New Roman', bold: true, size: 14, color: { argb: '002060' } } };
      cellC1.font = customStyle.font;
      worksheet.addRow([]);

      const cabecera = ['CÓDIGO', 'CONCEPTOS', 'PRESUPUESTO', 'EJECUCIÓN', 'DIFERENCIA'];
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
      this.arreglo1.forEach((datos) => {
         const row = [datos.codcue, datos.nompar, datos.presupuesto, datos.ejecucion, datos.diferencia]
         worksheet.addRow(row);
      });

      //Coloca la fila del Total

      worksheet.getCell('A' + (this.arreglo1.length + 9).toString()).font = { bold: true }
      let celdaB = worksheet.getCell('B' + (this.arreglo1.length + 9).toString());
      celdaB.numFmt = '#,##0';
      celdaB.font = { bold: true };

      // Establece el ancho de las columnas
      const anchoConfig = [
         { columnIndex: 1, widthInChars: 16 },
         { columnIndex: 2, widthInChars: 40 },
         { columnIndex: 3, widthInChars: 20 }

      ];
      anchoConfig.forEach(config => {
         worksheet.getColumn(config.columnIndex).width = config.widthInChars;
      });

      // Columnas centradas 
      const columnsToCenter = [2];
      columnsToCenter.forEach(columnIndex => {
         worksheet.getColumn(columnIndex).eachCell({ includeEmpty: true }, cell => {
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
         });
      });
      // Columnas a la derecha 
      let columnsToRigth = [2];
      columnsToRigth.forEach(columnIndex => {
         worksheet.getColumn(columnIndex).eachCell({ includeEmpty: true }, cell => {
            cell.alignment = { horizontal: 'left' };
         });
      });

      // Formato numérico
      const numeroStyle = { numFmt: '#,##0.00' };
      const columnsToFormat = [3, 4, 5, 6, 7, 8, 9, 10];
      for (let i = 5; i <= this.arreglo1.length + 4; i++) {
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
