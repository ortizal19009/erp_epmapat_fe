import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AutorizaService } from '@compartida/autoriza.service';
import { Repoxopcion } from '@modelos/administracion/repoxopcion.model';
import { ReportesjrService } from '@servicios/administracion/reportesjr.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-imp-reportejr',
  templateUrl: './imp-reportejr.component.html',
  styleUrls: ['./imp-reportejr.component.css']
})
export class ImpReportejrComponent implements OnInit {

   formImprimir!: FormGroup;
   swimprimir: boolean = true;
   opcreporte: number = 1;
   repoxopcion: Repoxopcion[] = [];
   swbotones: boolean = false;
   swcalculando: boolean = false;
   txtcalculando = 'Calculando';
   private reporteUrl: string | null = null; // URL temporal del Blob
   private blobArchivo: Blob | null = null;
   private nombreArchivo: string = '';
   parametros: any[] = [];
   extension: string = 'pdf';
   swparametros: boolean = false;
   reportejr!: any;  //No Reportesjr porque usa .jrxml
   nomrep!: string;
   extensiones = [
      { icono: 'bi-file-earmark-pdf', nombre: '.pdf' },
      { icono: 'bi-file-earmark-spreadsheet', nombre: '.xlsx' },
      { icono: 'bi-file-text', nombre: '.csv' },
   ]

   constructor(public fb: FormBuilder, private router: Router, public authService: AutorizaService, private repojrService: ReportesjrService) { }

