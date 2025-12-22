import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { Categoria } from 'src/app/modelos/categoria.model';
import { Preciosxcat } from 'src/app/modelos/preciosxcat.model';
import { CategoriaService } from 'src/app/servicios/categoria.service';
import { PreciosxcatService } from 'src/app/servicios/preciosxcat.service';

@Component({
   selector: 'app-preciosxcat',
   templateUrl: './preciosxcat.component.html',
   styleUrls: ['./preciosxcat.component.css']
})

export class PreciosxcatComponent implements OnInit {

   @ViewChild('labelElement') labelElement: ElementRef<HTMLInputElement>;

   _preciosxcat: any;
   buscarForm: FormGroup;
   categoria: any
   filterTerm: string;
   otraPagina: boolean = false;
   nomCategoria: String = 'RESI';
   //Para Importar
   _tsvData: any[] = [];
   swfile: Boolean = false;
   swvalido: Boolean;

   constructor(private prexcatService: PreciosxcatService, private router: Router,
      private fb: FormBuilder, private cateService: CategoriaService, private authService: AutorizaService) { }

   ngOnInit(): void {
      let categoria: Categoria = new Categoria();
      categoria.idcategoria = 1;

      this.buscarForm = this.fb.group({
         idcategoria_categorias: categoria,
         dm3: 0,
         hm3: 50,
      });

      this.listarCategorias();
      this.alerta();
      this.cateDefault();
   }

   onSubmit() { }

   cateDefault() {
      setTimeout(() => {
         let o_categorias = document.getElementById("idc1") as HTMLElement;
         if (o_categorias != null) o_categorias.setAttribute('selected', '');
      }, 200);
      this.buscarPrecio()
   }

   listarCategorias() {
      this.cateService.getListCategoria().subscribe({
         next: datos => this.categoria = datos,
         error: err => console.error(err.error)
      })
   }

   modificarPrecioxCat(precioxcat: Preciosxcat) {
      localStorage.setItem("idprecioxcat", precioxcat.idprecioxcat.toString())
      this.router.navigate(["/modificar-preciosxcat"]);
   }

   buscarPrecio() {
      let dm3 = this.buscarForm.value.dm3;
      let hm3 = this.buscarForm.value.hm3;
      let idcat = this.buscarForm.value.idcategoria_categorias.idcategoria;
      let dm = document.getElementById("dm3") as HTMLInputElement;
      let hm = document.getElementById("hm3") as HTMLInputElement;
      let s_categorias = document.getElementById("idcategoria_categorias") as HTMLSelectElement;
      if (idcat === null || dm3 < 0 || hm3 < 0) {
         dm.style.border = "#F54500 1px solid";
         hm.style.border = "#F54500 1px solid";
         s_categorias.style.border = "#F54500 1px solid";
      } else if (idcat != null && dm3 != null && hm3 != null) {
         if ((+dm.value!) > (+hm.value!)) {
            dm.style.border = "#F54500 1px solid";
            hm.style.border = "#F54500 1px solid";
         } else {
            dm.style.border = "";
            hm.style.border = "";
            s_categorias.style.border = "";
            this.prexcatService.getPrecioxCatQuery(idcat, dm3, hm3).subscribe(datos => {
               this._preciosxcat = datos;
            }, error => console.error(error));
         }
      }
   }

   retornarListaPrecioxCat() {
      this.router.navigate(["/preciosxcat"]);
   }

   eliminarPrecioxCat(idprecioxcat: number) {
      localStorage.setItem("idprecioxcatToDelete", idprecioxcat.toString());
   }

   aprobarEliminacionPrexCat() {
      let idprecioxcat = localStorage.getItem("idprecioxcatToDelete");
      this.prexcatService.deletePrecioxCat(+idprecioxcat!).subscribe(datos => {
         localStorage.setItem("mensajeSuccess", "Precio eliminado")
      }, error => console.error(error));
      localStorage.removeItem("idprecioxcatToDelete");
   }

   alerta() {
      let mensaje = localStorage.getItem("mensajeSuccess");
      if (mensaje != null) {
         const divAlerta = document.getElementById("alertaPrecioxCat");
         const alerta = document.createElement("div") as HTMLElement;
         divAlerta?.appendChild(alerta);
         alerta.innerHTML = "<div class='alert alert-success' role='alert'><strong>EXITO!</strong> <br/>" + mensaje + ".</div>";
         setTimeout(function () {
            divAlerta?.removeChild(alerta);
            localStorage.removeItem("mensajeSuccess");
         }, 2000);
      }
      localStorage.removeItem("mensajeSuccess");
   }

