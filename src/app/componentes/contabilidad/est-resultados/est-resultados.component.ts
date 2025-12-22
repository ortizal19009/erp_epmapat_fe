import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { Cuentas } from 'src/app/modelos/contabilidad/cuentas.model';
import { Transaci } from 'src/app/modelos/contabilidad/transaci.model';
import { CuentasService } from 'src/app/servicios/contabilidad/cuentas.service';
import { NivelesService } from 'src/app/servicios/contabilidad/niveles.service';
import { TransaciService } from 'src/app/servicios/contabilidad/transaci.service';

import { NombreAuxiliarPipe } from 'src/app/pipes/nombre-auxiliar.pipe';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as ExcelJS from 'exceljs';
import { ColoresService } from 'src/app/compartida/colores.service';
import { AutorizaService } from 'src/app/compartida/autoriza.service';

@Component({
   selector: 'app-est-resultados',
   templateUrl: './est-resultados.component.html',
   styleUrls: ['./est-resultados.component.css']
})

export class EstResultadosComponent implements OnInit {

   _cuentas: any;
   _transaci: any;
   _niveles: any;
   _est: any;
   formBuscar: FormGroup;
   cuentas = {} as Cuentas; //Interface para los datos de la Cuenta
   transaci = {} as Transaci;
   swfiltro: boolean;
   filtro: string;
   disabled = true;
   swvalido = 1;
   arreglo1: any[] = [];
   arreglo2: any[] = [];
   arreglo3: any[] = [];

   date: Date = new Date();
   today: number = Date.now();
   nivel_par: String;
   codcue: String;
   codcue_par: String;
   debcre: number;
   valor: number;
   debe: number = 0;
   haber: number = 0;
   asiento: number = 0;
   desdeFecha: String;
   hastaFecha: String;
   otraPagina: boolean = false;
   archExportar: string;
   nivcue: number;
   intgrupo: number = 0;
   tb1: number;
   tb2: number;
   tb3: number;
   tb4: number;
   tb5: number;
   tb6: number;
   tb7: number;
   tb8: number;

   constructor(private fb: FormBuilder, private router: Router,
      public authService: AutorizaService, private coloresService: ColoresService,
      private cuentasService: CuentasService, private transaciService: TransaciService,
      private nivelesService: NivelesService) { }

