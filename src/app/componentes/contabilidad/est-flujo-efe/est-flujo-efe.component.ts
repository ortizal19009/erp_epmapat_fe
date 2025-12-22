import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { CuentasService } from 'src/app/servicios/contabilidad/cuentas.service';
import { EjecucionService } from 'src/app/servicios/contabilidad/ejecucio.service';
import { TransaciService } from 'src/app/servicios/contabilidad/transaci.service';

import { NombreAuxiliarPipe } from 'src/app/pipes/nombre-auxiliar.pipe';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as ExcelJS from 'exceljs';
import { Cuentas } from 'src/app/modelos/contabilidad/cuentas.model';
import { ColoresService } from 'src/app/compartida/colores.service';
import { AutorizaService } from 'src/app/compartida/autoriza.service';

@Component({
   selector: 'app-est-flujo-efe',
   templateUrl: './est-flujo-efe.component.html',
   styleUrls: ['./est-flujo-efe.component.css']
})

export class EstFlujoEfeComponent implements OnInit {

   _cuentas: any;
   formBuscar: FormGroup;
   archExportar: string;
   swfiltro: boolean;
   filtro: string;
   arreglo1: any[] = [];
   arreglo2: any[] = [];
   arreglo3: any[] = [];
   date: Date = new Date();
   today: number = Date.now();
   desdeFecha: String;
   hastaFecha: String;
   otraPagina: boolean = false;
   tot11: number;
   tot12: number;
   tot13: number;
   tot14: number;
   tot15: number;
   tot16: number;
   tot17: number;
   tot18: number;
   tb8: number;
   td18: number;
   th18: number;
   nomcue: String;
   codcue: String;
   codpar: String;
   asodebe: String;
   tippar: number = 0;
   tflujo: number;
   tmodi: number;
   tdeven: number;
   debcre: number;

   // private presupueService: PresupueService,
   constructor(private fb: FormBuilder, private router: Router, private cuentasService: CuentasService,
      public authService: AutorizaService, private coloresService: ColoresService,
      private transaciService: TransaciService, private ejecucionService: EjecucionService,
   ) { }

   ngOnInit(): void {
      sessionStorage.setItem('ventana', '/flujoefectivo');
      let coloresJSON = sessionStorage.getItem('/flujoefectivo');
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

      //    let buscaDesdeFecha = sessionStorage.getItem("buscaDesdeFecha");
      // let buscaHastaFecha = sessionStorage.getItem("buscaHastaFecha");

      this.archExportar = 'Estado de Flujo del Efectivo';

      this.filtrar_ctas();

      // if (buscaDesdeFecha == null || buscaHastaFecha == null) {
      //    this.buscar();
      // } else this.formBuscar.patchValue({
      //    desdeFecha: buscaDesdeFecha,
      //    hastaFecha: buscaHastaFecha
      // });

      this.buscar();
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
         const datos = await this.coloresService.setcolor(this.authService.idusuario, 'flujoefectivo');
         const coloresJSON = JSON.stringify(datos);
         sessionStorage.setItem('/flujoefectivo', coloresJSON);
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
      sessionStorage.setItem('buscaDesdeFecha', this.formBuscar?.controls['desdeFecha'].value.toString());
      sessionStorage.setItem('buscaHastaFecha', this.formBuscar?.controls['hastaFecha'].value.toString());
      this.arreglo1 = [];
      this.tot11 = 0;
      this.tot12 = 0;
      this.tot13 = 0;
      this.tot14 = 0;
      this.tot15 = 0;
      this.tot16 = 0;
      this.tot17 = 0;
      this.tot18 = 0;
      this.tb8 = 0;
      let debhab: number = 0;
      for (const cuentas of this.arreglo2) {
         this.codcue = cuentas.codcue;
         this.nomcue = cuentas.nomcue;
         switch (cuentas.grufluefec) {
            case 11:
               this.debcre = 2;
               break;
            case 12:
               this.debcre = 1;
               break;
            case 13:
               this.debcre = 2;
               break;
            case 14:
               this.debcre = 1;
               break;
            case 15:
               this.debcre = 2;
               break;
            case 17:
               if (this.codcue.substring(0, 3) == '113') {
                  this.debcre = 2;
               }
               else {
                  this.debcre = 1;
               }
               break;
            case 18:
               //   if (this.codcue.substring(0, 3) == '111' || this.codcue.substring(0, 3) == '112' || this.codcue.substring(0, 3) == '211' ) {
               this.debcre = 2;
               break;
         }
         // Usamos la palabra clave await para esperar a que se resuelva la promesa
         this.tflujo = await this.totalFlujo();
         if (this.tflujo > 0) {
            //    console.log('tbbbb', this.tot11,this.tot12)
            switch (cuentas.grufluefec) {
               case 11:
                  this.tot11 += this.tflujo;
                  break;
               case 12:
                  this.tot12 += this.tflujo;
                  break;
               case 13:
                  this.tot13 += this.tflujo;
                  break;
               case 14:
                  this.tot14 += this.tflujo;
                  break;
               case 15:
                  this.tot15 += this.tflujo;
                  break;
               case 17:
                  if (this.codcue.substring(0, 3) == '113') {
                     this.tot17 += this.tflujo;
                  } else {
                     this.tot17 -= this.tflujo;
                  }

                  break;
               case 18:
                  this.th18 = this.tflujo;
                  this.debcre = 1;
                  this.td18 = await this.totalFlujo();
                  if (this.codcue.substring(0, 3) == '212') {
                     this.tflujo = this.td18 - this.th18;
                     this.tot18 -= this.tflujo;
                  } else {
                     this.tflujo = this.th18 - this.td18;
                     this.tot18 += this.tflujo;
                  };


                  break;
            }
            this.arreglo1.push({ grupo: cuentas.grufluefec, codcue: this.codcue, nomcue: this.nomcue, flujo: this.tflujo })
         }
      }
      this.total_grupo();
   }

