import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import * as ExcelJS from 'exceljs';
import { LecturasService } from 'src/app/servicios/lecturas.service';
import { RutasxemisionService } from 'src/app/servicios/rutasxemision.service';

@Component({
   selector: 'app-impor-lecturas',
   templateUrl: './impor-lecturas.component.html',
   styleUrls: ['./impor-lecturas.component.css']
})
export class ImporLecturasComponent implements OnInit {

   @ViewChild('archivoInput') archivoInputRef!: ElementRef<HTMLInputElement>;

   idrutaxemision: number; //Para obtener idrutaxemisionToLectura
   _rutaxemision: any;
   rutaxemision = {} as Rutaxemision;
   _lecturas: any;
   selectedFile: File | null;
   btnValidar: boolean = false;
   btnImportar: boolean = false;
   barraProgreso: boolean = false;
   importedData: any[][] = [];
   sumCargar: number;
   contador: number;
   public progreso = 0;

   constructor(private router: Router, private rutaxemiService: RutasxemisionService, private lecService: LecturasService) { }

   ngOnInit(): void {
      this.idrutaxemision = +sessionStorage.getItem("idrutaxemisionToLectura")!;
      this.rutaxemisionDatos(this.idrutaxemision);
      this.lecService.getLecturas(this.idrutaxemision).subscribe({
         next: resp => {
            this._lecturas = resp;
         },
         error: err => console.log(err.error)
      },);
   }

   rutaxemisionDatos(idrutaxemision: number) {
      this.rutaxemiService.getById(idrutaxemision).subscribe({
         next: datos => {
            this._rutaxemision = datos;
            this.rutaxemision.emision = datos.idemision_emisiones.emision;
            this.rutaxemision.ruta = datos.idruta_rutas.descripcion;
            this.rutaxemision.estado = datos.estado;
         },
         error: err => console.log(err.error)
      })
   }

   importExcel(fileInput: any) {
      //Renicializa
      this.importedData = [];
      this.btnImportar = false;

      const inputElement = fileInput.target as HTMLInputElement;

      if (inputElement.files && inputElement.files.length > 0) {
         const file = inputElement.files[0];
         this.selectedFile = file;
      } else {
         this.selectedFile = null;
      }

      const fileReader = new FileReader();
      fileReader.onload = (e: any) => {
         const arrayBuffer = e.target.result;
         const workbook = new ExcelJS.Workbook();

         workbook.xlsx.load(arrayBuffer).then(() => {
            const worksheet = workbook.getWorksheet(1);
            worksheet.eachRow((row, rowNumber) => {
               const rowData: any[] = [];
               row.eachCell((cell, colNumber) => {
                  rowData.push(cell.value);
               });
               if (rowNumber > 1) {
                  this.importedData.push(rowData);
                  this.btnValidar = true;
               };
            });
            this.totalCargar();
         });
      };
      fileReader.readAsArrayBuffer(fileInput.target.files[0]);
   }

   totalCargar() {
      let suma: number = 0;
      let i = 0;
      this.importedData.forEach(() => {
         suma += this.importedData[i][5];
         i++;
      });
      this.sumCargar = suma;
   }

   validar() {
      if (this.archivoInputRef) this.archivoInputRef.nativeElement.value = ''; // Restablecer el valor del input de archivo
      let hayInvalidos = false;
      let busca: number;
      for (let i = 0; i < this.importedData.length; i++) {
         busca = +this.importedData[i][0];
         let result = this._lecturas.find((lectura: { idabonado_abonados: { idabonado: number; }; }) => lectura.idabonado_abonados.idabonado === busca);
         if (result) {
            // if (this.importedData[i][4] <= 0 || this.importedData[i][5] < 0 ) {
            //    this.importedData[i][11] = 0
            //    hayInvalidos = true;
            // }
            // else
             {
               this.importedData[i][11] = 1;
               this.importedData[i][12] = result.idlectura
            };
         } else {

            this.importedData[i][11] = 0;
            hayInvalidos = true;
         }
      }
      if (hayInvalidos) {
         this.btnImportar = false;
      } else {
         this.btnImportar = true;
      }
   }

   cargar() {
      this.btnValidar = false;
      this.btnImportar = false;
      this.barraProgreso = true;
      this.contador = 0;
      this.actualizar();
   }

   actualizar() {
      let idlectura: number;
      idlectura = this.importedData[this.contador][12];
      // console.log('idlectura: ', idlectura)
      this.lecService.getByIdlectura(idlectura).subscribe({
         next: resp => {
            this.contador++;
            this.progreso = (this.contador / this.importedData.length) * 100;
            resp.lecturaanterior = this.importedData[this.contador - 1][3];
            resp.lecturaactual = this.importedData[this.contador - 1][4];
            this.lecService.updateLectura(idlectura, resp).subscribe({
               next: nex => '',
               error: err => console.error(err.error)
            });
            if (this.contador < this.importedData.length) {
               this.actualizar();
            } else {
               this.regresar();
            }
         },
         error: err => {
            console.error(err.error);
            this.contador = this.importedData.length;
         }
      },);
   }

   regresar() { this.router.navigate(['/lecturas']); }

}

interface Rutaxemision {
   emision: String;
   ruta: String;
   estado: number;
}
