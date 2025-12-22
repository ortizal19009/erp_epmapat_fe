import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Modulos } from 'src/app/modelos/modulos.model';
import { Rubros } from 'src/app/modelos/rubros.model';
import { PrintService } from 'src/app/compartida/print.service';
import { ModulosService } from 'src/app/servicios/modulos.service';
import { RubrosService } from 'src/app/servicios/rubros.service';

@Component({
   selector: 'app-rubros',
   templateUrl: './rubros.component.html',
   styleUrls: ['./rubros.component.css']
})

export class RubrosComponent implements OnInit {

   buscarForm: FormGroup;
   _modulos: any;
   filtro: string;
   _rubros: any;
   rtn: number;
   desrub: any;  //Descripcion del Rubro enviado como mensaje a eliminar
   idmodulo: number;  //Módulo seleccionado (cuando inicia o regresa)
   nomModulo: any;
   otraPagina: boolean = false;
   tsvData: any[] = [];

   constructor(private rubService: RubrosService, private router: Router,
      private fb: FormBuilder, private moduService: ModulosService, private printService: PrintService) { }

   ngOnInit(): void {
      let modulo: Modulos = new Modulos();
      this.buscarForm = this.fb.group({ idmodulo_modulos: modulo });

      this.listarModulos();
      this.listarRubros();
   }

   listarModulos() {
      this.moduService.getListaModulos().subscribe({
         next: datos => this._modulos = datos,
         error: err => console.error(err.error)
      })
   }

   listarRubros() {

      let selectmodulo = document.getElementById("selectmodulo") as HTMLSelectElement;
      setTimeout(() => {
         this.idmodulo = +sessionStorage.getItem("idmoduloToInit")!;
         if (this.idmodulo == 0 || this.idmodulo == null) {
            this.idmodulo = 3;
            this.nomModulo = "AGUA Y ALCANTARILLADO";
         }
         let opcion = document.getElementById("modulo" + this.idmodulo) as HTMLSelectElement;
         if (opcion != null) {
            opcion.setAttribute('selected', '');
            this.rubService.getByIdmodulo(+this.idmodulo!).subscribe({
               next: datos => this._rubros = datos,
               error: err => console.error(err.error)
            })
         }
      }, 500);

      selectmodulo.addEventListener("change", () => {
         this.idmodulo = +selectmodulo.value!;
         let ifModulo = {} as Modulo;
         this.moduService.getById(this.idmodulo).subscribe({
            next: resp => {
               // ifModulo = resp.descripcion;
               this.nomModulo = resp.descripcion;
               // this.nomModulo = ifModulo;
            },
            error: err => console.error(err.error)
         });

         this.rubService.getByIdmodulo(+selectmodulo.value!).subscribe({
            next: datos => this._rubros = datos,
            error: err => console.error(err.error)
         })
      });
   }

   public addRubro() { sessionStorage.setItem('idmoduloToInit', this.idmodulo.toString()); }

   public infoRubro(rubros: Rubros) {
      sessionStorage.setItem('idmoduloToInit', this.idmodulo.toString());
      sessionStorage.setItem('idrubroToInfo', rubros.idrubro.toString());
      this.router.navigate(['info-rubro']);
   }

   pdf() {
      let m_izquierda = 20;
      var doc = new jsPDF();
      doc.setFont("times", "bold"); doc.setFontSize(16); doc.text("EpmapaT", m_izquierda, 10);
      doc.setFont("times", "normal"); doc.setFontSize(12); doc.text("LISTA DE RUBROS", m_izquierda, 16)
      doc.setFont("times", "normal"); doc.setFontSize(12); doc.text("Sección: " + this.nomModulo, m_izquierda, 21)

      var datos: any = [];
      let calc: string; let swiva: String;
      var i = 0;
      this._rubros.forEach(() => {
         calc = 'No'
         if (this._rubros[i].calculable) calc = "Si"
         swiva = 'No'
         if (this._rubros[i].swiva) swiva = "Si"
         datos.push([i + 1, this._rubros[i].descripcion, this._rubros[i].valor.toFixed(2), calc, swiva]);
         i++;
      });

      let cabecera = ['', 'NOMBRE', "VALOR", "CALCULABLE", "IVA", 'Otra'];

      autoTable(doc, {
         theme: 'grid',
         headStyles: {fillColor: [95, 57, 95], fontStyle: 'bold', halign: 'center' },
         styles: { font: 'helvetica', fontSize: 9, cellPadding: 1, halign: 'center' },
         columnStyles: {
            0: { halign: 'center' },
            1: { halign: 'left' },
            2: { halign: 'right' },
            3: { halign: 'center' },
            4: { halign: 'center' }
         },

         margin: { left: m_izquierda - 1, top: 22, right: 20, bottom: 10 },

         didParseCell: function (HookData) {
            // Modifica los estilos de la celda en la fila 1 y columna 2
            // if (data.row.index === 1 && data.column.index === 2) {
            //    data.cell.styles.fontStyle = 'bold';
            //    data.cell.styles.textColor = [0, 0, 255]; // Color azul
            // };
            // if (data.row.index >= 0 && data.column.index === 1) {
            //    data.cell.styles.fontStyle = 'bold';
            //    data.cell.styles.halign = 'center';
            //    data.cell.styles.textColor = [0, 0, 255]; // Color azul
            // };
            // if (data.row.index === 2 && data.column.index === 2) {
            //    data.cell.styles.textColor = [255, 255, 255];
            //    data.cell.styles.fillColor = [255, 255, 255];
            // };

            // if (HookData.section === 'head') {
            //    HookData.cell.styles.fontStyle = 'bold';
            //    HookData.cell.styles.fillColor = [95, 57, 95];
            // };

            let valor = +HookData.cell.text!
            if (valor == 0) { HookData.cell.styles.textColor = [255, 255, 255];            };
            if (valor < 0) { HookData.cell.styles.textColor = [255, 0, 0];            };

            let x = HookData.cell.text.toString()
            if ((HookData.column.index === 3 || HookData.column.index === 4) && x == 'No') { HookData.cell.styles.textColor = [255, 255, 255]; };
         },
         head: [cabecera],
         body: datos,

      });

      var opciones = {
         filename: 'rubros.pdf',
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
         embed.setAttribute('width', '65%');
         embed.setAttribute('height', '100%');
         embed.setAttribute('id', 'idembed');
         //Agrega el <embed> al contenedor del Modal
         var container: any;
         container = document.getElementById('pdf');
         container.appendChild(embed);
      }
   }

}
interface Modulo { descripcion: String; }