   totalFlujo(): Promise<number> {
      return new Promise((resolve, reject) => {
         this.transaciService.getTotalFlujo(this.codcue, this.formBuscar.value.desdeFecha, this.formBuscar.value.hastaFecha, this.debcre).subscribe({
           next: datos => {
             // Resolvemos la promesa con el valor de datos
             resolve(datos);
             //  console.log('total:', datos,);
           },
           error: err => {
             // Rechazamos la promesa con el error
             reject(err);
           }
         });
      });
   }

   total_grupo() {
      var k = 0;
      var sw1 = 0;
      var sw2 = 0;
      var sw3 = 0;
      var sw4 = 0;
      var sw5 = 0;
      var sw6 = 0;
      var sw7 = 0;
      var sw8 = 0;
      for (k = 0; k < this.arreglo1.length; k++) {
         if (this.arreglo1[k].grupo === 11 && sw1 === 0) {
            this.arreglo1.splice(k, 0, ({ grupo: '', codcue: '', nomcue: 'FUENTES OPERACIONALES ', flujo: this.tot11 }));
            sw1 = 1;
         }
         if (this.arreglo1[k].grupo === 12 && sw2 === 0) {
            this.arreglo1.splice(k, 0, ({ grupo: '', codcue: '', nomcue: 'USOS OPERACIONALES', flujo: this.tot12 }));
            sw2 = 1;
         }
         if (this.arreglo1[k].grupo === 13 && sw3 === 0) {
            this.arreglo1.splice(k, 0, ({ grupo: '', codcue: '', nomcue: 'FUENTES DE CAPITAL', flujo: this.tot13 }));

            if ((this.tot11 - this.tot12) >= 0) {
               this.arreglo1.splice(k, 0, ({ grupo: '', codcue: '', nomcue: 'SUPERAVIT CORRIENTE', flujo: (this.tot11 - this.tot12) }));
            } else {
               this.arreglo1.splice(k, 0, ({ grupo: '', codcue: '', nomcue: 'DEFICIT CORRIENTE', flujo: (this.tot12 - this.tot11) }));
            }
            sw3 = 1;
         }
         if (this.arreglo1[k].grupo === 14 && sw4 === 0) {
            this.arreglo1.splice(k, 0, ({ grupo: '', codcue: '', nomcue: 'USOS DE PRODUCCIÓN, INVERSIÓN Y CAPITAL', flujo: this.tot14 }));
            sw4 = 1;
         }
         if (this.arreglo1[k].grupo === 15 && sw5 === 0) {
            this.arreglo1.splice(k, 0, ({ grupo: '', codcue: '', nomcue: 'FUENTES DE FINANCIAMIENTO', flujo: this.tot15 }));
            this.arreglo1.splice(k, 0, ({ grupo: '', codcue: '', nomcue: 'FINANCIAMIENTO DEL DEFICIT', flujo: 0 }));

            if (((this.tot13 - this.tot14) - (this.tot11 - this.tot12)) >= 0) {
               this.arreglo1.splice(k, 0, ({ grupo: '', codcue: '', nomcue: 'SUPERAVIT BRUTO', flujo: (this.tot13 - this.tot14) - (this.tot11 - this.tot12) }));
            } else {
               this.arreglo1.splice(k, 0, ({ grupo: '', codcue: '', nomcue: 'DEFICIT BRUTO', flujo: (this.tot14 - this.tot13) - (this.tot11 - this.tot12) }));
            }

            if ((this.tot13 - this.tot14) >= 0) {
               this.arreglo1.splice(k, 0, ({ grupo: '', codcue: '', nomcue: 'SUPERAVIT DE CAPITAL', flujo: (this.tot13 - this.tot14) }));
            } else {
               this.arreglo1.splice(k, 0, ({ grupo: '', codcue: '', nomcue: 'DEFICIT DE CAPITAL', flujo: (this.tot14 - this.tot13) }));
            }
            sw5 = 1;
         }
         if (this.arreglo1[k].grupo === 17 && sw6 === 0) {
            this.arreglo1.splice(k, 0, ({ grupo: '', codcue: '', nomcue: 'FLUJOS NO PRESUPUESTARIOS', flujo: this.tot17 }));
            this.arreglo1.splice(k, 0, ({ grupo: '', codcue: '', nomcue: 'SUPERAVIT DE FINANCIAMINETO', flujo: this.tot15 }));
            sw6 = 1;
         }
         if (this.arreglo1[k].grupo === 18 && sw7 === 0) {
            this.arreglo1.splice(k, 0, ({ grupo: '', codcue: '', nomcue: 'VARIACIONES NO PRESUPUESTARIAS', flujo: 0 }));
            this.arreglo1.splice(k, 0, ({ grupo: '', codcue: '', nomcue: 'FLUJOS NETOS', flujo: this.tot17 }));
            sw7 = 1;
         }

         if (sw8 === 0) {
            this.arreglo1.push({ grupo: '', codcue: '', nomcue: 'VARIACIONES NETAS', flujo: this.tot18 });
            if ((this.tot15 - this.tot16 + this.tot17 + this.tot18) >= 0) {
               this.arreglo1.push({ grupo: '', codcue: '', nomcue: 'SUPERAVIT BRUTO', flujo: this.tot15 - this.tot16 + this.tot17 + this.tot18 });
            } else {
               this.arreglo1.push({ grupo: '', codcue: '', nomcue: 'DEFICT BRUTO', flujo: this.tot15 - this.tot16 + this.tot17 + this.tot18 });
            }

            sw8 = 1;
         }
      };
   }