   public info(idprecioxcat: number) {
      sessionStorage.setItem('idprecioxcatToInfo', idprecioxcat.toString());
      this.router.navigate(['info-preciosxcat']);
   }

   pdf() {
      let m_izquierda = 20;
      var doc = new jsPDF();
      doc.setFont("times", "bold"); doc.setFontSize(16); doc.text("EpmapaT", m_izquierda, 10);
      doc.setFont("times", "normal"); doc.setFontSize(12); doc.text("TARIFAS", m_izquierda, 16)
      doc.setFont("times", "normal"); doc.setFontSize(12); doc.text("Categoría: " + this.nomCategoria, m_izquierda, 21)

      var datos: any = [];
      let calc: string; let swiva: String;
      var i = 0;
      this._preciosxcat.forEach(() => {
         datos.push([this._preciosxcat[i].m3, this._preciosxcat[i].preciobase.toFixed(2), this._preciosxcat[i].precioadicional.toFixed(2)]);
         i++;
      });

      let cabecera = ['Mts.Cúbicos', "PRECIO BASE", "CONSUMO AGUA"];

      autoTable(doc, {
         theme: 'grid',
         headStyles: { fillColor: [74, 87, 74], fontStyle: 'bold', halign: 'center' },
         styles: { font: 'helvetica', fontSize: 9, cellPadding: 1, halign: 'center' },
         columnStyles: {
            0: { halign: 'center' },
            1: { halign: 'center' },
            2: { halign: 'center' }
         },

         margin: { left: m_izquierda - 1, top: 23, right: 20, bottom: 10 },
         head: [cabecera],
         body: datos,

      });

      var opciones = {
         filename: 'tarifas.pdf',
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

   importar() {
      this.labelElement.nativeElement.innerText = 'Seleccionar';
      this._tsvData = [];
   }

   onFileChange(event: any) {
      const file = event.target.files[0];
      this.labelElement.nativeElement.innerText = file.name;
      const reader = new FileReader();

      reader.onload = () => {
         const text = reader.result as string;
         this._tsvData = this.extractData(text);
      };
      reader.readAsText(file);
   }

   private extractData(text: string): any[] {
      const lines = text.split('\n');
      const data: any[] = [];
      console.log("lines= " + lines);
      for (let i = 0; i < lines.length; i++) {
         const line = lines[i];
         const values = line.split('\t');

         if (values.length > 1) {
            this.swfile = true;
            const record: any = {};
            record.m3 = values[0].trim();
            record.preciobase = parseFloat(values[1].trim());
            record.precioadicional = parseFloat(values[2].trim());
            record.idcategoria = parseInt(values[3].trim());
            record.valido = null;
            data.push(record);
         }
      }
      return data;
   }

   validar() {
      this.swvalido = true;
      for (let i = 0; i < this._tsvData.length; i++) {
         if (this._tsvData[i].idcategoria === 1) this._tsvData[i].valido = true;
         else {
            this.swvalido = false;
            this._tsvData[i].valido = false
         };
      }
   }

   cargar() {
      let i = 0;
      this._tsvData.forEach(() => {
         let tarifa = {} as Tarifa; //Interface para los datos de las Tarifas a Importar
         tarifa.m3 = +this._tsvData[i].m3!;
         let numero: number = parseFloat(this._tsvData[i].preciobase);
         tarifa.preciobase = parseFloat(numero.toFixed(2));
         numero = parseFloat(this._tsvData[i].precioadicional);
         tarifa.precioadicional = parseFloat(numero.toFixed(2));
         this.cateService.getById(+this._tsvData[i].idcategoria!).subscribe({   //El elemento 3 es el Id de la Categoría
            next: resp => {
               tarifa.idcategoria_categorias = resp;
               tarifa.feccrea = new Date();
               tarifa.usucrea =  this.authService.idusuario;
               this.prexcatService.savePreciosxCat(tarifa).subscribe({
                  next: resp1 => {
                     console.log("Ok!");
                  },
                  error: err => console.error(err.error)
               });
            },
            error: err => console.error(err.error)
         });
         i++;
      });
   }

}

//Interface para Importar
interface Tarifa {
   idprecioxcat: number;
   m3: number;
   preciobase: number;
   precioadicional: number;
   idcategoria_categorias: Categoria;
   usucrea: number;
   feccrea: Date;
   usumodi: number;
   fecmodi: Date;
}
