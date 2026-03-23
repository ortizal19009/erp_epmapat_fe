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
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { ColoresService } from 'src/app/compartida/colores.service';

@Component({
   selector: 'app-comprobacion',
   templateUrl: './comprobacion.component.html',
   styleUrls: ['./comprobacion.component.css']
})

export class ComprobacionComponent implements OnInit {

   _cuentas: any;
   _transaci: any;
   _niveles: any;
   _balance: any;
   formBuscar: FormGroup;
   cuentas = {} as Cuentas; //Interface para los datos de la Cuenta
   transaci = {} as Transaci;
   swfiltro: boolean;
   filtro: string;
   disabled = false;
   swvalido = 1;
   arreglo1: any[] = [];
   arreglo2: any[] = [];
   arreglo3: any[] = [];
   date: Date = new Date();
   today: number = Date.now();
   nivel_par: String;
   codcue_par: String
   codcue: String;
   swsigef: boolean = true;

   desdeFecha: String;
   hastaFecha: String;
   otraPagina: boolean = false;
   archExportar: string;
   sumdebito: number;
   sumcredito: number;
   saldo: number;
   saldeudor: number;
   salacreedor: number;

   tb1: number;
   tb2: number;
   tb3: number;
   tb4: number;
   tb5: number;
   tb6: number;
   tb7: number;
   tb8: number;

   constructor(private fb: FormBuilder, private router: Router, private cuentasService: CuentasService,
      public authService: AutorizaService, private coloresService: ColoresService,
      private transaciService: TransaciService, private nivelesService: NivelesService) { }

