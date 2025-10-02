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
   selector: 'app-est-financiera',
   templateUrl: './est-financiera.component.html',
   styleUrls: ['./est-financiera.component.css']
})

export class EstFinancieraComponent implements OnInit {

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
   codcue_par: String;
   codcue: String;
   debcre: number;
   valor: number;

   intgrupo: number = 0;
   desdeFecha: String;
   hastaFecha: String;
   otraPagina: boolean = false;
   archExportar: string;
   grupo: String;
   tb1: number;
   tb2: number;
   tb3: number;
   tb11: number;
   tb12: number;
   tb21: number;
   tb22: number;
   tb31: number;
   tb121: number;
   tb122: number;
   tb123: number;
   tb124: number;
   tb125: number;
   tb221: number;
   tb222: number;
   tb223: number;

   constructor(private fb: FormBuilder, private router: Router, private cuentasService: CuentasService,
      public authService: AutorizaService, private coloresService: ColoresService,
      private transaciService: TransaciService, private nivelesService: NivelesService,) { }

   ngOnInit(): void {
      sessionStorage.setItem('ventana', '/estsituacion');
      let coloresJSON = sessionStorage.getItem('/estsituacion');
      if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));
      else this.buscaColor();

      const fecha = new Date();
      const año = fecha.getFullYear()
      this.formBuscar = this.fb.group({
         numnivel: 9,
         desdeFecha: año + '-01-01',
         hastaFecha: año + '-01-31',
      });

      this.archExportar = 'EstadoSituacion';

      // let buscaDesdeFecha = sessionStorage.getItem("buscaDesdeFecha");
      // let buscaHastaFecha = sessionStorage.getItem("buscaHastaFecha");
      // this.formBuscar.patchValue({
      //    desdeFecha: buscaDesdeFecha,
      //    hastaFecha: buscaHastaFecha
      // });
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
         const datos = await this.coloresService.setcolor(this.authService.idusuario, 'estsituacion');
         const coloresJSON = JSON.stringify(datos);
         sessionStorage.setItem('/estsituacion', coloresJSON);
         this.colocaColor(datos);
      } catch (error) { console.error(error); }
   }

   buscar() {
      // console.log('Está en buscar()');
      sessionStorage.setItem('buscaDesdeFecha', this.formBuscar?.controls['desdeFecha'].value.toString());
      sessionStorage.setItem('buscaHastaFecha', this.formBuscar?.controls['hastaFecha'].value.toString());
      this.cuentasService.getListaCuentas().subscribe({
         next: resp => {
            this._cuentas = resp.filter(data =>
               (data.codcue.startsWith('1') || data.codcue.startsWith('2') || data.codcue.startsWith('3') || data.codcue.startsWith('9')) &&
               data.intgrupo != null);
            this.arreglo2 = this._cuentas;
            this.arreglo2.sort((a, b) => (a.intgrupo - b.intgrupo) || (a.codcue.localeCompare(b.codcue)));
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

   async situacion_financiera() {
      // console.log('Está en situacion_financiera()');
      this.tb1 = 0;
      this.tb2 = 0;
      this.tb3 = 0;
      this.tb11 = 0;
      this.tb12 = 0;
      this.tb21 = 0;
      this.tb22 = 0;
      this.tb31 = 0;
      this.tb121 = 0;
      this.tb122 = 0;
      this.tb123 = 0;
      this.tb124 = 0;
      this.tb125 = 0;
      this.tb221 = 0;
      this.tb222 = 0;
      this.tb223 = 0;
      this.valor = 0;
      this.arreglo1 = [];
      this.arreglo3 = [];
      let grupos: number[] = [111, 121, 122, 123, 124, 125, 211, 221, 222, 223];
      let transacciones: any[] = [];

      for (let i = 0; i < grupos.length; i++) {
         this.intgrupo = grupos[i];
         this._est = await this.totalTransa();
         transacciones = transacciones.concat(this._est);
      }

      //   console.log('estados1', this._est, transacciones);
      for (const transacio1 of transacciones) {
         this.codcue = transacio1.codcue;
         let registroActual = this.arreglo2.find((r: { codcue: any; }) => r.codcue === this.codcue);
         if (registroActual != undefined) {
            this.intgrupo = transacio1.intgrupo;
            if (transacio1.intgrupo.toString().substring(0, 1) == '1') {
               this.valor = transacio1.debito - transacio1.credito
               this.arreglo1.push({ intgrupo: transacio1.intgrupo, codcue: transacio1.codcue, nomcue: registroActual.nomcue, nivel: registroActual.idnivel.nivcue, valor: this.valor });
            } else {
               this.valor = transacio1.credito - transacio1.debito
               this.arreglo1.push({ intgrupo: transacio1.intgrupo, codcue: transacio1.codcue, nomcue: registroActual.nomcue, nivel: registroActual.idnivel.nivcue, valor: this.valor });
            }

            this.totalGrupo();

            const nivel = registroActual.idnivel.idnivel;
            for (let j = nivel - 1; j > 0; j--) {
               let nivelActual = this._niveles.find((r: { idnivel: any; }) => r.idnivel === j);
               this.codcue_par = this.codcue.substring(0, nivelActual.nivcue);
               let registroActual = this.arreglo2.find((r: { codcue: any; }) => r.codcue === this.codcue_par);
               if (registroActual != undefined) {
                  let registroTran = this.arreglo1.find((r: { codcue: any; }) => r.codcue === this.codcue_par);

                  if (registroTran != undefined) {
                     if (transacio1.intgrupo.toString().substring(0, 1) == '1') {
                        registroTran.valor += (transacio1.debito - transacio1.credito);
                     } else {
                        registroTran.valor += (transacio1.credito - transacio1.debito);
                     }
                  }
                  else {
                     if (transacio1.intgrupo.toString().substring(0, 1) == '1') {
                        this.arreglo1.push({ intgrupo: transacio1.intgrupo, codcue: this.codcue_par, nomcue: registroActual.nomcue, nivel: nivelActual.nivcue, valor: this.valor });
                     } else {
                        this.arreglo1.push({ intgrupo: transacio1.intgrupo, codcue: this.codcue_par, nomcue: registroActual.nomcue, nivel: nivelActual.nivcue, valor: this.valor });
                     }
                  }
               }
            }
         } else {
            console.log('ctas no existe', this.codcue);
         };
      }; // fin for transacciones

      this.arreglo1.sort((a, b) => (a.intgrupo - b.intgrupo) || (a.codcue.localeCompare(b.codcue)));
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
      switch (this.intgrupo.toString().substring(0, 1)) {
         case '1': {
            this.tb1 += this.valor;
            break;
         }
         case '2': {
            this.tb2 += this.valor;
            break;
         }
         case '3': {
            this.tb3 += this.valor;
            break;
         }
         default: {
            break;
         }
      }

      switch (this.intgrupo.toString().substring(0, 2)) {
         case '11': {
            this.tb11 += this.valor;
            break;
         }
         case '12': {
            this.tb12 += this.valor;
            break;
         }
         case '21': {
            this.tb21 += this.valor;
            break;
         }
         case '22': {
            this.tb22 += this.valor;
            break;
         }
         case '31': {
            this.tb31 += this.valor;
            break;
         }
         default: {
            break;
         }
      }

      switch (this.intgrupo.toString().substring(0, 3)) {
         case '121': {
            this.tb121 += this.valor;
            break;
         }
         case '122': {
            this.tb122 += this.valor;
            break;
         }
         case '123': {
            this.tb123 += this.valor;
            break;
         }
         case '124': {
            this.tb124 += this.valor;
            break;
         }
         case '125': {
            this.tb125 += this.valor;
            break;
         }
         case '221': {
            this.tb221 += this.valor;
            break;
         }
         case '222': {
            this.tb222 += this.valor;
            break;
         }
         case '223': {
            this.tb223 += this.valor;
            break;
         }
         default: {
            break;
         }
      }
   }


   totalizar() {
      let datos: any = [];
      let k = 0;
      let sw1 = 0;
      let sw2 = 0;
      let sw3 = 0;
      let sw4 = 0;
      let sw5 = 0;
      let sw6 = 0;
      let sw7 = 0;
      let sw8 = 0;
      let sw9 = 0;
      let sw10 = 0;
      let sw11 = 0;
      let sw12 = 0;
      let sw13 = 0;
      let sw14 = 0;
      let sw15 = 0;
      let sw16 = 0;

      this.arreglo3.forEach(() => {
         if (this.arreglo3[k].intgrupo.toString().substring(0, 1) == '1' && sw1 === 0) {
            datos.push(['', 'ACTIVO', this.tb1]);
            sw1 = 1;
         }

         if (this.arreglo3[k].intgrupo.toString().substring(0, 1) == '2' && sw2 === 0) {
            datos.push(['', 'PASIVO ', this.tb2]);
            sw2 = 1;
         }
         if (this.arreglo3[k].intgrupo.toString().substring(0, 1) == '3' && sw3 === 0) {
            datos.push(['', 'PATRIMONIO', this.tb3]);
            sw3 = 1;
         }

         if (this.arreglo3[k].intgrupo.toString().substring(0, 2) == '11' && sw4 === 0) {
            datos.push(['', 'CORRIENTE', this.tb11]);
            sw4 = 1;
         }
         if (this.arreglo3[k].intgrupo.toString().substring(0, 2) == '12' && sw5 === 0) {
            datos.push(['', 'NO CORRIENTE', this.tb12]);
            sw5 = 1;
         }
         if (this.arreglo3[k].intgrupo.toString().substring(0, 2) == '21' && sw6 === 0) {
            datos.push(['', 'CORRIENTE', this.tb21]);
            sw6 = 1;
         }
         if (this.arreglo3[k].intgrupo.toString().substring(0, 2) == '22' && sw7 === 0) {
            datos.push(['', 'NO CORRIENTE', this.tb22]);
            sw7 = 1;
         }
         if (this.arreglo3[k].intgrupo.toString().substring(0, 2) == '31' && sw8 === 0) {
            datos.push(['', 'PATRIMONIO ACUMULADO', this.tb31]);
            sw8 = 1;
         }

         if (this.arreglo3[k].intgrupo.toString().substring(0, 3) == '121' && sw9 === 0) {
            datos.push(['', 'INVERSIONES', this.tb121]);
            sw9 = 1;
         }
         if (this.arreglo3[k].intgrupo.toString().substring(0, 3) == '122' && sw10 === 0) {
            datos.push(['', 'DEUDORES FINANCIEROS', this.tb122]);
            sw10 = 1;
         }
         if (this.arreglo3[k].intgrupo.toString().substring(0, 3) == '123' && sw11 === 0) {
            datos.push(['', 'OTROS ACTIVOS FINANCIEROS', this.tb123]);
            sw11 = 1;
         }
         if (this.arreglo3[k].intgrupo.toString().substring(0, 3) == '124' && sw12 === 0) {
            datos.push(['', 'INVERSIONES EN BIENES DE LARGA DURACIÓN', this.tb124]);
            sw12 = 1;
         }
         if (this.arreglo3[k].intgrupo.toString().substring(0, 3) == '125' && sw13 === 0) {
            datos.push(['', 'INVERSIONES EN PROYECTOS Y PROGRAMAS', this.tb125]);
            sw13 = 1;
         }
         if (this.arreglo3[k].intgrupo.toString().substring(0, 3) == '221' && sw14 === 0) {
            datos.push(['', 'ENDEUDAMIENTO', this.tb221]);
            sw14 = 1;
         }
         if (this.arreglo3[k].intgrupo.toString().substring(0, 3) == '222' && sw15 === 0) {
            datos.push(['', 'FINANCIEROS', this.tb222]);
            sw15 = 1;
         }
         if (this.arreglo3[k].intgrupo.toString().substring(0, 3) == '223' && sw16 === 0) {
            datos.push(['', 'PROVISIONES', this.tb223]);
            sw16 = 1;
         }
         datos.push([this.arreglo3[k].codcue, this.arreglo3[k].nomcue, this.arreglo3[k].valor]);
         k++;
      });
      this.arreglo3 = datos;
      //   console.log('arr3',this.arreglo3);
   }

   exportar() {
      this.exporta();
   };

   pdf() {
      const nombreEmision = new NombreAuxiliarPipe(); // Crea una instancia del pipe
      let m_izquierda = 20;
      var doc = new jsPDF({});
      doc.setFont("times", "bold"); doc.setFontSize(16); doc.text("EpmapaT", m_izquierda, 10);
      doc.setFont("times", "bold"); doc.setFontSize(12); doc.text("ESTADO DE SITUACIÓN FINANCIERA", m_izquierda, 16);
      doc.setFont("times", "bold"); doc.setFontSize(10); doc.text("Del " + this.formBuscar.value.desdeFecha + " Al " +
         this.formBuscar.value.hastaFecha, m_izquierda, 24);
      var datos: any = [];
      datos = this.arreglo3;

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
         filename: 'est_financiera.pdf',
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

   // Excel ESTADO DE SITUACIÓN FINANCIERA
   exporta() {
      const nombreEmision = new NombreAuxiliarPipe(); // Crea una instancia del pipe
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('EstadoSitFinanciera');
      worksheet.addRow(['EpmapaT', 'ESTADO DE SITUACIÓN FINANCIERA']);
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
