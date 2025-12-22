import { Component, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Usoitems } from 'src/app/modelos/usoitems.model';
import { ModulosService } from 'src/app/servicios/modulos.service';
import { UsoitemsService } from 'src/app/servicios/usoitems.service';

@Component({
   selector: 'app-usoitems',
   templateUrl: './usoitems.component.html',
   styleUrls: ['./usoitems.component.css']
})

export class UsoitemsComponent implements OnInit {

   _modulos: any;
   filtro: string;
   _usoitems: any;
   rtn: number;
   desrub: any;  //Descripcion del Rubro enviado como mensaje a eliminar
   idmodulo: number;  //Módulo seleccionado (cuando inicia o regresa)
   titPDF = "LISTA DE USOS (de los productos)"

   constructor(private router: Router, private moduService: ModulosService,
      private usoiService: UsoitemsService) { }

   ngOnInit(): void {
      this.listarModulos();
      this.listarUsoitems()
   }

   listarModulos() {
      this.moduService.getListaModulos().subscribe({
         next: datos => this._modulos = datos,
         error: err => console.error(err.error)
      })
   }

   listarUsoitems() {
      let selectmodulo = document.getElementById("selectmodulo") as HTMLSelectElement;
      setTimeout(() => {
         this.idmodulo = +sessionStorage.getItem("idmoduloToInit")!;
         if (this.idmodulo == 0 || this.idmodulo == null) { this.idmodulo = 3; }
         let opcion = document.getElementById("modulo" + this.idmodulo) as HTMLSelectElement;
         if (opcion != null) opcion.setAttribute('selected', '');
         this.usoiService.getByIdmodulo(+this.idmodulo!).subscribe({
            next: datos => this._usoitems = datos,
            error: err => console.error(err.error)
         })
      }, 500);

      selectmodulo.addEventListener("change", () => {
         this.idmodulo = +selectmodulo.value!;
         this.usoiService.getByIdmodulo(+selectmodulo.value!).subscribe({
            next: datos => this._usoitems = datos,
            error: err => console.error(err.error)
         })
      });
   }

   public addUsoitems() { sessionStorage.setItem('idmoduloToInit', this.idmodulo.toString()); }

   public infoUsoitem(usoitems: Usoitems) {
      sessionStorage.setItem('idmoduloToInit', this.idmodulo.toString());
      sessionStorage.setItem('idusoitemsToInfo', usoitems.idusoitems.toString());
      this.router.navigate(['info-usoitems']);
   }


   pdf() {
      let columns = ['Nombre', 'Edad', 'Email'];
      let data = [
         { Nombre: 'John Doe', Edad: 30, Email: 'johndoe@example.com' },
         { Nombre: 'Jane Smith', Edad: 25, Email: 'janesmith@example.com' },
         { Nombre: 'Bob Johnson', Edad: 35, Email: 'bobjohnson@example.com' }
      ];

      this.generatePDF(columns, data);
   }

   generatePDF(columns: string[], data: any[]) {

      let m_izquierda = 20;

      const doc = new jsPDF();
      const tableData: any = [];

      // ... Código para crear el PDF ...
      doc.setFont("times", "bold"); doc.setFontSize(16); doc.text("EpmapaT", m_izquierda, 10);
      doc.setFont("times new roman", "normal"); doc.setFontSize(12); doc.text(this.titPDF, m_izquierda, 17)

      // Agrega las columnas al arreglo de datos
      tableData.push(columns);

      // Agrega los datos al arreglo de datos
      data.forEach(item => {
         const rowData: any = [];
         columns.forEach(column => {
            rowData.push(item[column]);
         });
         tableData.push(rowData);
      });

      // Genera la tabla con Autotable
      autoTable(doc, {
         theme: 'grid',
         margin: { left: m_izquierda, top: 18, right: 20, bottom: 20 },
         columnStyles: {
            1: { // Columna 2 (Edad)
               halign: 'center', // alineación horizontal al centro
               fillColor: [0, 255, 0] // verde
            }
         },

         didParseCell: function (data) {
            // Modifica los estilos de la celda en la fila 1 y columna 2
            if (data.row.index === 1 && data.column.index === 2) {
               data.cell.styles.fontStyle = 'bold';
               data.cell.styles.textColor = [0, 0, 255]; // Color azul
            };
            if (data.row.index >= 0 && data.column.index === 1) {
               data.cell.styles.fontStyle = 'bold';
               data.cell.styles.halign = 'center';
               data.cell.styles.textColor = [0, 0, 255]; // Color azul
            };
            if (data.row.index === 2 && data.column.index === 2) {
               data.cell.styles.textColor = [255, 255, 255];
               data.cell.styles.fillColor = [255, 255, 255];
            };
            let a = +data.cell.text!
            if (a < 30) {
               data.cell.styles.textColor = [255, 0, 255];
               data.cell.styles.fontStyle = 'italic';
               data.cell.styles.fontSize = 25;
            };

         },

         head: [tableData[0]],

         body: tableData.slice(1),

      });

      const pdfData = doc.output('datauristring');
      let container: any;
      container = document.getElementById('pdf');
      const embed = document.createElement('embed');
      embed.setAttribute('src', pdfData);
      embed.setAttribute('type', 'application/pdf');
      embed.setAttribute('width', '65%');
      embed.setAttribute('height', '100%');
      container.appendChild(embed);

   }

}
