import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Facturacion } from 'src/app/modelos/facturacion.model';
import { FacturacionService } from 'src/app/servicios/facturacion.service';
import * as ExcelJS from 'exceljs';

@Component({
   selector: 'app-facturacion',
   templateUrl: './facturacion.component.html',
   styleUrls: ['./facturacion.component.css']
})

export class FacturacionComponent implements OnInit {

   formBuscar: FormGroup;
   _facturacion: any;
   numero: any;  //Número enviado como mensaje a eliminar
   rtn: number;
   filtro: string;
   swfiltro: boolean;
   sumtotal: number = 0;
   otraPagina: boolean = false;
   archExportar: string;

   constructor(private factuServicio: FacturacionService, private router: Router, private fb: FormBuilder) { }

   ngOnInit(): void {
      this.formBuscar = this.fb.group({
         desde: '',
         hasta: '',
         del: '',
         al: '',
         cliente: ''
      });

      this.factuServicio.ultimo().subscribe({
         next: datos => {
            let hasta: string = '';
            if (sessionStorage.getItem("hastaFacturacion") != null) hasta = sessionStorage.getItem("hastaFacturacion")!;
            else hasta = datos.idfacturacion.toString();

            let desde: string = '';
            if (sessionStorage.getItem("desdeFacturacion") != null) desde = sessionStorage.getItem("desdeFacturacion")!
            else desde = (+hasta - 10).toString();

            let al: string = '';
            if (sessionStorage.getItem("alFacturacion") != null) al = sessionStorage.getItem("alFacturacion")!
            else al = datos.feccrea.toString().slice(0, 10)

            let del: string = '';
            if (sessionStorage.getItem("delFacturacion") != null) del = sessionStorage.getItem("delFacturacion")!
            else {
               let fechaRestada: Date;
               fechaRestada = new Date(datos.feccrea);
               fechaRestada.setMonth(fechaRestada.getMonth() - 1);
               del = fechaRestada.toISOString().slice(0, 10);
            }

            let cliente: string = '';
            if (sessionStorage.getItem("clienteFacturacion") != null) cliente = sessionStorage.getItem("clienteFacturacion")!

            this.formBuscar.patchValue({
               desde: desde,
               hasta: hasta,
               del: del,
               al: al,
               cliente: cliente
            });
            this.buscar();
         },
         error: err => console.error(err.error)
      });
   }

   iniDesdeHasta() {
      if (!this.formBuscar.value.cliente) {
         let desde = ''
         if (sessionStorage.getItem("desdeFacturacion") != null) desde = sessionStorage.getItem("desdeFacturacion")!;
         this.formBuscar.controls['desde'].setValue(desde);
         let hasta = '';
         if (sessionStorage.getItem("hastaFacturacion") != null) hasta = sessionStorage.getItem("hastaFacturacion")!;
         this.formBuscar.controls['hasta'].setValue(hasta);
      }
   }

   public buscar() {
      let desde = this.formBuscar.value.desde;
      let hasta = this.formBuscar.value.hasta;
      let cliente = this.formBuscar.value.cliente;
      sessionStorage.setItem("delFacturacion", this.formBuscar.value.del);
      sessionStorage.setItem("alFacturacion", this.formBuscar.value.al);
      sessionStorage.setItem("clienteFacturacion", this.formBuscar.value.cliente);

      if (cliente != '' && cliente != null) {
         this.formBuscar.controls['desde'].setValue('');
         this.formBuscar.controls['hasta'].setValue('');
         this.factuServicio.getByCliente(cliente, this.formBuscar.value.del, this.formBuscar.value.al).subscribe({
            next: datos => this._facturacion = datos,
            error: err => console.log(err.error)
         });
      }
      else {
         sessionStorage.setItem("desdeFacturacion", this.formBuscar.value.desde);
         sessionStorage.setItem("hastaFacturacion", this.formBuscar.value.hasta);
         if (desde == '' || desde == null) desde = 0;
         if (hasta == '' || hasta == null) hasta = 999999999;
         this.factuServicio.getDesdeHasta(desde, hasta, this.formBuscar.value.del, this.formBuscar.value.al).subscribe({
            next: datos => {
               this._facturacion = datos;
               this.total();
            },
            error: err => console.log(err.error)
         })
      }
   }

