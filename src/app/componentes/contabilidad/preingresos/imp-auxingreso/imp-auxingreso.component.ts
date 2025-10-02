import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CuentasService } from 'src/app/servicios/contabilidad/cuentas.service';
import { EjecucionService } from 'src/app/servicios/contabilidad/ejecucio.service';
import { ReformasService } from 'src/app/servicios/contabilidad/reformas.service';
import { AsientosService } from 'src/app/servicios/contabilidad/asientos.service';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as ExcelJS from 'exceljs';

@Component({
   selector: 'app-imp-auxingreso',
   templateUrl: './imp-auxingreso.component.html',
   styleUrls: ['./imp-auxingreso.component.css']
})

export class ImpAuxingresoComponent implements OnInit {

   swimprimir: boolean = true;
   formParing: FormGroup;
   formImprimir: FormGroup;
   opcreporte: number = 1;
   otrapagina: boolean = false;
   swbotones: boolean = false;
   swcalculando: boolean = false;
   txtcalculando = 'Calculando';
   pdfgenerado: string;
   nombrearchivo: string;
   _ejecucion: any;
   anterior: number;
   sumModifi: number;
   sumDevenga: number;
   sumCobp: number;
   // filas: number;

   constructor(public fb: FormBuilder, private router: Router,
      private ejecuService: EjecucionService, private cueService: CuentasService,
      private reformaService: ReformasService, private asientoService: AsientosService) { }

