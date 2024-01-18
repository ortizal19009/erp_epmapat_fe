import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import * as ExcelJS from 'exceljs';
import { Observable, forkJoin } from 'rxjs';
import { InteresesService } from 'src/app/servicios/intereses.service';

@Component({
   selector: 'app-impor-intereses',
   templateUrl: './impor-intereses.component.html',
   styleUrls: ['./impor-intereses.component.css']
})

export class ImporInteresesComponent implements OnInit {

   selectedFile: File | null;
   btnValidar: boolean = false;
   btnImportar: boolean = false;
   importedData: any[][] = []; // Declarar la matriz de dos dimensiones

   constructor(public router: Router, private inteService: InteresesService) { }

   ngOnInit(): void {
   }

   onFileChange(event: Event) {
      const inputElement = event.target as HTMLInputElement;
      if (inputElement.files && inputElement.files.length > 0) {
         const file = inputElement.files[0];
         this.selectedFile = file;
      } else {
         this.selectedFile = null;
      }
   }

   importExcel(fileInput: any) {
      //Renicializa
      this.importedData = [];
      this.btnImportar = false;

      const inputElement = fileInput.target as HTMLInputElement;
      console.log("inputElement: ", inputElement)
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
         });
      };
      fileReader.readAsArrayBuffer(fileInput.target.files[0]);
   }

   validar() {
      const observables: Observable<any>[] = [];
      let hayRegistros = false;

      let anio: number;
      let mes: number;
      for (let i = 0; i < this.importedData.length; i++) {
         anio = +this.importedData[i][0];
         mes = +this.importedData[i][1];
         if (anio > 2020 && mes >= 1 && mes <= 12) {
            const observable: Observable<any> = this.inteService.getByAnioMes(anio, mes);
            observables.push(observable);
         }
      }

      forkJoin(observables).subscribe({
         next: resp => {
            for (let i = 0; i < resp.length; i++) {
               const resultado = resp[i];
               if (resultado && resultado.length > 0) {
                  this.importedData[i][3] = 0;
                  hayRegistros = true;
               } else this.importedData[i][3] = 1;
            }

            if (hayRegistros) {
               this.btnImportar = false;
            } else {
               this.btnImportar = true;
            }
         },
         error: err => console.error(err.error)
      });
   }

   importar() {
      const fechaHora = new Date();
      const data = { fechaHora: fechaHora.toISOString() };
      for (let i = 0; i < this.importedData.length; i++) {
         let interes = {} as Intereses;
         interes.anio = this.importedData[i][0];
         interes.mes = this.importedData[i][1];
         interes.porcentaje = this.importedData[i][2];
         interes.usucrea = 1
         interes.feccrea = fechaHora;
         this.inteService.saveIntereses(interes).subscribe({
            next: datos => {
               this.regresar();
            },
            error: err => console.log(err.error),
         });
      }
   }

   regresar() { this.router.navigate(['/intereses']); }

}

interface Intereses {
   idinteres: number;
   anio: number;
   mes: number;
   porcentaje: number;
   usucrea: number;
   feccrea: Date;
   usumodi: number;
   fecmodi: Date;
}
