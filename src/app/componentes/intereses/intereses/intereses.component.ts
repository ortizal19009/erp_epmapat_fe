import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Intereses } from 'src/app/modelos/intereses';
import { InteresesService } from 'src/app/servicios/intereses.service';
import { AddInteresesComponent } from '../add-intereses/add-intereses.component';
import { ModificarInteresesComponent } from '../modificar-intereses/modificar-intereses.component';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as ExcelJS from 'exceljs';

@Component({
   selector: 'app-intereses',
   templateUrl: './intereses.component.html',
   styleUrls: ['./intereses.component.css']
})

export class ListarInteresesComponent implements OnInit {

   _intereses: any;
   mostrarComponente: boolean = false;
   componente: any;
   interes = {} as Interes; //Interface para los datos del Interés a eliminar
   otraPagina: boolean = false;
   archExportar: string;

   constructor(public interService: InteresesService, public router: Router) { }

   ngOnInit(): void {
      this.listarIntereses();
   }

   listarIntereses() {
      this.interService.getListaIntereses().subscribe({
         next: datos => this._intereses = datos,
         error: err => console.error(err.error)
      });
   }

   nuevo() {
      this.mostrarComponente = true;
      this.componente = AddInteresesComponent;
   }

   modificar(idinteres: number) {
      this.mostrarComponente = true;
      this.componente = ModificarInteresesComponent;
      localStorage.setItem("idinteres", idinteres.toString());
   }

   reset() { this.componente = null; }

   datosEliminar(interes: Intereses) {
      this.interes.idinteres = interes.idinteres;
      this.interes.anio = interes.anio
      this.interes.mes = interes.mes
   }

   elimInteres() {
      this.interService.deleteInteres(this.interes.idinteres).subscribe({
         next: datos => this.listarIntereses(),
         error: err => console.log(err.error)
      });
   }

   pdf() {
      let m_izquierda = 20;
      var doc = new jsPDF();
      doc.setFont("times", "bold"); doc.setFontSize(16); doc.text("EpmapaT", m_izquierda, 10);
      doc.setFont("times", "normal"); doc.setFontSize(12); doc.text("LISTA DE INTERESES", m_izquierda, 16)

      var datos: any = [];
      let nombreMes: string;
      var i = 0;
      this._intereses.forEach(() => {
         let mes = (+this._intereses[i].mes!);
         switch (mes) {
            case 1: nombreMes = 'Enero'; break;
            case 2: nombreMes = 'Febrero'; break;
            case 3: nombreMes = 'Marzo'; break;
            case 4: nombreMes = 'Abril'; break;
            case 5: nombreMes = 'Mayo'; break;
            case 6: nombreMes = 'Junio'; break;
            case 7: nombreMes = 'Julio'; break;
            case 8: nombreMes = 'Agosto'; break;
            case 9: nombreMes = 'Septiembre'; break;
            case 10: nombreMes = 'Octubre'; break;
            case 11: nombreMes = 'Noviembre'; break;
            case 12: nombreMes = 'Diciembre'; break;
            default: nombreMes = ''; break;
         }
         datos.push([this._intereses[i].anio, nombreMes, this._intereses[i].porcentaje.toFixed(2)]);
         i++;
      });

      let cabecera = ['AÑO', "MES", "%"];

      autoTable(doc, {
         theme: 'grid',
         headStyles: { fillColor: [83, 67, 54], fontStyle: 'bold', halign: 'center' },
         styles: { font: 'helvetica', fontSize: 10, cellPadding: 1, halign: 'center' },
         columnStyles: {
            0: { halign: 'center' },
            1: { halign: 'left' },
            2: { halign: 'right' }
         },

         margin: { left: m_izquierda - 1, top: 18, right: 90, bottom: 10 },
         head: [cabecera],
         body: datos,

      });

      var opciones = {
         filename: 'intereses.pdf',
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
         embed.setAttribute('width', '50%');
         embed.setAttribute('height', '100%');
         embed.setAttribute('id', 'idembed');
         //Agrega el <embed> al contenedor del Modal
         var container: any;
         container = document.getElementById('pdf');
         container.appendChild(embed);
      }
   }

   importar() { this.router.navigate(['/impor-intereses']); }

   exportar() { this.archExportar = 'Intereses' }

   exporta() {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Intereses');

      const headerRow = ['Año', 'Mes', ' % '];
      const headerRowCell = worksheet.addRow(headerRow);
      headerRowCell.eachCell(cell => {
         cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: '002060' }
         };
         cell.font = {
            bold: true,
            color: { argb: 'FFFFFF' }
         };
         // cell.alignment = { horizontal: 'center', vertical: 'middle' }; //Centra toas las celdas de la fila
         // Centrar una celda específica (por ejemplo, la primera celda de la segunda fila)
         const specificCell = worksheet.getCell('C1'); // Cambiar la referencia de celda según tu necesidad
         specificCell.alignment = { horizontal: 'center', vertical: 'middle' }; // Centrar contenido
      });

      // Agregar los datos a la hoja de cálculo
      this._intereses.forEach((item: any) => {
         const row = [item.anio, item.mes, item.porcentaje];
         worksheet.addRow(row);
      });

      // Crear un archivo Excel
      workbook.xlsx.writeBuffer().then(buffer => {
         const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
         const url = window.URL.createObjectURL(blob);

         // Crear un enlace para descargar el archivo
         const a = document.createElement('a');
         a.href = url;
         a.download = `${this.archExportar}.xlsx`; // Usar el nombre proporcionado por el usuario
         a.click();

         window.URL.revokeObjectURL(url); // Liberar recursos
      });
   }

}



interface Interes {
   idinteres: number;
   anio: number;
   mes: number;
}
