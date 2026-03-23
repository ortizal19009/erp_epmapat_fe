import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { CuentasService } from 'src/app/servicios/contabilidad/cuentas.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-impj-cuentas',
  templateUrl: './impj-cuentas.component.html',
  styleUrls: ['./impj-cuentas.component.css']
})
export class ImpjCuentasComponent implements OnInit {

   formImprimir!: FormGroup;
   swimprimir: boolean = true;
   repoxopcion: Repoxopcion[] = [];
   reportesjr: any;
   swbotones: boolean = false;
   swcalculando: boolean = false;
   txtcalculando = 'Calculando';
   blobArchivo: Blob | null = null;
   nombreArchivo: string = '';
   private reporteUrl: string | null = null; // URL temporal del Blob
   parametros: any[] = [];
   extension: string = 'pdf';
   swparametros: boolean = false;
   reporteSeleccionado: Reportesjr;
   cuentasToImpExp: any;
   codigo = '211';

   extensiones = [
      { icono: 'bi-file-earmark-pdf', nombre: '.pdf' },
      { icono: 'bi-file-earmark-spreadsheet', nombre: '.xlsx' },
      { icono: 'bi-file-text', nombre: '.csv' },
   ]

   constructor(public fb: FormBuilder, private router: Router, public authService: AutorizaService, private repojrService: ReportesjrService,
      private repoxopService: RepoxopcionService, private cueService: CuentasService) { }

