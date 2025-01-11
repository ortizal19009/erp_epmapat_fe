import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CuentasService } from 'src/app/servicios/contabilidad/cuentas.service';
import { TransaciService } from 'src/app/servicios/contabilidad/transaci.service';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as ExcelJS from 'exceljs';
import { ConciliabanService } from 'src/app/servicios/contabilidad/conciliaban.service';

@Component({
   selector: 'app-imp-bancos',
   templateUrl: './imp-bancos.component.html',
   styleUrls: ['./imp-bancos.component.css']
})
export class ImpBancosComponent implements OnInit {

   idcuenta: number;
   swimprimir: boolean = true;
   formImprimir: FormGroup;
   formBancos: FormGroup;
   opcreporte: number = 1;
   otrapagina: boolean = false;
   swbotones: boolean = false;
   swcalculando: boolean = false;
   txtcalculando = 'Calculando';
   _bancos: any = [];
   _movibank: any;
   _conciliacion: any;
   nombanco: string;
   nommes: string;
   sumdebito: number;
   sumcredito: number;
   pdfgenerado: string;
   nombrearchivo: string;
   meses: any = [
      { valor: 1, nombre: 'Enero' },
      { valor: 2, nombre: 'Febrero' },
      { valor: 3, nombre: 'Marzo' },
      { valor: 4, nombre: 'Abril' },
      { valor: 5, nombre: 'Mayo' },
      { valor: 6, nombre: 'Junio' },
      { valor: 7, nombre: 'Julio' },
      { valor: 8, nombre: 'Agosto' },
      { valor: 9, nombre: 'Septiembre' },
      { valor: 10, nombre: 'Octubre' },
      { valor: 11, nombre: 'Noviembre' },
      { valor: 12, nombre: 'Diciembre' },
   ];

   constructor(public fb: FormBuilder, private router: Router, private cueService: CuentasService,
      private tranService: TransaciService, private conciService: ConciliabanService) { }