   ngOnInit(): void {
      sessionStorage.setItem('ventana', '/comprobacion');
      let coloresJSON = sessionStorage.getItem('/comprobacion');
      if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));
      else this.buscaColor();

      const fecha = new Date();
      const año = fecha.getFullYear()
      this.formBuscar = this.fb.group({
         codcue: '',
         sigef: true,
         numnivel: 2,
         desdeFecha: año + '-01-01',
         hastaFecha: año + '-01-31',
      });
      this.archExportar = 'BalanceComprobacion';
      this.buscar()
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
         const datos = await this.coloresService.setcolor(this.authService.idusuario, 'comprobacion');
         const coloresJSON = JSON.stringify(datos);
         sessionStorage.setItem('/comprobacion', coloresJSON);
         this.colocaColor(datos);
      } catch (error) { console.error(error); }
   }

   buscar() {
      this.cuentasService.getListaCuentas().subscribe({
         next: resp => {
            this._cuentas = resp;
            this.arreglo2 = this._cuentas;
         },
         error: err => console.log(err.error)
      });

      this.nivelesService.getListaNiveles().subscribe({
         next: resp => {
            this._niveles = resp
         },
         error: err => console.log(err.error)
      });
   }

   changeSigef(){
      this.swsigef = this.formBuscar.value.sigef;
   }

   async balance_comprobacion() {
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

      this._balance = await this.totalTransa();
      //   console.log('transacciones acumuladas',this._balance)
      for (const transacio1 of this._balance) {
         this.codcue = transacio1.codcue;
         let registroActual = this.arreglo2.find((r: { codcue: any; }) => r.codcue === this.codcue);

         if (registroActual != undefined) {
            this.sumdebito = transacio1.deudor + transacio1.debito
            this.sumcredito = transacio1.acreedor + transacio1.credito
            this.tb1 += transacio1.deudor;
            this.tb2 += transacio1.acreedor;
            this.tb3 += transacio1.debito;
            this.tb4 += transacio1.credito;
            this.tb5 += (this.sumdebito - this.sumcredito);
            this.tb6 += (this.sumcredito - this.sumdebito);
            //  this.saldo = this.sumdebito - this.sumcredito;
            if ((this.sumdebito - this.sumcredito) > 0) {
               this.saldeudor = this.sumdebito - this.sumcredito;
               this.tb7 += (this.sumdebito - this.sumcredito);
               this.salacreedor = 0;
            } else {
               this.salacreedor = this.sumcredito - this.sumdebito;
               this.tb8 += (this.sumcredito - this.sumdebito);
               this.saldeudor = 0;
            }
            this.arreglo1.push({
               codcue: transacio1.codcue,
               nomcue: registroActual.nomcue,
               nivel: registroActual.idnivel.nivcue,
               movcue: registroActual.movcue,
               deudor: transacio1.deudor,
               acreedor: transacio1.acreedor,
               debito: transacio1.debito,
               credito: transacio1.credito,
               sumdebito: this.sumdebito,
               sumcredito: this.sumcredito,
               saldeudor: this.saldeudor,
               salacreedor: this.salacreedor
            });

            const nivel = registroActual.idnivel.idnivel;
            for (let j = nivel - 1; j > 0; j--) {
               let nivelActual = this._niveles.find((r: { idnivel: any; }) => r.idnivel === j);
               this.codcue_par = this.codcue.substring(0, nivelActual.nivcue);
               // Busca el nombre de la cta en la tabla cuentas
               let registroCta = this.arreglo2.find((r: { codcue: any; }) => r.codcue === this.codcue_par);
               if (registroCta != undefined) {
                  // Busca en array de salida si existe la cta para acumular por niveles
                  let registroTran = this.arreglo1.find((r: { codcue: any; }) => r.codcue === this.codcue_par);
                  if (registroTran != undefined) {
                     registroTran.deudor += transacio1.deudor;
                     registroTran.acreedor += transacio1.acreedor;
                     registroTran.debito += transacio1.debito;
                     registroTran.credito += transacio1.credito;
                     registroTran.sumdebito += this.sumdebito;
                     registroTran.sumcredito += this.sumcredito;

                     if ((registroTran.sumdebito - registroTran.sumcredito) > 0) {
                        registroTran.saldeudor += this.saldeudor;
                     } else {
                        registroTran.salacreedor += this.salacreedor;
                     }
                  }
                  else {
                     this.arreglo1.push({
                        codcue: this.codcue_par,
                        nomcue: registroCta.nomcue,
                        nivel: nivelActual.nivcue,
                        movcue: nivelActual.movcue,
                        deudor: transacio1.deudor,
                        acreedor: transacio1.acreedor,
                        debito: transacio1.debito,
                        credito: transacio1.credito,
                        sumdebito: this.sumdebito,
                        sumcredito: this.sumcredito,
                        saldeudor: this.saldeudor,
                        salacreedor: this.salacreedor
                     });
                  }
               } else {
                  console.log('Registrocta no existe', this.codcue_par);
               };
            }
         } else {
            console.log('ctas no existe', this.codcue);
         };
      }

      this.arreglo1.sort((a, b) => a.codcue.localeCompare(b.codcue));

      if (this.formBuscar.value.sigef) {
         this.formBuscar.value.numnivel = 4;
         this.arreglo3 = this.arreglo1.filter((data) => (data.sigef = this.formBuscar.value.sigef || data.nivel < this.formBuscar.value.numnivel)
            && (data.deudor + data.acreedor + data.debito + data.credito) > 0 && data.codcue.startsWith(this.formBuscar.value.codcue));
      } else {
         this.arreglo3 = this.arreglo1.filter((data) => (data.nivel <= this.formBuscar.value.numnivel
            && (data.deudor + data.acreedor + data.debito + data.credito) != 0 && data.codcue.startsWith(this.formBuscar.value.codcue)));
      };
   }

   totalTransa(): Promise<any> {
      return new Promise((resolve, reject) => {
         this.transaciService.getBalance(this.formBuscar.value.desdeFecha, this.formBuscar.value.hastaFecha).subscribe({
            next: datos => resolve(datos),
            error: err => reject(err)
         });
      });
   }

   exportar() { this.exporta(); };

   pdf() {
      const nombreEmision = new NombreAuxiliarPipe(); // Crea una instancia del pipe
      let m_izquierda = 20;
      var doc = new jsPDF({});
      doc.setFont("times", "bold"); doc.setFontSize(16); doc.text("EpmapaT", m_izquierda, 10);
      doc.setFont("times", "bold"); doc.setFontSize(12); doc.text("BALANCE DE COMPROBACIÓN (CUENTAS SINAFIP)", m_izquierda, 16);
      doc.setFont("times", "bold"); doc.setFontSize(10); doc.text("Del " + this.formBuscar.value.desdeFecha + " Al " +
         this.formBuscar.value.hastaFecha, m_izquierda, 24);
      var datos: any = [];

      var k = 0;
      this.arreglo3.forEach(() => {
         datos.push([this.arreglo3[k].codcue, this.arreglo3[k].nomcue, this.arreglo3[k].deudor, this.arreglo3[k].acreedor,
         this.arreglo3[k].debito, this.arreglo3[k].credito, this.arreglo3[k].sumdebito, this.arreglo3[k].sumcredito, this.arreglo3[k].saldeudor, this.arreglo3[k].salacreedor]);
         k++;
      });

      datos.push(['', 'TOTAL:', this.tb1, this.tb2, this.tb3, this.tb4, this.tb5, this.tb6, this.tb7, this.tb8]);

      const addPageNumbers = function () {
         const pageCount = doc.internal.pages.length;
         for (let i = 1; i <= pageCount - 1; i++) {
            doc.setPage(i);
            doc.setFontSize(10);
            doc.text('Página ' + i + ' de ' + (pageCount - 1), m_izquierda, doc.internal.pageSize.height - 10);
         }
      };

      autoTable(doc, {
         head: [
            [{ content: 'C U E N T A S', colSpan: 2 }, { content: 'SALDOS INICIALES', colSpan: 2 }, { content: 'F L U J O S', colSpan: 2 }, { content: 'S U M A S', colSpan: 2 }, { content: 'SALDOS FINALES', colSpan: 2 }],
            ['CÓDIGO', 'DENOMINACIÓN', 'DEUDOR', 'ACREEDOR', 'DÉBITOS', 'CRÉDITOS', 'DÉBITOS', 'CRÉDITOS', 'DEUDOR', 'ACREEDOR']],
         theme: 'grid',
         headStyles: { fillColor: [68, 103, 114], fontStyle: 'bold', halign: 'center' },
         styles: { font: 'helvetica', fontSize: 7, cellPadding: 1, halign: 'center' },
         columnStyles: {
            0: { halign: 'left' },
            1: { halign: 'left' },
            2: { halign: 'right' },
            3: { halign: 'right' },
            4: { halign: 'right' },
            5: { halign: 'right' },
            6: { halign: 'right' },
            7: { halign: 'right' },
            8: { halign: 'right' },
            9: { halign: 'right' },
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
            if (data.row.index === datos.length - 1) { data.cell.styles.fontStyle = 'bold'; } // Total Bold
         }
      });

      addPageNumbers();
      var opciones = {
         filename: 'saldos.pdf',
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

   // Excel Balance de Comprobacion
   exporta() {
      const nombreEmision = new NombreAuxiliarPipe(); // Crea una instancia del pipe
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('BalanceComprobacion');
      worksheet.addRow(['EpmapaT', '', 'BALANCE DE COMPROBACIÓN (CUENTAS SINAFIP)']);
      worksheet.addRow(['Del ' + this.formBuscar.value.desdeFecha + ' Al ' + this.formBuscar.value.hastaFecha]);
      // Formato Celda C1
      const cellC1 = worksheet.getCell('C1');
      const customStyle = { font: { name: 'Times New Roman', bold: true, size: 14, color: { argb: '002060' } } };
      cellC1.font = customStyle.font;
      worksheet.addRow([]);

      const cabecera = ['CÓDIGO', 'DENOMINACIÓN', 'DEUDOR', 'ACREEDOR', 'DÉBITOS', 'CRÉDITOS', 'DÉBITOS', 'CRÉDITOS', 'DEUDOR', 'ACREEDOR'];
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
      this.arreglo3.forEach((item: any) => {
         const row = [item.codcue, item.nomcue, item.deudor, item.acreedor, item.debito, item.credito, item.sumdebito,
         item.sumcredito, item.saldeudor, item.salacreedor];
         worksheet.addRow(row);
      });

      //Coloca la fila del Total
      worksheet.addRow(['', 'TOTAL', this.tb1, this.tb2, this.tb3, this.tb4, this.tb5, this.tb6, this.tb7, this.tb8]);
      worksheet.getCell('A' + (this.arreglo3.length + 7).toString()).font = { bold: true }
      let celdaB = worksheet.getCell('B' + (this.arreglo3.length + 7).toString());
      celdaB.numFmt = '#,##0';
      celdaB.font = { bold: true };

      // Establece el ancho de las columnas
      const anchoConfig = [
         { columnIndex: 1, widthInChars: 16 },
         { columnIndex: 2, widthInChars: 40 },
         { columnIndex: 3, widthInChars: 20 },
         { columnIndex: 4, widthInChars: 20 },
         { columnIndex: 5, widthInChars: 20 },
         { columnIndex: 6, widthInChars: 20 },
         { columnIndex: 7, widthInChars: 20 },
         { columnIndex: 8, widthInChars: 20 },
         { columnIndex: 9, widthInChars: 20 },
         { columnIndex: 10, widthInChars: 20 }
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