   ngOnInit(): void {
      if (!this.authService.sessionlog) { this.router.navigate(['/inicio']); }
      sessionStorage.setItem('ventana', '/cuentas');
      let coloresJSON = sessionStorage.getItem('/cuentas');
      if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));

      const cuentasJSON = sessionStorage.getItem('cuentasToImpExp');
      if (cuentasJSON) {
         this.cuentasToImpExp = JSON.parse(cuentasJSON);
         // console.log('cuentasToImpExp: ', this.cuentasToImpExp)
         this.formImprimir = this.fb.group({
            repoxopcion: '',
            reportes: '',
            nomrep: '',
            desrep: '',
            nombrearchivo: ['', [Validators.required, Validators.minLength(3), Validators.pattern('^[a-zA-Z0-9_]+$')]],
            extension: '.pdf'
         });

         //Obtiene los reportes desde repoxopcion
         this.repoxopService.porCodigo(this.codigo).subscribe({
            next: (repoxopcion: Repoxopcion[]) => {
               this.repoxopcion = repoxopcion;
               this.formImprimir.patchValue({
                  repoxopcion: this.repoxopcion[0].idrepoxopcion,
               });
               //Obtiene los reportes Jasper de la primera opción
               const codreporte = `${this.codigo}01`;
               this.repojrService.obtenerPorCodigo(codreporte).subscribe({
                  next: (reportesjr: Reportesjr[]) => {
                     this.reportesjr = reportesjr;
                     if (this.reportesjr && this.reportesjr.length > 0) {
                        this.reporteSeleccionado = this.reportesjr[0];
                        this.formImprimir.patchValue({
                           repoxopcion: this.repoxopcion[0].idrepoxopcion,
                           reportes: this.reportesjr[0].idreporte,
                           nomrep: this.reportesjr[0].nomrep,
                           desrep: this.reportesjr[0].desrep
                        });
                        this.reporteSeleccionado = this.reportesjr[0];
                        this.verificaParametros()
                     }
                  },
                  error: err => { console.error(err.error); this.authService.mostrarError('Error Reportes', err.error) }
               });
            },
            error: err => { console.error(err.error); this.authService.mostrarError('Error Repoxopcion', err.error) }
         });
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

   changeRepoxopcion() {
      const idrepoxopcion = this.formImprimir.value.repoxopcion;
      const repoxop = this.repoxopcion.find((r: any) => r.idrepoxopcion === idrepoxopcion);
      const codigo = repoxop!.codigo
      this.repojrService.obtenerPorCodigo(codigo).subscribe({
         next: (reportesjr: Reportesjr[]) => {
            this.reportesjr = reportesjr;
            //OJO: Falta buscar el reporte actual del Usuario
            if (this.reportesjr.length > 0) {
               this.reporteSeleccionado = this.reportesjr[0];
               this.formImprimir.patchValue({
                  reportes: this.reportesjr[0].idreporte,
                  nomrep: this.reportesjr[0].nomrep,
                  desrep: this.reportesjr[0].desrep
               });
               this.reporteSeleccionado = this.reportesjr[0];
               this.verificaParametros();
            } else {
               this.authService.swal('warning', `No existen reportes para: ${repoxop!.nombre}`)
               this.formImprimir.patchValue({
                  nomrep: '',
                  desrep: '',
               });
               this.swparametros = false;
            }
         },
         error: err => {
            console.error(err.error); this.authService.mostrarError('Error Reportes', err.error)
         }
      });
   }

   changeReporte(repo: any) {
      this.reporteSeleccionado = repo;
      this.f['nomrep'].setValue(this.reporteSeleccionado.nomrep);
      this.f['desrep'].setValue(this.reporteSeleccionado.desrep);
      this.verificaParametros()
   }

   verificaParametros() {
      const raw = this.reporteSeleccionado.parametros;
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

      const fechaDesde = `${this.authService.anio.toString()}-01-01`
      // console.log('fechaDesde: ', fechaDesde)
      this.parametros.forEach((param) => {
         let valorInicial: any;
         const existe = Object.keys(this.cuentasToImpExp).find(k => k.toLowerCase() === param.nombre.toLowerCase());
         switch (param.tipo) {
            case 'java.lang.String':
               valorInicial = existe ? this.cuentasToImpExp[existe] ?? '' : '';
               break;
            case 'java.lang.Integer':
               valorInicial = existe ? this.cuentasToImpExp[existe] ?? 0 : 0;
               break;
            case 'java.util.Date':
               valorInicial = existe ? this.cuentasToImpExp[existe] ?? fechaDesde : fechaDesde;
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

   retornar() { this.router.navigate(['/cuentas']); }

   generaJasper() {
      if (this.reporteSeleccionado!.metodo == 1) this.generaJasperSQL()
      if (this.reporteSeleccionado!.metodo == 2) this.generaJasperBeans()
   }

   generaJasperSQL() {
      this.swbotones = true;
      this.swcalculando = true;
      const valores = this.formImprimir.value;
      // Arma los parámetros con nombre, tipo y valor
      const parametrosConTipo = this.parametros.map((p: any) => ({
         name: p.nombre,
         type: p.tipo,
         value: valores[p.nombre],
      }));
      // console.log('parametrosConTipo: ', parametrosConTipo);
      const dto: ReportRequest = {
         reportName: this.reporteSeleccionado.nomrep!,
         extension: this.extension,
         parameters: parametrosConTipo,
      };
      // console.log('dto: ', dto);
      this.repojrService.ejecutaReporteSQL(dto).subscribe({
         next: (data: Blob) => {
            this.swcalculando = false;
            this.tipoReporte(dto, data);
         },
         error: (err) => {
            console.error('Error al ejecutar reporte:', err);
            this.authService.mostrarError(`Error al generar el Reporte: ${this.reporteSeleccionado.nomrep}`, err)
         },
      });
   }

   // Genera el reporte con Colección de Beans
   generaJasperBeans() {
      this.swbotones = true;
      this.swcalculando = true;
      this.txtcalculando = 'Calculando';
      // Arma los parámetros con nombre, tipo y valor
      const valores = this.formImprimir.value;
      const parametrosConTipo: ReportParameterDTO[] = this.parametros.map((p: any) => ({
         name: p.nombre,
         type: p.tipo,
         value: valores[p.nombre],
      }));
      // Arma el DTO para la llamada al Backend
      const dto: ReportRequest = {
         reportName: this.reporteSeleccionado.nomrep!,
         extension: this.extension,
         parameters: parametrosConTipo,
      };
      this.cueService.generaReporteBeans(dto).subscribe({
         next: (data: Blob) => {
            this.swcalculando = false;
            this.tipoReporte(dto, data);
         },
         error: (error) => {
            console.error('Error al generar el reporte', error);
            this.authService.mostrarError(`Error al generar el reporte: ${this.reporteSeleccionado!.nomrep!}`, error);
         }
      });
   }

   tipoReporte(dto: ReportRequest, data: Blob) {
      switch (dto.extension) {
         case 'pdf': {
            const blob = new Blob([data], { type: 'application/pdf' });
            if (this.swimprimir) {
               this.reporteUrl = URL.createObjectURL(blob); // Guardar la URL temporal
            } else {
               this.blobArchivo = data;
               this.nombreArchivo = `${this.f['nombrearchivo'].value}.pdf`;
            }
            this.txtcalculando = this.swimprimir ? 'Mostrar' : 'Descargar';
            break;
         }
         case 'xlsx': {
            this.blobArchivo = data;
            this.nombreArchivo = `${this.f['nombrearchivo'].value}.xlsx`;
            this.txtcalculando = this.swimprimir ? 'Mostrar' : 'Descargar';
            break;
         }
         case 'csv': {
            this.blobArchivo = data;
            this.nombreArchivo = `${this.f['nombrearchivo'].value}.csv`;
            this.txtcalculando = this.swimprimir ? 'Mostrar' : 'Descargar';
            break;
         }
         default:
      }
   }

   // Muestra el reporte
   muestraReporte() {
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
         URL.revokeObjectURL(this.reporteUrl!);
         this.reporteUrl = null;
         this.swbotones = false;
      });

   }

   descargaArchivo() {
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