   ngOnInit(): void {
      if (!this.authService.sessionlog) { this.router.navigate(['/inicio']); }
      sessionStorage.setItem('ventana', '/reportesjr');
      let coloresJSON = sessionStorage.getItem('/reportesjr');
      if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));

      const reportejrJSON = sessionStorage.getItem('reportejrToImpExp');
      if (reportejrJSON) {
         this.reportejr = JSON.parse(reportejrJSON);
         this.nomrep = this.reportejr.nomrep!;
         const jrxmlBase64 = this.reportejr.jrxml!;
         const xmlString = decodeBase64ToXml(jrxmlBase64);
         const nombreReporte = extractReportNameFromJrxml(xmlString);

         this.formImprimir = this.fb.group({
            opcion: this.reportejr.repoxopcion.opcion,
            nomopcion: this.reportejr.repoxopcion.nombre,
            metodo: nombreMetodo(this.reportejr.metodo),
            desrep: this.reportejr.desrep,
            jrxml: nombreReporte,
            nombrearchivo: ['', [Validators.required, Validators.minLength(3)]],
            extension: '.pdf',
         });
         this.verificaParametros()
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

   get f() { return this.formImprimir.controls; }

   verificaParametros() {
      const raw = this.reportejr?.parametros;
      this.swparametros = false;
      let parsed: any = {};
      if (raw) {
         try {
            parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
            this.swparametros = parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0;
            this.parametrosFormulario(parsed);
         } catch {
            this.swparametros = false;
         }
      }
   }

   parametrosFormulario(params: any): void {
      this.parametros = Object.entries(params)
         .map(([nombre, valor]) => {
            const [tipo, anchoCampoStr, ordenStr] = (valor as string).split('|');
            const anchoCampo = parseInt(anchoCampoStr, 10) || 12;
            const orden = parseInt(ordenStr, 10) || 999;
            return { nombre, tipo, anchoCampo, orden };
         })
         .sort((a, b) => a.orden - b.orden); // Ordena por 'orden'
      this.parametros.forEach((param) => {
         let valorInicial: any;
         switch (param.tipo) {
            case 'java.lang.String':
               valorInicial = '';
               break;
            case 'java.lang.Integer':
               valorInicial = 0;
               break;
            case 'java.util.Date':
               // valorInicial = convertirFechaISO('01/01/2025');
               break;
            case 'java.lang.Boolean':
               valorInicial = false;
               break;
            default:
               valorInicial = '';
         }
         this.formImprimir.addControl(param.nombre, new FormControl(valorInicial));
      });
   }

   seleccionarExtension(indice: number) {
      this.extension = this.extensiones[indice].nombre.substring(1);
      this.formImprimir.patchValue({
         extension: this.extensiones[indice].nombre
      })
   }

   impriexpor() {
      this.swimprimir = !this.swimprimir;
      this.swbotones = false;
      this.extension = 'pdf'
   }

   retornar() { this.router.navigate(['/reportesjr']); }

   generarJasper() {
      this.swbotones = true;
      const valores = this.formImprimir.value;
      // Arma los parámetros con nombre, tipo y valor
      const parametrosConTipo = this.parametros.map((p: any) => ({
         name: p.nombre,
         type: p.tipo,
         value: valores[p.nombre],
      }));

      const dto = {
         reportName: this.reportejr.nomrep,
         parameters: parametrosConTipo,
         extension: this.extension,
      };
      // console.log('dto: ', dto);
      this.repojrService.ejecutaReporteSQL(dto).subscribe({
         next: (data: Blob) => {
            switch (dto.extension) {
               case 'pdf': {
                  const blob = new Blob([data], { type: 'application/pdf' });
                  if (this.swimprimir) {
                     this.reporteUrl = URL.createObjectURL(blob); // Guardar la URL temporal
                  } else {
                     this.blobArchivo = data;
                     this.nombreArchivo = `${this.f['nombrearchivo'].value}.pdf`;
                  }
                  this.swcalculando = false;
                  this.txtcalculando = this.swimprimir ? 'Mostrar' : 'Descargar';
                  break;
               }
               case 'xlsx': {
                  const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                  this.blobArchivo = data;
                  this.nombreArchivo = `${this.f['nombrearchivo'].value}.xlsx`;
                  this.txtcalculando = this.swimprimir ? 'Mostrar' : 'Descargar';
                  break;
               }
               case 'csv': {
                  const blob = new Blob([data], { type: 'text/plain' });
                  this.blobArchivo = data;
                  this.nombreArchivo = `${this.f['nombrearchivo'].value}.csv`;
                  this.txtcalculando = this.swimprimir ? 'Mostrar' : 'Descargar';
                  break;
               }
               default:
            }
         },
         error: (err: any) => {
            console.error('Error al ejecutar reporte:', err.error);
            this.authService.mostrarError('Error al Generar el reporte: ', err);
         }
      });
   }

   // Muestra el reporte
   showReport() {
      if (!this.reporteUrl) {
         console.warn('Primero se debe generar el reporte.');
         return;
      }
      Swal.fire({
         title: 'Visor de Reportes',
         width: '90%',
         html: `<iframe src="${this.reporteUrl}" width="100%" height="560px" style="border:none;"></iframe>`,
         showCloseButton: true,
         showConfirmButton: false,
         allowOutsideClick: false,
         customClass: {
            popup: 'swaimprimir',
            title: 'swafantacyblack',
         }
      }).then(() => {
         // Liberar memoria si ya no se va a volver a mostrar
         URL.revokeObjectURL(this.reporteUrl!);
         this.reporteUrl = null;
         this.swbotones = false;
      });
   }

   // Descarga el archivo
   descargarArchivo() {
      if (this.blobArchivo && this.nombreArchivo) {
         const link = document.createElement('a');
         link.href = window.URL.createObjectURL(this.blobArchivo);
         link.download = this.nombreArchivo;
         link.click();
         window.URL.revokeObjectURL(link.href); // Limpia memoria
         this.swbotones = false;
      } else {
         Swal.fire({ title: 'Mensaje', text: 'No se ha generado el archivo', icon: 'warning' });
      }
   }

}

function decodeBase64ToXml(base64: string): string {
   const binary = atob(base64); // decodifica Base64 a string binario
   const bytes = new Uint8Array(binary.length);
   for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
   }
   const decoder = new TextDecoder('utf-8');
   return decoder.decode(bytes);
}

function extractReportNameFromJrxml(xmlString: string): string | null {
   const parser = new DOMParser();
   const doc = parser.parseFromString(xmlString, 'application/xml');
   const jasperReport = doc.getElementsByTagName('jasperReport')[0];
   return jasperReport?.getAttribute('name') ?? null;
}

function nombreMetodo(metodo: number): string {
  switch (metodo) {
    case 1:
      return '1. SQL Directo';
    case 2:
      return '2. Conjunto de Beans';
    case 3:
      return '3. Desde el Frontend';
    default:
      throw new Error(`Método no soportado: ${metodo}`);
  }
}