   ngOnInit(): void {
      sessionStorage.setItem('ventana', '/estresultados');
      let coloresJSON = sessionStorage.getItem('/estresultados');
      if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));
      else this.buscaColor();

      const fecha = new Date();
      const año = fecha.getFullYear()
      this.formBuscar = this.fb.group({
         numnivel: 9,
         desdeFecha: año + '-01-01',
         hastaFecha: año + '-01-31',
      });

      this.archExportar = 'EstadoResultados';

      // let buscaDesdeFecha = sessionStorage.getItem("buscaDesdeFecha");
      // let buscaHastaFecha = sessionStorage.getItem("buscaHastaFecha");
      // this.formBuscar.patchValue({
      //   desdeFecha: buscaDesdeFecha,
      //   hastaFecha: buscaHastaFecha
      // });
      // console.log('Llama a buscar()')
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
         const datos = await this.coloresService.setcolor(this.authService.idusuario, 'estresultados');
         const coloresJSON = JSON.stringify(datos);
         sessionStorage.setItem('/estresultados', coloresJSON);
         this.colocaColor(datos);
      } catch (error) { console.error(error); }
   }

   buscar() {
      // console.log('Esta en buscar()')
      sessionStorage.setItem('buscaDesdeFecha', this.formBuscar?.controls['desdeFecha'].value.toString());
      sessionStorage.setItem('buscaHastaFecha', this.formBuscar?.controls['hastaFecha'].value.toString());
      this.cuentasService.getListaCuentas().subscribe({
         next: resp => {
            this._cuentas = resp.filter(data =>
               data.codcue.startsWith('6') && data.intgrupo != null && data.idnivel.idnivel >= 3);
            this.arreglo2 = this._cuentas;
            this.arreglo2.sort((a, b) => (a.intgrupo - b.intgrupo) || (a.codcue.localeCompare(b.codcue)));
         },
         error: err => console.error(err.error)
      });

      this.nivelesService.getListaNiveles().subscribe({
         next: resp => { this._niveles = resp },
         error: err => console.error(err.error)
      });
   }

   async estado_resultados() {
      this.tb1 = 0;
      this.tb2 = 0;
      this.tb3 = 0;
      this.tb4 = 0;
      this.tb5 = 0;
      this.tb6 = 0;
      this.tb7 = 0;
      this.tb8 = 0;
      this.arreglo1 = [];
      this.arreglo3 = [];
      this.valor = 0;
      let grupos: number[] = [6621, 6622, 6623, 6624, 6625];
      let transacciones: any[] = [];
      for (let i = 0; i < grupos.length; i++) {
         this.intgrupo = grupos[i];
         this._est = await this.totalTransa();
         transacciones = transacciones.concat(this._est);
      }
      // console.log('estados1', this._est, transacciones);

      for (const transacio1 of transacciones) {
         this.codcue = transacio1.codcue;
         console.log('Busca: ', this.codcue)
         let registroActual = this.arreglo2.find((r: { codcue: any; }) => r.codcue === this.codcue);
         if (registroActual != undefined) {
            this.intgrupo = transacio1.intgrupo;
            if (registroActual.codcue.substring(0, 2) == '62') {
               this.valor = transacio1.credito - transacio1.debito;
               this.tb6 += this.valor;
               this.arreglo1.push({ intgrupo: transacio1.intgrupo, codcue: transacio1.codcue, nomcue: registroActual.nomcue, nivel: registroActual.idnivel.nivcue, valor: this.valor });
            } else {
               this.valor = transacio1.debito - transacio1.credito;
               this.tb6 -= this.valor;
               this.arreglo1.push({ intgrupo: transacio1.intgrupo, codcue: transacio1.codcue, nomcue: registroActual.nomcue, nivel: registroActual.idnivel.nivcue, valor: this.valor });
            }

            this.totalGrupo();

            const nivel = registroActual.idnivel.idnivel;

            for (let j = nivel - 1; j > 0; j--) {
               let nivelActual = this._niveles.find((r: { idnivel: any; }) => r.idnivel === j);
               this.codcue_par = this.codcue.substring(0, nivelActual.nivcue);
               let registroCta = this.arreglo2.find((r: { codcue: any; }) => r.codcue === this.codcue_par);
               if (registroCta != undefined) {
                  let registroTran = this.arreglo1.find((r: { codcue: any; }) => r.codcue === this.codcue_par);
                  console.log('nivel', nivel, this.codcue_par)
                  if (registroTran != undefined) {
                     if (this.codcue_par.substring(0, 2) == '62') {
                        registroTran.valor += (transacio1.credito - transacio1.debito);
                     } else {
                        registroTran.valor += (transacio1.debito - transacio1.credito);
                     }
                  }
                  else {
                     if (this.codcue_par.substring(0, 2) == '62') {
                        this.arreglo1.push({ intgrupo: transacio1.intgrupo, codcue: this.codcue_par, nomcue: registroCta.nomcue, nivel: nivelActual.nivcue, valor: (transacio1.credito - transacio1.debito) });
                     } else {
                        console.log('inicio', this.codcue, this.valor)
                        this.arreglo1.push({ intgrupo: transacio1.intgrupo, codcue: this.codcue_par, nomcue: registroCta.nomcue, nivel: nivelActual.nivcue, valor: (transacio1.debito - transacio1.credito) });
                     }
                  }
               }
            }
         } else {
            console.log('ctas no existe', this.codcue);
         };
      }; // fin for transacciones

      this.arreglo1.sort((a, b) => (a.intgrupo - b.intgrupo) || (a.codcue.localeCompare(b.codcue)));
      console.log('arreg1', this.arreglo1);
      this.arreglo3 = this.arreglo1.filter((data) => (data.nivel <= this.formBuscar.value.numnivel && data.valor != 0));

      this.totalizar();

   }

   totalTransa(): Promise<any> {
      return new Promise((resolve, reject) => {
         this.transaciService.getEstados(this.intgrupo, this.formBuscar.value.desdeFecha, this.formBuscar.value.hastaFecha).subscribe({
            next: datos => {
               // Resolvemos la promesa con el valor de datos
               resolve(datos);
               //       console.log('total:', this.intgrupo, datos);
            },
            error: err => {
               // Rechazamos la promesa con el error
               reject(err);
            }
         });
      });
   }

   totalGrupo() {
      switch (this.intgrupo) {
         case 6621: {
            if (this.codcue.substring(0, 2) == '62') {
               this.tb1 += this.valor;
            } else {
               this.tb1 -= this.valor;
            }
            break;
         }
         case 6622: {
            if (this.codcue.substring(0, 2) == '62') {
               this.tb2 += this.valor;
            } else {
               this.tb2 -= this.valor;
            }
            break;
         }
         case 6623: {
            if (this.codcue.substring(0, 2) == '62') {
               this.tb3 += this.valor;
            } else {
               this.tb3 -= this.valor;
            }
            break;
         }
         case 6624: {
            if (this.codcue.substring(0, 2) == '62') {
               this.tb4 += this.valor;
            } else {
               this.tb4 += -this.valor;
            }
            break;
         }
         case 6625: {
            if (this.codcue.substring(0, 2) == '62') {
               this.tb5 += this.valor;
            } else {
               this.tb5 -= this.valor;
            }
            break;
         }
         default: {
            break;
         }
      }


   }

   totalizar() {
      var datos: any = [];
      var k = 0;
      var sw1 = 0;
      var sw2 = 0;
      var sw3 = 0;
      var sw4 = 0;
      var sw5 = 0;

      this.arreglo3.forEach(() => {
         if (this.arreglo3[k].intgrupo === 6621 && sw1 === 0) {
            datos.push(['', 'RESULTADO DE EXPLOTACIÓN ', this.tb1]);
            sw1 = 1;
         }
         if (this.arreglo3[k].intgrupo === 6622 && sw2 === 0) {
            datos.push(['', 'RESULTADO DE OPERACIÓN ', this.tb2]);
            sw2 = 1;
         }
         if (this.arreglo3[k].intgrupo === 6623 && sw3 === 0) {
            datos.push(['', 'TRANSFERENCIAS NETAS', this.tb3]);
            sw3 = 1;
         }
         if (this.arreglo3[k].intgrupo === 6624 && sw4 === 0) {
            datos.push(['', 'RESULTADO FINANCIERO', this.tb4]);
            sw4 = 1;
         }
         if (this.arreglo3[k].intgrupo === 6625 && sw5 === 0) {
            datos.push(['', 'OTROS INGRESOS Y GASTOS', this.tb5]);
            sw5 = 1;
         }

         datos.push([this.arreglo3[k].codcue, this.arreglo3[k].nomcue, this.arreglo3[k].valor]);

         k++;
      });
      this.arreglo3 = datos;
   }


   onCellClick(event: any, cuentas: Cuentas) {
      const tagName = event.target.tagName;
      if (tagName === 'TD') {
         //    this.datosBuscar();
         sessionStorage.setItem('codcueToTransaci', cuentas.codcue.toString());
         //  this.router.navigate(['transaci']);
      }
   }

   exportar() {
      this.exporta();
   };

   pdf() {
      const nombreEmision = new NombreAuxiliarPipe(); // Crea una instancia del pipe
      let m_izquierda = 20;
      var doc = new jsPDF({});
      doc.setFont("times", "bold"); doc.setFontSize(16); doc.text("EpmapaT", m_izquierda, 10);
      doc.setFont("times", "bold"); doc.setFontSize(12); doc.text("ESTADO DE RESULTADOS", m_izquierda, 16);
      doc.setFont("times", "bold"); doc.setFontSize(10); doc.text("Del " + this.formBuscar.value.desdeFecha + " Al " +
         this.formBuscar.value.hastaFecha, m_izquierda, 24);
      var datosp: any[] = [];
      const datos = this.arreglo3;
      datosp = datos;
      if (!this.swfiltro) {
         if (this.tb6 >= 0) {
            datosp.push(['', 'UTILIDAD DEL EJERCICIO:', this.tb6]);
         } else {
            datosp.push(['', 'PERDIDA DEL EJERCICIO:', this.tb6]);
         }
         this.swfiltro = true;
      }
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
         body: datosp,

         didParseCell: function (data) {
            if (typeof data.cell.raw === 'number') {
               const formattedNumber = data.cell.raw.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
               });
               data.cell.text = [formattedNumber];
            };
            if (data.cell.raw == 0) { data.cell.text = ['']; }
            if (data.row.index === datosp.length - 1) { data.cell.styles.fontStyle = 'bold'; } // Total Bold
         }
      });

      addPageNumbers();
      var opciones = {
         filename: 'est_resultados.pdf',
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

   // Excel Estado de Resultados
   exporta() {
      const nombreEmision = new NombreAuxiliarPipe(); // Crea una instancia del pipe
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('EstadoResultados');
      worksheet.addRow(['EpmapaT', 'ESTADO DE RESULTADOS']);
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
      this.arreglo3.forEach((datos) => {
         const row = [datos[0], datos[1], datos[2]]
         worksheet.addRow(row);
      });

      //Coloca la fila del Total
      if (this.tb6 >= 0) {
         worksheet.addRow(['', 'UTILIDAD DEL EJERCICIO:', this.tb6]);
      } else {
         worksheet.addRow(['', 'PERDIDA DEL EJERCICIO:', this.tb6]);
      }
      worksheet.getCell('A' + (this.arreglo3.length + 9).toString()).font = { bold: true }
      let celdaB = worksheet.getCell('B' + (this.arreglo3.length + 9).toString());
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
      for (let i = 5; i <= this.arreglo3.length + 4; i++) {
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