   ngOnInit(): void {
      sessionStorage.setItem('ventana', '/bancos');
      let coloresJSON = sessionStorage.getItem('/bancos');
      if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));

      this.formBancos = this.fb.group({
         idcuenta: '',
         mes: 1,
      });

      const bancosJSON = sessionStorage.getItem('bancosToImpExp');
      if (bancosJSON) {
         const banco = JSON.parse(bancosJSON);
         this.idcuenta = banco.idcuenta;

         this.listarBancos();
         this.formBancos.patchValue({
            idcuenta: banco.idcuenta,
            mes: banco.mes
         });

         this.formImprimir = this.fb.group({
            reporte: '1',
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

   listarBancos() {
      this.cueService.getBancos().subscribe({
         next: datos => this._bancos = datos,
         error: (e) => console.error(e),
      });
   }

   get f() { return this.formImprimir.controls; }

   changeReporte() { this.opcreporte = +this.formImprimir.value.reporte; }

   impriexpor() { this.swimprimir = !this.swimprimir; }

   retornar() { this.router.navigate(['bancos']); }

   comprobante(tipcom: number, compro: number) {
      if (tipcom == 1) return 'I-' + compro.toString();
      if (tipcom == 2) return 'E-' + compro.toString();
      if (tipcom == 3) return 'DC-' + compro.toString();
      if (tipcom == 4) return 'DI-' + compro.toString();
      if (tipcom == 5) return 'DE-' + compro.toString();
      return '';
   }

   //Recupera los datos de cada reporte
   async imprimir() {
      this.swbotones = true;
      this.swcalculando = true;
      //Busca y guarda el nombre del Banco
      const x = this._bancos.find((banco: { idcuenta: number; }) => banco.idcuenta == this.formBancos.value.idcuenta);
      if (x) this.nombanco = x.nomcue;
      else this.nombanco = '';
      //Busca y guarda el nombre del Mes
      const y = this.meses.find((mes: { valor: number; }) => mes.valor == this.formBancos.value.mes);
      if (y) this.nommes = y.nombre;
      else this.nommes = '';
      // let fecha = this.formImprimir.value.fecha;
      switch (this.opcreporte) {
         case 1:  // Movimientos
            try {
               this._movibank = await this.tranService.getMovibankAsync(+this.formBancos.value.idcuenta, +this.formBancos.value.mes!);
               this.sumdebito = 0; this.sumcredito = 0;
               this.totales();
               this.swcalculando = false;
               if (this.swimprimir) this.txtcalculando = 'Mostrar'
               else this.txtcalculando = 'Descargar'
            } catch (error) {
               console.error('Error al obtener las transacciones de la cuenta:', error);
            }
            break;
         case 2:  //Conciliación
            try {
               this._conciliacion = await this.conciService.getByIdcuentaMesAsync(+this.formBancos.value.idcuenta, +this.formBancos.value.mes!);
               console.log('this._conciliacion: ', this._conciliacion)
               this.swcalculando = false;
               if (this.swimprimir) this.txtcalculando = 'Mostrar'
               else this.txtcalculando = 'Descargar'
            } catch (error) {
               console.error('Error al obtener las Planillas:', error);
            }
            break;
         default:
      }
   }

   totales() {
      let i = 0;
      this._movibank.forEach(() => {
         if (this._movibank[i].debcre == 1) {
            this._movibank[i].debito = formatNumber(this._movibank[i].valor);
            this._movibank[i].credito = '';
            this.sumdebito = this.sumdebito + this._movibank[i].valor
         } else {
            this._movibank[i].debito = '';
            this._movibank[i].credito = formatNumber(this._movibank[i].valor);
            this.sumcredito = this.sumcredito + this._movibank[i].valor
         }
         i++;
      });
   }

   nomben(nomben: string) {
      if (nomben == '(Ninguno)') return ''
      else return nomben;
   }

   //Muestra cada reporte
   imprime() {
      this.swbotones = false; this.swcalculando = false; this.txtcalculando = 'Calculando'
      switch (this.opcreporte) {
         case 1:  //Movimientos
            if (this.swimprimir) this.imprimeMovimientos();
            else this.exportaMovimientos();
            break;
         case 2:  //Conciliación
            if (this.swimprimir) this.imprimeConciliacion();
         // else this.exportarFacturas();
         // break;
      }
   }

   imprimeMovimientos() {
      this.otrapagina = this.formImprimir.value.otrapagina;
      const doc = new jsPDF('l', 'mm', 'a4', true);
      let m_izquierda = 10;
      doc.setFont("times", "bold"); doc.setFontSize(16); doc.text("EpmapaT", m_izquierda, 10);
      doc.setFont("times", "bold"); doc.setFontSize(12); doc.text("Movimientos: " + this.nombanco, m_izquierda, 16);
      doc.setFont("times", "bold"); doc.setFontSize(11); doc.text("Conciliación del mes de " + this.nommes, m_izquierda, 22);

      const datos: any = [];
      let i = 0;
      this._movibank.forEach(() => {
         datos.push([this._movibank[i].idasiento.fecha, this._movibank[i].idasiento.asiento,
         this.comprobante(this._movibank[i].idasiento.tipcom, this._movibank[i].idasiento.compro),
         this._movibank[i].intdoc.nomdoc + ' ' + this._movibank[i].numdoc, this._movibank[i].swconcili, this._movibank[i].mesconcili,
         this._movibank[i].debito, this._movibank[i].credito, this.nomben(this._movibank[i].idasiento.idbene.nomben), this._movibank[i].descri]);
         i++;
      });
      datos.push(['', '', '', 'TOTAL', '', '', formatNumber(this.sumdebito), formatNumber(this.sumcredito)]);

      autoTable(doc, {
         head: [['Fecha', 'Asie', 'Cmprbnt', 'Documento', 'C', 'M', 'Débito', 'Crédito', 'Beneficiario', 'Concepto']],
         theme: 'grid',
         headStyles: { fillColor: [68, 103, 114], fontStyle: 'bold', halign: 'center' },
         styles: { font: 'helvetica', fontSize: 8, cellPadding: 1, halign: 'center' },

         columnStyles: {
            0: { halign: 'center', cellWidth: 18 },
            1: { halign: 'center', cellWidth: 10 },
            2: { halign: 'center', cellWidth: 16 },
            3: { halign: 'left', cellWidth: 30, fontSize: 7 },
            4: { halign: 'center', cellWidth: 4 },
            5: { halign: 'center', cellWidth: 4 },
            6: { halign: 'right', cellWidth: 16 },
            7: { halign: 'right', cellWidth: 16 },
            8: { halign: 'left', cellWidth: 50 },
            9: { halign: 'left', cellWidth: 118 },
         },
         margin: { left: m_izquierda - 1, top: 24, right: 6, bottom: 13 },
         body: datos,

         didParseCell: function (hookData) {
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

   imprimeConciliacion() {
      this.otrapagina = this.formImprimir.value.otrapagina;
      const doc = new jsPDF('l', 'mm', 'a4', true);
      let m_izquierda = 20;
      doc.setFont("times", "bold"); doc.setFontSize(16); doc.text("EpmapaT", m_izquierda, 10);
      doc.setFont("times", "bold"); doc.setFontSize(11); doc.text("Conciliación de " + this.nommes, m_izquierda, 16);
      doc.setFont("times", "bold"); doc.setFontSize(12); doc.text(this.nombanco, m_izquierda, 22);

      // Rectángulos
      doc.rect(16, 30, 104, 68);
      doc.rect(120, 30, 100, 68);
      doc.line(16, 38, 220, 38);
      doc.rect(16, 98, 204, 16); //Saldo

      doc.setFont("times", "bold"); doc.setFontSize(11); doc.text("LIBRO BANCOS", m_izquierda + 6, 36);
      doc.setFont("times", "bold"); doc.setFontSize(11); doc.text("Inicial ", m_izquierda + 6, 44);
      doc.setFont("times", "bold"); doc.setFontSize(11); doc.text("+ Débitos ", m_izquierda + 6, 50);
      doc.setFont("times", "bold"); doc.setFontSize(11); doc.text("+ Créditos ", m_izquierda + 6, 56);
      doc.setFont("times", "bold"); doc.setFontSize(11); doc.text("Final", m_izquierda + 6, 62);
      doc.setFont("times", "bold"); doc.setFontSize(11); doc.text("Partidas Conciliatorias", m_izquierda + 6, 70);
      const textHeight = doc.getTextDimensions("Partidas Conciliatorias").h;
      doc.line(m_izquierda + 6, 67 + textHeight, m_izquierda + 6 + doc.getTextWidth("Partidas Conciliatorias "), 67 + textHeight);
      doc.setFont("times", "bold"); doc.setFontSize(11); doc.text("- Depósitos en tránsito", m_izquierda + 6, 76);
      doc.setFont("times", "bold"); doc.setFontSize(11); doc.text("+ N/D no cobradas", m_izquierda + 6, 82);
      doc.setFont("times", "bold"); doc.setFontSize(11); doc.text("± Transacc. mal registradas", m_izquierda + 6, 88);
      doc.setFont("times", "bold"); doc.setFontSize(11); doc.text("Saldo Conciliado", m_izquierda + 6, 104);
      doc.setFont("times", "bold"); doc.setFontSize(11); doc.text("Diferencia", m_izquierda + 6, 110);

      doc.setFont("times", "normal"); doc.setFontSize(11); doc.text(formatNumber(this._conciliacion.libinicial), m_izquierda + 54, 44, { align: 'right' });
      doc.setFont("times", "normal"); doc.setFontSize(11); doc.text(formatNumber(this._conciliacion.libdebitos), m_izquierda + 54, 50, { align: 'right' });
      doc.setFont("times", "normal"); doc.setFontSize(11); doc.text(formatNumber(this._conciliacion.libcreditos), m_izquierda + 54, 56, { align: 'right' });
      doc.setFont("times", "bold"); doc.setFontSize(11); doc.text(formatNumber(this._conciliacion.libinicial + this._conciliacion.libdebitos - this._conciliacion.libcreditos), m_izquierda + 54, 62, { align: 'right' });
      doc.setFont("times", "normal"); doc.setFontSize(11); doc.text(formatNumber(this._conciliacion.libdepositos), m_izquierda + 84, 76, { align: 'right' });
      doc.setFont("times", "normal"); doc.setFontSize(11); doc.text(formatNumber(this._conciliacion.libcheques), m_izquierda + 84, 82, { align: 'right' });
      doc.setFont("times", "normal"); doc.setFontSize(11); doc.text(formatNumber(this._conciliacion.liberrores), m_izquierda + 84, 88, { align: 'right' });
      doc.setFont("times", "bold"); doc.setFontSize(11); doc.text(formatNumber(this._conciliacion.libinicial + this._conciliacion.libdebitos - this._conciliacion.libcreditos - this._conciliacion.libdepositos + this._conciliacion.libcheques + this._conciliacion.liberrores ), m_izquierda + 84, 104, { align: 'right' });

      doc.setFont("times", "bold"); doc.setFontSize(11); doc.text("ESTADO DE CUENTA DEL BANCO", m_izquierda + 110, 36);
      doc.setFont("times", "bold"); doc.setFontSize(11); doc.text("Inicial ", m_izquierda + 110, 44);
      doc.setFont("times", "bold"); doc.setFontSize(11); doc.text("+ Créditos ", m_izquierda + 110, 50);
      doc.setFont("times", "bold"); doc.setFontSize(11); doc.text("- Débitos", m_izquierda + 110, 56);
      doc.setFont("times", "bold"); doc.setFontSize(11); doc.text("Final", m_izquierda + 110, 62);
      doc.setFont("times", "bold"); doc.setFontSize(11); doc.text("- Transferencias AA", m_izquierda + 110, 76);
      doc.setFont("times", "bold"); doc.setFontSize(11); doc.text("- N/C no contabilizadas", m_izquierda + 110, 82);
      doc.setFont("times", "bold"); doc.setFontSize(11); doc.text("+ N/D no contabilizadas", m_izquierda + 110, 88);
      doc.setFont("times", "bold"); doc.setFontSize(11); doc.text("± Errores en el banco", m_izquierda + 110, 94);

      doc.setFont("times", "normal"); doc.setFontSize(11); doc.text(formatNumber(this._conciliacion.baninicial), m_izquierda + 164, 44, { align: 'right' });
      doc.setFont("times", "normal"); doc.setFontSize(11); doc.text(formatNumber(this._conciliacion.bancreditos), m_izquierda + 164, 50, { align: 'right' });
      doc.setFont("times", "normal"); doc.setFontSize(11); doc.text(formatNumber(this._conciliacion.bandebitos), m_izquierda + 164, 56, { align: 'right' });
      doc.setFont("times", "bold"); doc.setFontSize(11); doc.text(formatNumber(this._conciliacion.baninicial + this._conciliacion.bancreditos - this._conciliacion.bandebitos), m_izquierda + 164, 62, { align: 'right' });
      doc.setFont("times", "normal"); doc.setFontSize(11); doc.text(formatNumber(this._conciliacion.bancheaa), m_izquierda + 184, 76, { align: 'right' });
      doc.setFont("times", "normal"); doc.setFontSize(11); doc.text(formatNumber(this._conciliacion.bannd ), m_izquierda + 184, 82, { align: 'right' });
      doc.setFont("times", "normal"); doc.setFontSize(11); doc.text(formatNumber(this._conciliacion.bannc ), m_izquierda + 184, 88, { align: 'right' });
      doc.setFont("times", "normal"); doc.setFontSize(11); doc.text(formatNumber(this._conciliacion.banerrores ), m_izquierda + 184, 94, { align: 'right' });
      doc.setFont("times", "bold"); doc.setFontSize(11); doc.text(formatNumber(this._conciliacion.baninicial + this._conciliacion.bancreditos - this._conciliacion.bandebitos - this._conciliacion.bancheaa - this._conciliacion.bannd + this._conciliacion.bannc + this._conciliacion.banerrores ), m_izquierda + 184, 104, { align: 'right' });
      let diferencia = (this._conciliacion.libinicial + this._conciliacion.libdebitos - this._conciliacion.libcreditos - this._conciliacion.libdepositos + this._conciliacion.libcheques + this._conciliacion.liberrores) - (this._conciliacion.libinicial + this._conciliacion.libdebitos - this._conciliacion.libcreditos - this._conciliacion.libdepositos + this._conciliacion.libcheques + this._conciliacion.liberrores)
      doc.setFont("times", "normal"); doc.setFontSize(11); doc.text(formatNumber(diferencia), m_izquierda + 84, 110, { align: 'right' });

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

   exportaMovimientos() {
      this.nombrearchivo = this.formImprimir.value.nombrearchivo;
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(this.nombrearchivo);

      // Fila 1
      worksheet.addRow(['', '', '', 'Movimientos: ' + this.nombanco]);
      const cellD1 = worksheet.getCell('D1');
      const customStyle = { font: { name: 'Times New Roman', bold: true, size: 14, color: { argb: '002060' } } };
      cellD1.font = customStyle.font;

      // Fila 2
      worksheet.addRow(['', '', '', 'Conciliacion del mes de ' + this.nommes]);
      const cellD2 = worksheet.getCell('D2');
      const customStyle2 = { font: { name: 'Times New Roman', bold: true, size: 10, color: { argb: '002060' } } };
      cellD2.font = customStyle2.font;

      let filatit = 3
      //Fila 3 Cabecera 
      const headerRowCell = worksheet.addRow(['Fecha', 'Asie', 'Cmprbnt', 'Documento', 'C', 'M', 'Débito', 'Crédito', 'Beneficiario', 'Concepto']);
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
      this._movibank.forEach(() => {
         let nomben: string;
         if (this._movibank[i].idasiento.idbene.idbene == 1) nomben = ''
         else nomben = this._movibank[i].idasiento.idbene.nomben
         const row = [this._movibank[i].idasiento.fecha, this._movibank[i].idasiento.asiento,
         this.comprobante(this._movibank[i].idasiento.tipcom, this._movibank[i].idasiento.compro), this._movibank[i].intdoc.nomdoc + ' ' + this._movibank[i].numdoc,
         this._movibank[i].swconcili, this._movibank[i].mesconcili, this._movibank[i].valor, this._movibank[i].valor, nomben, this._movibank[i].descri];
         worksheet.addRow(row);
         i++;
      });

      // Establece el ancho de las columnas
      const anchoConfig = [
         { columnIndex: 1, widthInChars: 12 },
         { columnIndex: 2, widthInChars: 10 },
         { columnIndex: 3, widthInChars: 12 },
         { columnIndex: 4, widthInChars: 18 },
         { columnIndex: 5, widthInChars: 3 },
         { columnIndex: 6, widthInChars: 3 },
         { columnIndex: 7, widthInChars: 16 },
         { columnIndex: 8, widthInChars: 16 },
         { columnIndex: 9, widthInChars: 40 },
         { columnIndex: 10, widthInChars: 120 },
      ];
      anchoConfig.forEach(config => {
         worksheet.getColumn(config.columnIndex).width = config.widthInChars;
      });

      // Columnas centradas 
      const columnsToCenter = [1, 2, 3, 5, 6];
      columnsToCenter.forEach(columnIndex => {
         worksheet.getColumn(columnIndex).eachCell({ includeEmpty: true }, cell => {
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
         });
      });
      // Columnas a la derecha 
      let columnsToRigth = [7, 8];
      columnsToRigth.forEach(columnIndex => {
         worksheet.getColumn(columnIndex).eachCell({ includeEmpty: true }, cell => {
            cell.alignment = { horizontal: 'right' };
         });
      });

      // Formato numérico con decimales
      const numeroStyle1 = { numFmt: '#,##0.00' };
      const columnsToFormat1 = [7, 8];
      for (let i = filatit + 1; i <= this._movibank.length + filatit; i++) {
         columnsToFormat1.forEach(columnIndex => {
            const cell = worksheet.getCell(i, columnIndex);
            cell.style = numeroStyle1;
         });
      }

      //Coloca la fila de Totales
      worksheet.addRow(['', '', '', 'TOTAL']);
      worksheet.getCell('D' + (this._movibank.length + filatit + 1).toString()).font = { bold: true }

      let celdaG = worksheet.getCell('G' + (this._movibank.length + filatit + 1).toString());
      celdaG.numFmt = '#,##0.00';
      celdaG.font = { bold: true };
      celdaG.value = { formula: 'SUM(G4:' + 'G' + (this._movibank.length + filatit).toString() + ')', result: 0, sharedFormula: undefined, date1904: false };

      let celdaH = worksheet.getCell('H' + (this._movibank.length + filatit + 1).toString());
      celdaH.numFmt = '#,##0.00';
      celdaH.font = { bold: true }
      celdaH.value = { formula: 'SUM(H4:' + 'H' + (this._movibank.length + filatit).toString() + ')', result: 0, sharedFormula: undefined, date1904: false };

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