   ngOnInit(): void {
      sessionStorage.setItem('ventana', '/preingresos');
      let coloresJSON = sessionStorage.getItem('/preingresos');
      if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));

      this.formParing = this.fb.group({
         codpar: '',
         nompar: ''
      });

      const paringJSON = sessionStorage.getItem('paringToImpExp');
      if (paringJSON) {
         const paring = JSON.parse(paringJSON);
         this.cueService.getNombre(paring.codcue).subscribe({
            next: nomcue => {
               this.formParing.patchValue({
                  codpar: paring.codpar,
                  nompar: paring.nompar
               });
            },
            error: err => console.error('Al buscar la partida de ingresos: ', err.error)
         });

         this.formImprimir = this.fb.group({
            reporte: '1',
            desde: paring.desde,
            hasta: paring.hasta,
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
         case 1:  // Auxiliar presupuestario de ingreso
            this.pdfgenerado = 'partida_' + this.formParing.value.codcue;
            try {
               this._ejecucion = await this.ejecuService.getCodparFechaAsync(this.formParing.value.codpar, this.formImprimir.value.desde, this.formImprimir.value.hasta);
               this.totalesAuxing();
               this.swcalculando = false;
               if (this.swimprimir) this.txtcalculando = 'Mostrar'
               else this.txtcalculando = 'Descargar'
            } catch (error) {
               console.error('Error al obtener las transacciones de la cuenta:', error);
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

   totalesAuxing() {
      let i = 0;
      this.sumModifi = 0; this.sumDevenga = 0; this.sumCobp = 0;
      this._ejecucion.forEach((ejecu: { tipeje: number; devengado: number; cobpagado: number; modifi: number, codificado: number, saldo_devengado: number, saldo_cobpagado: number }) => {
         ejecu.codificado = this._ejecucion[i].intpre.inicia;
         ejecu.codificado = ejecu.codificado + ejecu.modifi;
         this.sumModifi = this.sumModifi + ejecu.modifi;
         this.sumDevenga = this.sumDevenga + ejecu.devengado;
         ejecu.saldo_devengado = ejecu.codificado - this.sumDevenga;
         this.sumCobp = this.sumCobp + ejecu.cobpagado;
         ejecu.saldo_cobpagado = ejecu.codificado - this.sumCobp;
         if (ejecu.tipeje == 3 || ejecu.tipeje == 4) {
            this.buscar_asiento(ejecu);
         } else {
            if (ejecu.tipeje == 2) {
               this.buscar_reforma(ejecu);
            }
         };
         i++;
      });
   }

   buscar_asiento(ejecucion: any) {
      let tc: String; // Tipo de comprobante
      this.asientoService.getById(ejecucion.idasiento).subscribe({
         next: resp => {
            ejecucion.asiento = resp.asiento;
            switch (resp.tipcom) {
               case 1: tc = 'I'; break;
               case 2: tc = 'E'; break;
               case 3: tc = 'DC'; break;
               case 4: tc = 'DI'; break;
               case 5: tc = 'DE'; break;
               default: tc = ''; break;
            };
            ejecucion.compro = tc + "-" + resp.compro;
         },
         error: err => console.error(err.error)
      });
   }

   //Muestra cada reporte
   imprime() {
      this.swbotones = false; this.swcalculando = false; this.txtcalculando = 'Calculando'
      switch (this.opcreporte) {
         case 1:  // Recaudacion diaria - Resumen
            if (this.swimprimir) this.imprimeAuxing();
            else this.exportaAuxing();
            break;
         case 2:  //Cuentas asociadas
         // if (this.swimprimir) this.imprimirFacturas();
         // else this.exportarFacturas();
         // break;
         case 3:  //Datos de la partida
         // if (this.swimprimir) this.imprimirCajas();
         // else this.exportarCajas();
         // break;
         default:
      }
   }

   comprobante(tipcom: number, compro: number): string {
      if (tipcom == 1) return 'I-' + compro.toString();
      if (tipcom == 2) return 'E-' + compro.toString();
      if (tipcom == 3) return 'DC-' + compro.toString();
      if (tipcom == 4) return 'DI-' + compro.toString();
      if (tipcom == 5) return 'DE-' + compro.toString();
      return '?' + compro.toString();
   }

   imprimeAuxing() {
      this.otrapagina = this.formImprimir.value.otrapagina;
      const doc = new jsPDF('l', 'mm', 'a4', true);
      let m_izquierda = 10;
      doc.setFont("times", "bold"); doc.setFontSize(16); doc.text("EpmapaT", m_izquierda, 10);
      doc.setFont("times", "bold"); doc.setFontSize(12); doc.text("Auxiliar Presupuestario de Ingreso: " + this.formParing.value.codpar + '  ' + this.formParing.value.nompar, m_izquierda, 16);
      doc.setFont("times", "bold"); doc.setFontSize(11); doc.text("Del " + this.formImprimir.value.desde + ' al ' + this.formImprimir.value.hasta, m_izquierda, 22);
      let cabecera = ['Fecha', "Asie.", "Comp/Refo", "Reforma", "Codificado", "Devengado", "Cobrado", "Saldo Deven", "Saldo Cobro", "Concepto"];

      const datos: any = [];
      this._ejecucion.forEach((ejecu: any) => {
         datos.push([ ejecu.fecha_eje, ejecu.asiento, ejecu.compro, formatNumber( ejecu.modifi ),
         formatNumber( ejecu.codificado ), formatNumber( ejecu.devengado ), formatNumber( ejecu.cobpagado ),
         formatNumber( ejecu.saldo_devengado ), formatNumber( ejecu.saldo_cobpagado ), ejecu.concep]);
      });

      if (this._ejecucion.length > 0) datos.push(['TOTAL: '+this._ejecucion.length, , , formatNumber(this.sumModifi), , formatNumber(this.sumDevenga), formatNumber(this.sumCobp)]);
      
      const filaEnNegrita = this._ejecucion.length;
      autoTable(doc, {
         theme: 'grid',
         margin: { left: m_izquierda - 1, top: 24, right: 6, bottom: 13 },
         headStyles: { fillColor: [68, 103, 114], fontStyle: 'bold', halign: 'center' },
         styles: { font: 'helvetica', fontSize: 8, cellPadding: 1, halign: 'center' },
         head: [cabecera],
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
            9: { halign: 'left', cellWidth: 129, fontSize: 7 },
         },

         didParseCell: function (hookData) {
            if (hookData.column.index == 3 && hookData.cell.text.toString() == '(Ninguno)') { hookData.cell.text = ['']; }
            if (hookData.cell.raw == 0) { hookData.cell.text = ['']; }
            if( hookData.row.index == filaEnNegrita ) Object.values(hookData.row.cells).forEach(function (cell) { cell.styles.fontStyle = 'bold'; });
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

   buscar_reforma(ejecucion: any) {
      this.reformaService.getById(ejecucion.idrefo).subscribe({
         next: resp => ejecucion.compro = "RE" + "-" + resp.numero,
         error: err => console.error(err.error)
      })
   }

   regresar() { this.router.navigate(['aux-ingreso']); }

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

   exportaAuxing() {
      this.nombrearchivo = this.formImprimir.value.nombrearchivo;
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(this.nombrearchivo);

      const customStyle14 = { font: { name: 'Times New Roman', bold: true, size: 14, color: { argb: '002060' } } };
      const customStyle12 = { font: { name: 'Times New Roman', bold: true, size: 12, color: { argb: '002060' } } };

      // Fila 1
      worksheet.addRow(['Auxiliar presupuestario de Ingreso']);
      worksheet.getCell('A1').font = customStyle14.font;

      // Fila 2
      worksheet.addRow(['Partida: ' + this.formParing.value.codpar + ' ' + this.formParing.value.nompar]);
      worksheet.getCell('A2').font = customStyle12.font;

      // Fila 3
      worksheet.addRow(['DEL ' + this.formImprimir.value.desde + ' AL ' + this.formImprimir.value.hasta]);
      worksheet.getCell('A3').font = customStyle12.font;

      //Fila 4 Cabecera 
      const headerRowCell = worksheet.addRow(['Fecha', 'Asie', 'Comp/Refo', 'Reforma', 'Codificado', 'Devengado', 'Cobrado', 'Saldo Deven', 'Saldo Cobro', 'Descripción']);
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
         this._ejecucion[i].codificado, this._ejecucion[i].devengado, this._ejecucion[i].cobpagado,
         this._ejecucion[i].saldo_devengado, this._ejecucion[i].saldo_cobpagado, this._ejecucion[i].concep ];
         worksheet.addRow(row);
         i++;
      });

      //Coloca la fila del Total
      worksheet.addRow([ 'TOTAL']);
      worksheet.getCell('A' + (this._ejecucion.length + 5).toString()).font = { bold: true }

      let celdaD = worksheet.getCell('D' + (this._ejecucion.length + 5).toString());
      celdaD.numFmt = '#,##0.00';
      celdaD.font = { bold: true }
      celdaD.value = { formula: 'SUM(D5:' + 'D' + (this._ejecucion.length + 4).toString() + ')', result: 0, sharedFormula: undefined, date1904: false };

      let celdaF = worksheet.getCell('F' + (this._ejecucion.length + 5).toString());
      celdaF.numFmt = '#,##0.00';
      celdaF.font = { bold: true }
      celdaF.value = { formula: 'SUM(F5:' + 'F' + (this._ejecucion.length + 4).toString() + ')', result: 0, sharedFormula: undefined, date1904: false };

      let celdaG = worksheet.getCell('G' + (this._ejecucion.length + 5).toString());
      celdaG.numFmt = '#,##0.00';
      celdaG.font = { bold: true }
      celdaG.value = { formula: 'SUM(G5:' + 'G' + (this._ejecucion.length + 4).toString() + ')', result: 0, sharedFormula: undefined, date1904: false };

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
         { columnIndex: 10, widthInChars: 100 },
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
      let columnsToRigth = [4, 5, 6, 7, 8, 9];
      columnsToRigth.forEach(columnIndex => {
         worksheet.getColumn(columnIndex).eachCell({ includeEmpty: true }, cell => {
            cell.alignment = { horizontal: 'right' };
         });
      });

      // Formato numérico con decimales
      const numeroStyle1 = { numFmt: '#,##0.00' };
      const columnsToFormat1 = [4, 5, 6, 7, 8, 9];
      for (let i = 5; i <= this._ejecucion.length + 4; i++) {
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