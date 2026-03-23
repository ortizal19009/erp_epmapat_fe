import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { RetencionesService } from 'src/app/servicios/contabilidad/retenciones.service';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as ExcelJS from 'exceljs';

@Component({
   selector: 'app-imp-retenciones',
   templateUrl: './imp-retenciones.component.html',
   styleUrls: ['./imp-retenciones.component.css']
})
export class ImpRetencionesComponent implements OnInit {

   swimprimir: boolean = true;
   formImprimir: FormGroup;
   opcreporte: number = 1;
   otrapagina: boolean = false;
   swbotones: boolean = false;
   swcalculando: boolean = false;
   txtcalculando = 'Calculando';
   pdfgenerado: string;
   nombrearchivo: string;

   _retenciones: any;
   total: number;

   constructor(public fb: FormBuilder, private router: Router, private reteService: RetencionesService) { }

   ngOnInit(): void {
      sessionStorage.setItem('ventana', '/retenciones');
      let coloresJSON = sessionStorage.getItem('/retenciones');
      if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));

      const retenciones = JSON.parse(sessionStorage.getItem('retencionesToImpExp')!);
      //sessionStorage.removeItem( 'retencionesToImpExp' )
      this.formImprimir = this.fb.group({
         reporte: '1',
         desdeSecu: retenciones.desdeSecu,
         hastaSecu: retenciones.hastaSecu,
         desdeFecha: retenciones.desdeFecha,
         hastaFecha: retenciones.hastaFecha,
         nombrearchivo: ['', [Validators.required, Validators.minLength(3)]],
         otrapagina: ''
      });
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

   regresar() { this.router.navigate(['retenciones']); }

   async imprimir() {
      this.swbotones = true;
      this.swcalculando = true;
      let fecha = this.formImprimir.value.fecha;
      switch (this.opcreporte) {
         case 1:  //Lista de retenciones
            try {
               this._retenciones = await this.reteService.getDesdeHastaAsync(this.formImprimir.value.desdeSecu, this.formImprimir.value.hastaSecu, this.formImprimir.value.desdeFecha, this.formImprimir.value.hastaFecha);
               this.swcalculando = false;
               if (this.swimprimir) this.txtcalculando = 'Mostrar'
               else this.txtcalculando = 'Descargar'
            } catch (error) {
               console.error('Error al obtener las Retenciones:', error);
            }
            break;
         case 2:
         // try {
         //    let codpar = this.formImprimir.value.codpar;
         //    let nompar = this.formImprimir.value.nompar;
         //    this._presupuei = await this.preingService.getParingresoAsync(codpar, nompar);
         //    await this.saldos_ing();
         //    this.swcalculando = false;
         //    if (this.swimprimir) this.txtcalculando = 'Mostrar'
         //    else this.txtcalculando = 'Descargar'
         // } catch (error) {
         //    console.error('Error al obtener las partidas:', error);
         // }
         // break;

      }
   }

   //Muestra cada reporte
   imprime() {
      this.otrapagina = this.formImprimir.value.otrapagina;
      this.swbotones = false; this.swcalculando = false; this.txtcalculando = 'Calculando'
      switch (this.opcreporte) {
         case 1:  //Lista de retenciones
            if (this.swimprimir) this.imprimeRetenciones();
            else this.exportaRetenciones();
            break;
      }
   }

   imprimeRetenciones() {
      const doc = new jsPDF('l', 'mm', 'a4', true);
      let m_izquierda = 10;
      doc.setFont("times", "bold"); doc.setFontSize(16); doc.text("EpmapaT", m_izquierda, 10);
      doc.setFont("times", "normal"); doc.setFontSize(12); doc.text("RETENCIONES", m_izquierda, 16)
      doc.setFont("times", "normal"); doc.setFontSize(12); doc.text("DESDE: " + this.formImprimir.value.desdeSecu +
         " HASTA: " + this.formImprimir.value.hastaSecu + "   DEL: " + this.formImprimir.value.desdeFecha + " AL: " +
         this.formImprimir.value.hastaFecha, m_izquierda, 22)
      let cabecera = ['Nro.', 'FECHA', 'SUJETO RETENIDO', 'DOCUMENTO', 'NUMERO DE AUTORIZACIÓN', 'FECHA-AUTORIZACIÓN', 'VALOR'];

      const datos: any = [];
      let total = 0;
      this._retenciones.forEach((retencion: any) => {
         const valor = retencion.valorretbienes + retencion.valorretservicios + retencion.valretserv100 + retencion.valretair;
         datos.push([retencion.secretencion1, retencion.fechaemiret1, retencion.idbene.nomben, retencion.intdoc.nomdoc + " " + retencion.numdoc,
         retencion.numautoriza_e, retencion.fecautoriza, formatNumber(valor)]);
         total = total + valor
      });
      datos.push(['', 'TOTAL: ' + this._retenciones.length, , , , , formatNumber(total)]);

      let filaTotales = datos.length - 1

      autoTable(doc, {
         theme: 'grid',
         margin: { left: m_izquierda - 1, top: 24, right: 6, bottom: 12 },
         headStyles: { fillColor: [68, 103, 114], fontStyle: 'bold', halign: 'center' },
         styles: { font: 'helvetica', fontSize: 8, cellPadding: 1, halign: 'center' },
         head: [cabecera],
         body: datos,

         columnStyles: {
            0: { halign: 'center' },
            1: { halign: 'left' },
            2: { halign: 'left' },
            3: { halign: 'left' },
            4: { halign: 'left' },
            5: { halign: 'left' },
            6: { halign: 'right' }
         },

         didParseCell: function (data) {
            if (data.cell.raw == 0) { data.cell.text = ['']; }
            if (data.row.index === filaTotales) { data.cell.styles.fontStyle = 'bold'; } // Total Bold
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

   exportaRetenciones() {
      this.nombrearchivo = this.formImprimir.value.nombrearchivo;
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(this.nombrearchivo);

      const customStyle14 = { font: { name: 'Times New Roman', bold: true, size: 14, color: { argb: '002060' } } };
      const customStyle12 = { font: { name: 'Times New Roman', bold: true, size: 12, color: { argb: '002060' } } };

      // Fila 1
      worksheet.addRow(['RETENCIONES']);
      worksheet.getCell('A1').font = customStyle14.font;

      // Fila 2
      worksheet.addRow(['DESDE ' + this.formImprimir.value.desdeSecu + ' HASTA ' + this.formImprimir.value.hastaSecu, , ,
      'DEL ' + this.formImprimir.value.desdeFecha + ' AL ' + this.formImprimir.value.hastaFecha]);
      worksheet.getCell('A2').font = customStyle12.font;
      worksheet.getCell('D2').font = customStyle12.font;

      //Fila 3 cabecera
      const headerRowCell = worksheet.addRow(['Nro.', 'Fecha', 'Sujeto Retenido', 'Documento', 'Número de Autorización', 'Fecha Autorización', 'Valor']);
      headerRowCell.eachCell(cell => {
         cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '002060' } };
         cell.font = { bold: true, name: 'Times New Roman', color: { argb: 'FFFFFF' } };
      });

      // Agrega los datos a la hoja de cálculo
      this._retenciones.forEach((retencion: any) => {
         const valor = retencion.valorretbienes + retencion.valorretservicios + retencion.valretserv100 + retencion.valretair;
         worksheet.addRow([ retencion.secretencion1, retencion.fechaemiret1, retencion.idbene.nomben, retencion.intdoc.nomdoc + " " + retencion.numdoc,
            retencion.numautoriza_e, retencion.fecautoriza, valor ]);
      });

      // Establece el ancho de las columnas
      const anchoConfig = [
         { columnIndex: 1, widthInChars: 6 },
         { columnIndex: 2, widthInChars: 14 },
         { columnIndex: 3, widthInChars: 50 },
         { columnIndex: 4, widthInChars: 16 },
         { columnIndex: 5, widthInChars: 52 },
         { columnIndex: 6, widthInChars: 26 },
         { columnIndex: 7, widthInChars: 16 }
      ];
      anchoConfig.forEach(config => {
         worksheet.getColumn(config.columnIndex).width = config.widthInChars;
      });

      // Columnas centradas 
      const columnsToCenter = [2, 5, 6];
      columnsToCenter.forEach(columnIndex => {
         worksheet.getColumn(columnIndex).eachCell({ includeEmpty: true }, cell => {
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
         });
      });

      // Columnas a la derecha 
      let columnsToRigth = [ 7 ];
      columnsToRigth.forEach(columnIndex => {
         worksheet.getColumn(columnIndex).eachCell({ includeEmpty: true }, cell => {
            cell.alignment = { horizontal: 'right' };
         });
      });
      // Formato numérico
      const numeroStyle = { numFmt: '#,##0.00' };
      const columnsToFormat = [ 7 ];
      for (let i = 4; i <= this._retenciones.length + 3; i++) {
         columnsToFormat.forEach(columnIndex => {
            const cell = worksheet.getCell(i, columnIndex);
            cell.style = numeroStyle;
         });
      }

      //Coloca la fila del Total
      worksheet.addRow([ "", "", 'TOTAL: '+this._retenciones.length]);
      worksheet.getCell('C' + (this._retenciones.length + 4).toString()).font = { bold: true }

      let celdaG = worksheet.getCell('G' + (this._retenciones.length + 4).toString());
      celdaG.numFmt = '#,##0.00';  celdaG.font = { bold: true }
      celdaG.value = { formula: 'SUM(G4:' + 'G' + (this._retenciones.length + 3).toString() + ')', result: 0, sharedFormula: undefined, date1904: false };

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