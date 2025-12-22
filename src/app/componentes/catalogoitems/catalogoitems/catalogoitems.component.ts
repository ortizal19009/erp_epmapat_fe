import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Catalogoitems } from 'src/app/modelos/catalogoitems.model';
import { Modulos } from 'src/app/modelos/modulos.model';
import { CatalogoitemService } from 'src/app/servicios/catalogoitem.service';
import { ModulosService } from 'src/app/servicios/modulos.service';

@Component({
   selector: 'app-catalogoitems',
   templateUrl: './catalogoitems.component.html',
   styleUrls: ['./catalogoitems.component.css']
})

export class CatalogoitemsComponent implements OnInit {

   buscarForm: any;
   _modulos: any;
   _catalogoitems: any;
   filtro: string;
   idmodulo: number;
   rtn: number;
   desrub: any;

   constructor(public fb: FormBuilder, private router: Router, private catitemService: CatalogoitemService,
      private moduService: ModulosService) { }

   ngOnInit(): void {
      let idmodulo = sessionStorage.getItem("idmoduloCatFacturacion");
      if (idmodulo == null || idmodulo == '0') this.idmodulo = 3;
      else this.idmodulo = +idmodulo;

      let modulos: Modulos = new Modulos;
      this.buscarForm = this.fb.group({
         idmodulo: modulos,
         descripcion: '',
         filtro: ''
      });

      this.moduService.getListaModulos().subscribe({
         next: datos => this._modulos = datos,
         error: err => console.error(err.error)
      })

      setTimeout(() => {
         let opcModulo = document.getElementById(`idmodulo_` + this.idmodulo) as HTMLElement;
         if (opcModulo != null) {
            opcModulo.setAttribute("selected", "");
            this.buscar()
         };
      }, 500);

      let selectmodulo = document.getElementById("selectmodulo") as HTMLSelectElement;
      selectmodulo.addEventListener("change", () => {
         this.idmodulo = +selectmodulo.value!;
         if (this.idmodulo > 0) this.buscar();
         else this._catalogoitems = [];
      });
   }

   public buscar() {
      let idmodulo1: number; let idmodulo2: number;
      if (this.idmodulo == 0) {
         idmodulo1 = 0; idmodulo2 = 99999;
      } else {
         idmodulo1 = this.idmodulo; idmodulo2 = this.idmodulo;
      }
      let descripcion: String;
      if (this.buscarForm.value.descripcion == null) descripcion = '';
      else descripcion = this.buscarForm.value.descripcion.toLowerCase();
      this.catitemService.getProductos(idmodulo1, idmodulo2, descripcion).subscribe({
         next: datos => this._catalogoitems = datos,
         error: err => console.error(err.error)
      })
   }

   public infoCatalogoitem(catalogoitems: Catalogoitems) {
      sessionStorage.setItem('idmoduloCatFacturacion', this.idmodulo.toString());
      sessionStorage.setItem('idcatalogoitemsToInfo', catalogoitems.idcatalogoitems.toString());
      this.router.navigate(['info-catalogoitems']);
   }

   public addProducto() {
      sessionStorage.setItem('idmoduloCatFacturacion', this.idmodulo.toString());
      this.router.navigate(['/add-catalogoitems']);
   }

   openNewTab(url: string): void {
      // const newTab = window.open(url, '_blank');
      // newTab?.focus();

      const windowFeatures = 'menubar=no,toolbar=no,location=no,status=no,resizable=yes';
      window.open(url, '_blank', windowFeatures);
   }

   // Luego, dentro de tu función o evento:
   //  this.openNewTab('/nueva-pagina');

   public pdf1() {
      this.openNewTab('/rubros');
   }

   pdf() {
      let columns = ['NOMBRE', 'SECCIÓN', 'USO', 'RUBRO (planillas)'];
      let data = [
         { Nombre: 'John Doe', Edad: 30, Email: 'johndoe@example.com' },
         { Nombre: 'Jane Smith', Edad: 25, Email: 'janesmith@example.com' },
         { Nombre: 'Bob Johnson', Edad: 35, Email: 'bobjohnson@example.com' }
      ];

      //   this.generatePDF( columns, data);
      let m_izquierda = 10;

      // const tableData: any = [];

      let datos: any = [];
      let i = 0;
      this._catalogoitems.forEach(() => {
         datos.push([this._catalogoitems[i].descripcion,
         this._catalogoitems[i].idusoitems_usoitems.idmodulo_modulos.descripcion,
         this._catalogoitems[i].idusoitems_usoitems.descripcion,
         this._catalogoitems[i].idrubro_rubros.descripcion]);
         i++;
      });

      const columnStyles = {
         1: { // Índice de la columna (comienza en 0)
            columnWidth: 50 // Ancho de la columna en unidades (puede ser número o string con unidad de medida, como 'mm' o 'px')
         }
      };

      //Crea el PDF ...
      const doc = new jsPDF('landscape');
      doc.setFont("times", "bold"); doc.setFontSize(16); doc.text("EpmapaT", m_izquierda, 10);
      doc.setFont("times new roman", "normal"); doc.setFontSize(12); doc.text("LISTA DE PRODUCTOS", m_izquierda, 16)

      // tableData.push(columns);

      const columnWidths = [40, 60, 80, 100];

      var options = {
         columnStyles: {
            0: {
               cellWidth: 100, // Width of column 1
            },
            1: {
               cellWidth: 200, // Width of column 2
            },
            2: {
               cellWidth: 300, // Width of column 3
            },
         }
      };

      // var table = doc.autoTable(html, options);

      autoTable(doc, {
         theme: 'grid',
         margin: { left: m_izquierda - 1, top: 18, right: 5, bottom: 20 },
         head: [columns],
         body: datos,
         columnStyles: {
            0: { cellWidth: 60 }, // Ancho fijo de 50 mm para la primera columna
            1: { cellWidth: 40 }, // Ancho que se ajusta al contenido para la segunda columna
            2: { cellWidth: 70 }, // Ancho que se adapta al margen para la tercera columna
            3: { cellWidth: 110 },
         }

      });

      // const pdfData = doc.output('datauristring');
      // let container: any;
      // container = document.getElementById('pdf');
      // const embed = document.createElement('embed');
      // embed.setAttribute('src', pdfData);
      // embed.setAttribute('type', 'application/pdf');
      // embed.setAttribute('width', '65%');
      // embed.setAttribute('height', '100%');
      // container.appendChild(embed);

      //    const pdfDataUri = doc.output('datauristring');
      //    const newWindow = window.open('');
      //    newWindow?.document.write(`
      //    <html>
      //      <head>
      //        <title>PDF</title>
      //      </head>
      //      <body>
      //        <iframe src="${pdfDataUri}" width="100%" height="100%"></iframe>
      //      </body>
      //    </html>
      //  `);

      //  newWindow?.document.close();
      let titulo = "Prueba"
      doc.output('pdfobjectnewwindow', { filename: `${titulo}.pdf` });


   }


}