   onCellClick(event: any, cuentas: Cuentas) {
      const tagName = event.target.tagName;
      if (tagName === 'TD') {
         //    this.datosBuscar();
         sessionStorage.setItem('codcueToPresupue', cuentas.codcue.toString());
         //  this.router.navigate(['presupue']);
      }
   }

   filtrar_ctas() {
      this.cuentasService.getListaCuentas().subscribe({
         next: resp => {
            this._cuentas = resp.filter(data => (data.grufluefec === 11 || data.grufluefec === 12 ||
               data.grufluefec === 13 || data.grufluefec === 14 ||
               data.grufluefec === 15 || data.grufluefec === 17 ||
               data.grufluefec === 18))
            this.arreglo2 = this._cuentas;
            this.arreglo2.sort((a, b) => (a.grufluefec - b.grufluefec) || (a.codcue.localeCompare(b.codcue)));

         },
         error: err => console.error(err.error)
      });

   }

   exportar() {
      this.exporta();
   };

   pdf() {

      const nombreEmision = new NombreAuxiliarPipe(); // Crea una instancia del pipe
      let m_izquierda = 20;
      var doc = new jsPDF({});
      doc.setFont("times", "bold"); doc.setFontSize(16); doc.text("EpmapaT", m_izquierda, 10);
      doc.setFont("times", "bold"); doc.setFontSize(12); doc.text("ESTADO DE FLUJO DEL EFECTIVO", m_izquierda, 16);
      doc.setFont("times", "bold"); doc.setFontSize(10); doc.text("Del " + this.formBuscar.value.desdeFecha + " Al " +
         this.formBuscar.value.hastaFecha, m_izquierda, 24);
      let datos: any = [];
      this.arreglo1.forEach(function (articulo) {
         datos.push(Object.values([articulo.codcue, articulo.nomcue, articulo.flujo]));
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
         head: [['CÓDIGO', 'DENOMINACIÓN', 'VALOR']],
         theme: 'grid',
         headStyles: { fillColor: [68, 103, 114], fontStyle: 'bold', halign: 'center' },
         styles: { font: 'helvetica', fontSize: 7, cellPadding: 1, halign: 'center' },
         columnStyles: {
            0: { halign: 'left' },
            1: { halign: 'left' },
            2: { halign: 'right' },
         },
         margin: { left: m_izquierda - 4, top: 26, right: 4, bottom: 13 },
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
            if (data.row.index === datos.length - 0) { data.cell.styles.fontStyle = 'bold'; } // Total Bold
         }
      });

      addPageNumbers();
      var opciones = {
         filename: 'est_flujo_efectivo.pdf',
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

   // Excel ESTADO DE FLUJO DEL EFECTIVO
   exporta() {
      //  console.log('excel', this.arreglo1)
      const nombreEmision = new NombreAuxiliarPipe(); // Crea una instancia del pipe
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('EstadoFlujoEfectivo');
      worksheet.addRow(['EpmapaT', 'ESTADO DE FLUJO DEL EFECTIVO']);
      worksheet.addRow(['Del ' + this.formBuscar.value.desdeFecha + ' Al ' + this.formBuscar.value.hastaFecha]);
      // Formato Celda C1
      const cellC1 = worksheet.getCell('C1');
      const customStyle = { font: { name: 'Times New Roman', bold: true, size: 14, color: { argb: '002060' } } };
      cellC1.font = customStyle.font;
      worksheet.addRow([]);

      const cabecera = ['CÓDIGO', 'DENOMINACIÓN', 'VALOR'];
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
         const row = [datos.codcue, datos.nomcue, datos.flujo]
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