   public modificar(idfacturacion: number) {
      this.router.navigate(['modifacturacion', idfacturacion]);
   }

   eliminar(idfacturacion: number, numero: number) {
      localStorage.setItem("ifacturacionToDelete", idfacturacion.toString());
      this.numero = numero
      this.rtn = 0;
      if (this.numero > 400) {
         this.rtn = 1;
      }
   }

   confirmaEliminar() {
      let idc = localStorage.getItem("ifacturacionToDelete");
      if (idc != null) {
         this.factuServicio.delete(+idc!).subscribe({
            next: datos => this.buscar(),
            error: err => console.log(err.error)
         })
      }
   }

   public info(facturacion: Facturacion) {
      sessionStorage.setItem('idfacturacionToInfo', facturacion.idfacturacion.toString());
      this.router.navigate(['info-facturacion']);
   }

   public nuevo() {
      this.router.navigate(["/add-facturacion"]);
   }

   total() {
      let subtotal = 0;
      for (let i = 0; i < this._facturacion.length; i++) {
         subtotal = subtotal + this._facturacion[i].total;
      }
      this.sumtotal = subtotal;
   }

   //Emisiones
   pdf() {
      //const nombreEmision = new NombreEmisionPipe(); // Crea una instancia del pipe
      let m_izquierda = 10;
      var doc = new jsPDF();
      doc.setFont("times", "bold"); doc.setFontSize(16); doc.text("EpmapaT", m_izquierda, 10);
      doc.setFont("times", "bold"); doc.setFontSize(12); doc.text("FACTURACIÓN", m_izquierda, 16);

      var datos: any = [];
      var i = 0;
      this._facturacion.forEach(() => {
         let fecha = this._facturacion[i].feccrea.slice(8, 10).concat('-', this._facturacion[i].feccrea.slice(5, 7), '-', this._facturacion[i].feccrea.slice(0, 4))
         datos.push([this._facturacion[i].idfacturacion, fecha,
         this._facturacion[i].idcliente_clientes.nombre,
         this._facturacion[i].descripcion, this._facturacion[i].total, this._facturacion[i].cuotas]);
         i++;
      });

      datos.push(['', 'TOTAL', '', '', this.sumtotal]);

      const addPageNumbers = function () {
         const pageCount = doc.internal.pages.length;
         for (let i = 1; i <= pageCount - 1; i++) {
            doc.setPage(i);
            doc.setFontSize(10);
            doc.text('Página ' + i + ' de ' + (pageCount - 1), m_izquierda, doc.internal.pageSize.height - 10);
         }
      };

      autoTable(doc, {
         head: [['Nro.', 'Fecha', 'Cliente', 'Descripción', 'Valor', 'Cuotas']],
         theme: 'grid',
         headStyles: { fillColor: [68, 103, 114], fontStyle: 'bold', halign: 'center' },
         styles: { font: 'helvetica', fontSize: 8, cellPadding: 1, halign: 'center' },
         columnStyles: {
            0: { halign: 'center', cellWidth: 10 },
            1: { halign: 'center', cellWidth: 18 },
            2: { halign: 'left', cellWidth: 60 },
            3: { halign: 'left', cellWidth: 80 },
            4: { halign: 'right', cellWidth: 15, },
            5: { halign: 'center', cellWidth: 14 },
         },
         margin: { left: m_izquierda - 1, top: 19, right: 4, bottom: 13 },
         body: datos,

         didParseCell: function (data) {
            var fila = data.row.index;
            var columna = data.column.index;
            if (columna === 4 && data.cell.section === 'body') { data.cell.text[0] = formatNumber(+data.cell.raw!); }
            if (fila === datos.length - 1) { data.cell.styles.fontStyle = 'bold'; } // Total Bold
         }
      });
      addPageNumbers();

      var opciones = {
         filename: 'lecturas.pdf',
         orientation: 'portrait',
         unit: 'mm',
         format: 'a4',
         compress: true
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

   exportar() { this.archExportar = 'Facturacion' }

   exporta() {
      //const nombreEmision = new NombreEmisionPipe(); // Crea una instancia del pipe
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Facturación');

      let titulo = 'Facturación:'
      if (this.formBuscar.value.desde) titulo = titulo + ' Desde ' + this.formBuscar.value.desde
      if (this.formBuscar.value.hasta) titulo = titulo + ' Hasta ' + this.formBuscar.value.hasta
      if (this.formBuscar.value.cliente) titulo = titulo + ' Cliente ' + this.formBuscar.value.cliente
      if (!this.formBuscar.value.desde && !this.formBuscar.value.hasta)
         titulo = titulo + ' del ' + this.formBuscar.value.del + ' al ' + this.formBuscar.value.al;
      worksheet.addRow(['', '', titulo]);

      // Celda C1
      const cellC1 = worksheet.getCell('C1');
      const customStyle = { font: { name: 'Times New Roman', bold: true, size: 14, color: { argb: '002060' } } };
      cellC1.font = customStyle.font;

      worksheet.addRow([]);

      const cabecera = ['Nro', 'Fecha', 'Cliente', 'Descripción', 'Valor', 'Cuotas'];
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
      this._facturacion.forEach((item: any) => {
         const row = [item.idfacturacion, , item.idcliente_clientes.nombre, item.descripcion, item.total, item.cuotas];
         let fila = worksheet.addRow(row);
         if (item.feccrea != null) {
            let celdaBi = fila.getCell('B'); //Celda de la Fecha
            let año = item.feccrea.toString().slice(0, 4);
            let mes = item.feccrea.toString().slice(5, 7);
            let dia = item.feccrea.toString().slice(8, 10);
            let fecha = `DATE(${año},${mes},${dia})`;
            celdaBi.value = { formula: fecha, result: 0, sharedFormula: undefined, date1904: false };
            celdaBi.numFmt = 'dd-mm-yyyy';
         }
      });

      //Coloca la fila del Total
      worksheet.addRow(['', '', 'TOTAL']);
      worksheet.getCell('C' + (this._facturacion.length + 4).toString()).font = { bold: true }
      let celdaE = worksheet.getCell('E' + (this._facturacion.length + 4).toString());
      celdaE.numFmt = '#,##0.00';
      celdaE.font = { bold: true }
      celdaE.value = { formula: 'SUM(E4:' + 'E' + (this._facturacion.length + 3).toString() + ')', result: 0, sharedFormula: undefined, date1904: false };

      // Establece el ancho de las columnas
      const anchoConfig = [
         { columnIndex: 2, widthInChars: 12 },
         { columnIndex: 3, widthInChars: 45 },
         { columnIndex: 4, widthInChars: 60 },
         { columnIndex: 5, widthInChars: 10 },
         { columnIndex: 8, widthInChars: 25 },
      ];
      anchoConfig.forEach(config => {
         worksheet.getColumn(config.columnIndex).width = config.widthInChars;
      });

      // Columnas centradas 
      const columnsToCenter = [1, 2, 6];
      columnsToCenter.forEach(columnIndex => {
         worksheet.getColumn(columnIndex).eachCell({ includeEmpty: true }, cell => {
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
         });
      });
      // Columnas a la derecha 
      let columnsToRigth = [5];
      columnsToRigth.forEach(columnIndex => {
         worksheet.getColumn(columnIndex).eachCell({ includeEmpty: true }, cell => {
            cell.alignment = { horizontal: 'right' };
         });
      });

      // Formato numérico
      const numeroStyle = { numFmt: '#,##0.00' };
      const columnsToFormat = [5];
      for (let i = 4; i <= this._facturacion.length + 3; i++) {
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

function formatNumber(num: number) {
   return num.toFixed(2).replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')
}
