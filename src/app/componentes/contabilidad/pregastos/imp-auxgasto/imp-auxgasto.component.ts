import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AsientosService } from 'src/app/servicios/contabilidad/asientos.service';
import { EjecucionService } from 'src/app/servicios/contabilidad/ejecucio.service';
import { ReformasService } from 'src/app/servicios/contabilidad/reformas.service';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as ExcelJS from 'exceljs';
import { TramipresuService } from 'src/app/servicios/contabilidad/tramipresu.service';

@Component({
   selector: 'app-imp-auxgasto',
   templateUrl: './imp-auxgasto.component.html',
   styleUrls: ['./imp-auxgasto.component.css']
})
export class ImpAuxgastoComponent implements OnInit {

   swimprimir: boolean = true;
   formPargas: FormGroup;
   formImprimir: FormGroup;
   opcreporte: number = 1;
   otrapagina: boolean = false;
   swbotones: boolean = false;
   swcalculando: boolean = false;
   txtcalculando = 'Calculando';
   _ejecucion: any;
   inicia: number;
   numreg = 0; acumRefo = 0;
   acumPrmiso = 0; acumDevenga = 0; acumPagado = 0;
   salPrmiso = 0; salDevengado = 0; salPagado = 0;
   pdfgenerado: string;
   nombrearchivo: string;
   totalDeve: number;
   totalCobp: number;

   constructor(public fb: FormBuilder, private router: Router,
      private ejecuService: EjecucionService, private tramiService: TramipresuService, private asieService: AsientosService,
      private refoService: ReformasService) { }

