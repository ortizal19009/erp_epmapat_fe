import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { BeneficiariosService } from 'src/app/servicios/contabilidad/beneficiarios.service';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as ExcelJS from 'exceljs';

@Component({
   selector: 'app-imp-beneficiarios',
   templateUrl: './imp-beneficiarios.component.html',
   styleUrls: ['./imp-beneficiarios.component.css']
})

export class ImpBeneficiariosComponent implements OnInit {

   swimprimir: boolean = true;
   formImprimir: FormGroup;
   opcreporte: number = 1;
   otrapagina: boolean = false;
   swbotones: boolean = false;
   swcalculando: boolean = false;
   txtcalculando = 'Calculando';
   pdfgenerado: string;
   _beneficiarios: any;
   today: number = Date.now();
   date: Date = new Date();
   nombrearchivo: string;

   constructor(public fb: FormBuilder, private router: Router, private beneService: BeneficiariosService) { }

   ngOnInit(): void {
      sessionStorage.setItem('ventana', '/beneficiarios');
      let coloresJSON = sessionStorage.getItem('/beneficiarios');
      if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));

      const beneficiarios = JSON.parse(sessionStorage.getItem('beneficiariosToImpExp')!);
      //sessionStorage.removeItem( 'beneficiariosToImpExp' )
      this.formImprimir = this.fb.group({
         reporte: '1',
         nomben: beneficiarios.nomben,
         codben: beneficiarios.codben,
         rucben: beneficiarios.rucben,
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

   retornar() { this.router.navigate(['beneficiarios']); }

   async imprimir() {
      this.swbotones = true;
      this.swcalculando = true;
      let fecha = this.formImprimir.value.fecha;
      switch (this.opcreporte) {
         case 1:  //Lista de beneficiarios
            try {
               let nomben = this.formImprimir.value.nomben;
               let codben = this.formImprimir.value.codben;
               let ruc_ciben = this.formImprimir.value.rucben;
               this._beneficiarios = await this.beneService.getBeneficiariosAsync(nomben, codben, ruc_ciben, ruc_ciben)
               this.swcalculando = false;
               if (this.swimprimir) this.txtcalculando = 'Mostrar'
               else this.txtcalculando = 'Descargar'
            } catch (error) {
               console.error('Error al obtener las cuentas:', error);
            }
            break;
         case 2:  //Movimientos por beneficiario
            try {
               let nomben = this.formImprimir.value.nomben;
               let codben = this.formImprimir.value.codben;
               let ruc_ciben = this.formImprimir.value.rucben;
               this._beneficiarios = await this.beneService.getBeneficiariosAsync(nomben, codben, ruc_ciben, ruc_ciben)
               this.swcalculando = false;
               if (this.swimprimir) this.txtcalculando = 'Mostrar'
               else this.txtcalculando = 'Descargar'
            } catch (error) {
               console.error('Error al obtener las cuentas:', error);
            }
            break;
         case 3:  //Anticipos
            try {
               let nomben = this.formImprimir.value.nomben;
               let codben = this.formImprimir.value.codben;
               let ruc_ciben = this.formImprimir.value.rucben;
               this._beneficiarios = await this.beneService.getBeneficiariosAsync(nomben, codben, ruc_ciben, ruc_ciben)
               this.swcalculando = false;
               if (this.swimprimir) this.txtcalculando = 'Mostrar'
               else this.txtcalculando = 'Descargar'
            } catch (error) {
               console.error('Error al obtener las cuentas:', error);
            }
            break;
      }
   }

   imprime() {
      this.swbotones = false; this.swcalculando = false; this.txtcalculando = 'Calculando'
      switch (this.opcreporte) {
         case 1:  //Lista de beneficiarios
            if (this.swimprimir) this.imprimeBeneficiarios();
            else this.exportaBeneficiarios();
            break;
         case 2:  //Movimientos por beneficiario
            if (this.swimprimir) this.imprimeBeneficiarios();
            else this.exportaBeneficiarios();
            break;
         case 3:  //Anticipos
            if (this.swimprimir) this.imprimeBeneficiarios();
            else this.exportaBeneficiarios();
            break;
      }
   }

   imprimeBeneficiarios() {
      this.otrapagina = this.formImprimir.value.otrapagina;
      const doc = new jsPDF('l', 'mm', 'a4', true);
      let m_izquierda = 20;
      doc.setFont("times", "bold"); doc.setFontSize(16); doc.text("EpmapaT", m_izquierda, 10);
      doc.setFont("times", "bold"); doc.setFontSize(12); doc.text("Lista de Beneficiarios", m_izquierda, 16);

      const datos: any = [];
      let i = 0;
      this._beneficiarios.forEach(() => {
         let identificacion: string = '';
         if (this._beneficiarios[i].tpidben == '05') identificacion = this._beneficiarios[i].ciben;
         else identificacion = this._beneficiarios[i].rucben;
         datos.push([this._beneficiarios[i].nomben, this._beneficiarios[i].codben, identificacion,
         this._beneficiarios[i].mailben, this._beneficiarios[i].tlfben, this._beneficiarios[i].dirben]);
         i++;
      });
      datos.push(['TOTAL: ' + this._beneficiarios.length]);

      autoTable(doc, {
         head: [['Nombre', 'Código', 'RUC/CI', 'e-mail', 'Teléfonos', 'Dirección']],
         theme: 'grid',
         headStyles: { fillColor: [68, 103, 114], fontStyle: 'bold', halign: 'center' },
         styles: { font: 'helvetica', fontSize: 8, cellPadding: 1, halign: 'center' },
         margin: { left: m_izquierda - 1, top: 18, right: 10, bottom: 13 },

         columnStyles: {
            0: { halign: 'left', cellWidth: 80 },
            1: { halign: 'center', cellWidth: 12 },
            2: { halign: 'left', cellWidth: 24 },
            3: { halign: 'left', cellWidth: 60 },
            4: { halign: 'left', cellWidth: 20 },
            5: { halign: 'left', cellWidth: 72 },
         },
         body: datos,

         didParseCell: function (hookData) {
            //Ultima fila => Negrita 
            const isLastRow = hookData.row.index === datos.length - 1;
            if (isLastRow) {
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

   exportaBeneficiarios() {
      this.nombrearchivo = this.formImprimir.value.nombrearchivo;
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(this.nombrearchivo);
      // Fila 1
      worksheet.addRow(['Lista de Beneficiarios']);
      worksheet.getCell('A1').font = { name: 'Times New Roman', bold: true, size: 14, color: { argb: '002060' } }

      // Fila 2
      worksheet.addRow([]);
      // worksheet.getCell('B2').font = { name: 'Times New Roman', bold: true, size: 16, color: { argb: '001060' } };

      //Fila 3 Cabecera 
      const headerRowCell = worksheet.addRow(['Nombre', 'Código', 'RUC/CI', 'e-mail', 'Teléfonos', 'Dirección']);
      headerRowCell.eachCell(cell => {
         cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '002060' } };
         cell.font = { bold: true, name: 'Times New Roman', color: { argb: 'FFFFFF' } };
      });

      // Agrega los datos a la hoja de cálculo
      let i = 0;
      this._beneficiarios.forEach(() => {
         let identificacion: string = '';
         if (this._beneficiarios[i].tpidben == '05') identificacion = this._beneficiarios[i].ciben;
         else identificacion = this._beneficiarios[i].rucben;
         worksheet.addRow([this._beneficiarios[i].nomben, this._beneficiarios[i].codben, identificacion,
         this._beneficiarios[i].mailben, this._beneficiarios[i].tlfben, this._beneficiarios[i].dirben]);
         i++;
      });

      // Establece el ancho de las columnas
      const anchoConfig = [
         { columnIndex: 1, widthInChars: 60 },
         { columnIndex: 2, widthInChars: 10 },
         { columnIndex: 3, widthInChars: 16 },
         { columnIndex: 4, widthInChars: 40 },
         { columnIndex: 5, widthInChars: 20 },
         { columnIndex: 6, widthInChars: 50 },
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

      //Coloca la fila de Totales
      worksheet.addRow(['TOTAL: ' + this._beneficiarios.length]);
      worksheet.getCell('A' + (this._beneficiarios.length + 4).toString()).font = { bold: true }

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