   ngOnInit(): void {
      sessionStorage.setItem('ventana', '/pregastos');
      let coloresJSON = sessionStorage.getItem('/pregastos');
      if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));

      this.formPargas = this.fb.group({
         codpar: '',
         nompar: ''
      });

      const pargasJSON = sessionStorage.getItem('pargasToImpExp');
      if (pargasJSON) {
         const pargas = JSON.parse(pargasJSON);
         this.inicia = pargas.inicia;
         this.formPargas.patchValue({
            codpar: pargas.codpar,
            nompar: pargas.nompar
         });

         this.formImprimir = this.fb.group({
            reporte: '1',
            desde: pargas.desde,
            hasta: pargas.hasta,
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

   //Recupera los datos de cada reporte
   async imprimir() {
      this.swbotones = true;
      this.swcalculando = true;
      let fecha = this.formImprimir.value.fecha;
      switch (this.opcreporte) {
         case 1:  // Auxiliar presupuestario de Gasto
            this.pdfgenerado = 'partida_' + this.formPargas.value.codcue;
            try {
               this._ejecucion = await this.ejecuService.getCodparFechaAsync(this.formPargas.value.codpar, this.formImprimir.value.desde, this.formImprimir.value.hasta);
               this.totalesAuxgas();
               this.swcalculando = false;
               if (this.swimprimir) this.txtcalculando = 'Mostrar'
               else this.txtcalculando = 'Descargar'
            } catch (error) {
               console.error('Error al obtener la ejecución:', error);
            }
            break;
         case 2:  //Cuentas asociadas a la partida
         // try {
         //    this._ejecucion = await this.facService.getByFechacobroTotAsync(fecha);
         //    // this.sw1 = true;
         //    this.swcalculando = false;
         //    if(this.swimprimir) this.txtcalculando = 'Mostrar'
         //    else this.txtcalculando = 'Descargar'
         // } catch (error) {
         //    console.error('Error al obtener las Planillas:', error);
         // }
         // break;
         case 3:  //Datos de la partida de ingresos
            // this.cajService.getListaCaja().subscribe({
            //    next: datos => {
            //       this._cajas = datos;
            //       this.swcalculando = false;
            //       if(this.swimprimir) this.txtcalculando = 'Mostrar'
            //       else this.txtcalculando = 'Descargar'
            //    },
            //    error: err => console.error(err.error)
            // });
            break;
         default:
      }
   }

   totalesAuxgas() {
      this.numreg = 0; this.acumRefo = 0; this.acumPrmiso = 0; this.acumDevenga = 0; this.acumPagado = 0;
      let i = 0;
      this._ejecucion.forEach((objEjecu: { compro: String }) => {
         this.numreg++
         this.acumRefo = this.acumRefo + this._ejecucion[i].modifi;
         this.acumPrmiso = this.acumPrmiso + this._ejecucion[i].prmiso;
         this.acumDevenga = this.acumDevenga + this._ejecucion[i].devengado;
         this.acumPagado = this.acumPagado + this._ejecucion[i].cobpagado;
         this._ejecucion[i].codificado = this._ejecucion[i].intpre.inicia + this.acumRefo;
         this._ejecucion[i].saldo_compromiso = this._ejecucion[i].codificado - this.acumPrmiso;
         this._ejecucion[i].saldo_devengado = this._ejecucion[i].codificado - this.acumDevenga;
         this._ejecucion[i].saldo_cobpagado = this._ejecucion[i].codificado - this.acumPagado;
         if (this._ejecucion[i].tipeje == 3 || this._ejecucion[i].tipeje == 5) {
            if (this._ejecucion[i].idtrami > 0) this.busca_tramite(objEjecu);
            if (this._ejecucion[i].idasiento > 0) this.busca_asiento(objEjecu);
         }
         else { if (this._ejecucion[i].tipeje == 2) this.buscar_reforma(objEjecu) }
         i++
      });
   }

   busca_tramite(objEjecu: any) {
      this.tramiService.findById(objEjecu.idtrami).subscribe({
         next: resp => objEjecu.compro = "TR-" + resp.numero,
         error: err => console.error('Al buscar el Trámite: ', err.error)
      })
   }

   busca_asiento(objEjecu: any) {
      let tc: String; // Tipo de comprobante
      this.asieService.getById(objEjecu.idasiento).subscribe({
         next: resp => {
            objEjecu.asiento = resp.asiento;
            switch (resp.tipcom) {
               case 1: tc = 'I'; break;
               case 2: tc = 'E'; break;
               case 3: tc = 'DC'; break;
               case 4: tc = 'DI'; break;
               case 5: tc = 'DE'; break;
               default: tc = ''; break;
            };
            objEjecu.compro = tc + "-" + resp.compro;
         },
         error: err => console.error('Al buscar el asiento: ', err.error)
      });
   }

   buscar_reforma(objEjecu: any) {
      this.refoService.getById(objEjecu.idrefo).subscribe({
         next: resp => objEjecu.compro = "RE" + "-" + resp.numero,
         error: err => console.error('Al buscar la Reforma: ', err.error)
      });
   }

   //Muestra cada reporte
   imprime() {
      this.swbotones = false; this.swcalculando = false; this.txtcalculando = 'Calculando'
      switch (this.opcreporte) {
         case 1:  // Recaudacion diaria - Resumen
            if (this.swimprimir) this.imprimeAuxgas();
            else this.exportaAuxgas();
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

   imprimeAuxgas() {
      this.otrapagina = this.formImprimir.value.otrapagina;
      const doc = new jsPDF('l', 'mm', 'a4', true);
      let m_izquierda = 6;
      doc.setFont("times", "bold"); doc.setFontSize(16); doc.text("EpmapaT", m_izquierda, 10);
      doc.setFont("times", "bold"); doc.setFontSize(12); doc.text("Auxiliar Presupuestario de Gasto: " + this.formPargas.value.codpar + '  ' + this.formPargas.value.nompar, m_izquierda, 16);
      doc.setFont("times", "bold"); doc.setFontSize(11); doc.text("Del " + this.formImprimir.value.desde + ' al ' + this.formImprimir.value.hasta, m_izquierda, 22);

      const datos: any = [];
      let i = 0;
      this._ejecucion.forEach(() => {
         datos.push([this._ejecucion[i].fecha_eje, this._ejecucion[i].asiento, this._ejecucion[i].compro, formatNumber(this._ejecucion[i].modifi),
         formatNumber(this._ejecucion[i].codificado), formatNumber(this._ejecucion[i].prmiso), formatNumber(this._ejecucion[i].devengado),
         formatNumber(this._ejecucion[i].cobpagado), formatNumber(this._ejecucion[i].saldo_compromiso), formatNumber(this._ejecucion[i].saldo_devengado),
         formatNumber(this._ejecucion[i].saldo_cobpagado), this._ejecucion[i].concep]);
         i++;
      });
      datos.push(['', '', 'TOTAL', formatNumber(this.acumRefo), '', formatNumber(this.acumPrmiso), formatNumber(this.acumDevenga), formatNumber(this.acumPagado)]);

      autoTable(doc, {
         theme: 'grid',
         margin: { left: m_izquierda - 1, top: 24, right: 4, bottom: 13 },
         headStyles: { fillColor: [68, 103, 114], fontStyle: 'bold', halign: 'center' },
         styles: { font: 'helvetica', fontSize: 8, cellPadding: 1, halign: 'center' },
         head: [['', '', '', '', '', '', '', '', 'Saldo', 'Saldo', 'Saldo', ''], ['Fecha', "Asie.", "TP/CP/RF", "Reforma", "Codificado", "Cmprmiso", "Devengado", "Pagado", "Cmprmiso", "Devengado", "Pagado", "Concepto"]],
         body: datos,

         columnStyles: {
            0: { halign: 'center', cellWidth: 18 },
            1: { halign: 'center', cellWidth: 10 },
            2: { halign: 'center', cellWidth: 17 },
            3: { halign: 'right', cellWidth: 18 },
            4: { halign: 'right', cellWidth: 18 },
            5: { halign: 'right', cellWidth: 18 },
            6: { halign: 'right', cellWidth: 18 },
            7: { halign: 'right', cellWidth: 18 },
            8: { halign: 'right', cellWidth: 18 },
            9: { halign: 'right', cellWidth: 18 },
            10: { halign: 'right', cellWidth: 18 },
            11: { halign: 'left', cellWidth: 99 },
         },

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

   regresar() { this.router.navigate(['aux-gasto']); }

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

   exportaAuxgas() {
      this.nombrearchivo = this.formImprimir.value.nombrearchivo;
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(this.nombrearchivo);
      // Fila 1
      worksheet.addRow(['Auxiliar Presupuestario de Gasto']);
      worksheet.getCell('A1').font = { name: 'Times New Roman', bold: true, size: 14, color: { argb: '002060' } };
      // Fila 2
      worksheet.addRow(['Partida:  ' + this.formPargas.value.codpar + '  ' + this.formPargas.value.nompar]);
      worksheet.getCell('A2').font = { name: 'Times New Roman', bold: true, size: 12, color: { argb: '002060' } };
      // Fila 3
      worksheet.addRow(['Del ' + this.formImprimir.value.desde + ' al ' + this.formImprimir.value.hasta ]);
      worksheet.getCell('A3').font = { name: 'Times New Roman', bold: true, size: 10, color: { argb: '002060' } };

      //Fila 4 Cabecera 
      worksheet.addRow([,,,, 'Inicial', this.inicia,,,,, 'Saldo',]);
      worksheet.getCell('D4').font = { name: 'Times New Roman', bold: true, size: 10, color: { argb: '002060' } };
      worksheet.getCell('E4').font = { name: 'Times New Roman', bold: true, size: 10, color: { argb: '002060' } };
      worksheet.getCell('E4').numFmt = '#,##0.00';

      worksheet.getCell('I4').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '002060' } };
      worksheet.getCell('I4').font = { bold: true, name: 'Times New Roman', color: { argb: 'FFFFFF' } };

      worksheet.getCell('J4').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '002060' } };
      worksheet.getCell('J4').font = { bold: true, name: 'Times New Roman', color: { argb: 'FFFFFF' } };

      worksheet.getCell('K4').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '002060' } };
      worksheet.getCell('K4').font = { bold: true, name: 'Times New Roman', color: { argb: 'FFFFFF' } };
      //Fila 5 Cabecera 
      const headerRowCell = worksheet.addRow(['Fecha', "Asie.", "TP/CP/RF", "Reforma", "Codificado", "Compromiso", "Devengado", "Pagado", "Compromiso", "Devengado", "Pagado", "Concepto"]);
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
      this._ejecucion.forEach(() => {
         const row = [this._ejecucion[i].fecha_eje, this._ejecucion[i].asiento, this._ejecucion[i].compro, this._ejecucion[i].modifi,
         this._ejecucion[i].codificado, this._ejecucion[i].prmiso, this._ejecucion[i].devengado, this._ejecucion[i].cobpagado,
         this._ejecucion[i].saldo_compromiso, this._ejecucion[i].saldo_devengado, this._ejecucion[i].saldo_cobpagado,
         this._ejecucion[i].concep];
         worksheet.addRow(row);
         i++;
      });

      //Coloca la fila del Total
      worksheet.addRow(['TOTAL']);
      worksheet.getCell('A' + (this._ejecucion.length + 6).toString()).font = { bold: true }

      let celdaD = worksheet.getCell('D' + (this._ejecucion.length + 6).toString());
      celdaD.numFmt = '#,##0.00';
      celdaD.font = { bold: true }
      celdaD.value = { formula: 'SUM(D6:' + 'D' + (this._ejecucion.length + 5).toString() + ')', result: 0, sharedFormula: undefined, date1904: false };

      let celdaF = worksheet.getCell('F' + (this._ejecucion.length + 6).toString());
      celdaF.numFmt = '#,##0.00';
      celdaF.font = { bold: true }
      celdaF.value = { formula: 'SUM(F6:' + 'F' + (this._ejecucion.length + 5).toString() + ')', result: 0, sharedFormula: undefined, date1904: false };

      let celdaG = worksheet.getCell('G' + (this._ejecucion.length + 6).toString());
      celdaG.numFmt = '#,##0.00';
      celdaG.font = { bold: true }
      celdaG.value = { formula: 'SUM(G6:' + 'G' + (this._ejecucion.length + 5).toString() + ')', result: 0, sharedFormula: undefined, date1904: false };

      let celdaH = worksheet.getCell('H' + (this._ejecucion.length + 6).toString());
      celdaH.numFmt = '#,##0.00';
      celdaH.font = { bold: true }
      celdaH.value = { formula: 'SUM(H6:' + 'H' + (this._ejecucion.length + 5).toString() + ')', result: 0, sharedFormula: undefined, date1904: false };

      // Establece el ancho de las columnas
      const anchoConfig = [
         { columnIndex: 1, widthInChars: 12 },
         { columnIndex: 2, widthInChars: 8 },
         { columnIndex: 3, widthInChars: 12 },
         { columnIndex: 4, widthInChars: 16 },
         { columnIndex: 5, widthInChars: 16 },
         { columnIndex: 6, widthInChars: 16 },
         { columnIndex: 7, widthInChars: 16 },
         { columnIndex: 8, widthInChars: 16 },
         { columnIndex: 9, widthInChars: 16 },
         { columnIndex: 10, widthInChars: 16 },
         { columnIndex: 11, widthInChars: 16 },
         { columnIndex: 12, widthInChars: 200 },
      ];
      anchoConfig.forEach(config => {
         worksheet.getColumn(config.columnIndex).width = config.widthInChars;
      });

      // Columnas centradas 
      const columnsToCenter = [2, 3];
      columnsToCenter.forEach(columnIndex => {
         worksheet.getColumn(columnIndex).eachCell({ includeEmpty: true }, cell => {
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
         });
      });
      // Columnas a la derecha 
      let columnsToRigth = [4, 5, 6, 7, 8, 9, 10, 11];
      columnsToRigth.forEach(columnIndex => {
         worksheet.getColumn(columnIndex).eachCell({ includeEmpty: true }, cell => {
            cell.alignment = { horizontal: 'right' };
         });
      });

      // Formato numérico con decimales
      const numeroStyle1 = { numFmt: '#,##0.00' };
      const columnsToFormat1 = [4, 5, 6, 7, 8, 9, 10, 11];
      for (let i = 6; i <= this._ejecucion.length + 5; i++) {
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