import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-imp-partixcerti',
  templateUrl: './imp-partixcerti.component.html',
  styleUrls: ['./imp-partixcerti.component.css']
})
export class ImpPartixcertiComponent implements OnInit {

   formImprimir!: FormGroup;
   swimprimir: boolean = true;
   opcreporte: number = 1;
   repoxopcion: Repoxopcion[] = [];
   reportesjr: Reportesjr[] = [];
   swbotones: boolean = false;
   swcalculando: boolean = false;
   txtcalculando = 'Calculando';
   blobArchivo: Blob | null = null;
   nombreArchivo: string = '';
   codigo = '23311'; //Código de repoxopcion de partixcerti

   pdfViwer: boolean = false;
   private reporteUrl: string | null = null; // URL temporal del Blob

   parametros: any[] = [];
   extension: string = 'pdf';
   swVerReporte?: boolean;
   swparametros: boolean = false;

   reportes: Reportesjr = {};
   reporteSeleccionado?: any;
   partixcertiToImpExp: any;

   extensiones = [
      { icono: 'bi-file-earmark-pdf', nombre: '.pdf' },
      { icono: 'bi-file-earmark-spreadsheet', nombre: '.xlsx' },
      { icono: 'bi-file-text', nombre: '.csv' },
   ]

   constructor(public fb: FormBuilder, private router: Router, public authService: AutorizaService, private repojrService: ReportesjrService,
      private repoxopService: RepoxopcionService) { }

   ngOnInit(): void {
      if (!this.authService.sessionlog) { this.router.navigate(['/inicio']); }
      sessionStorage.setItem('ventana', '/partixcerti');
      let coloresJSON = sessionStorage.getItem('/partixcerti');
      if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));

      const partixcertiToImpExp = sessionStorage.getItem('partixcertiToImpExp');
      if (partixcertiToImpExp) {
         this.partixcertiToImpExp = partixcertiToImpExp;
         const patron = '^[a-zA-Z0-9_]+$';
         this.formImprimir = this.fb.group({
            repoxopcion: '',
            reportes: this.reportes,
            nomrep: '',
            desrep: '',
            nombrearchivo: ['', [Validators.required, Validators.minLength(3), Validators.pattern('^[a-zA-Z0-9_]+$')]],
            extension: '.pdf',
         });

         //Obtiene los reportes (repoxopcion) de partixcerti
         this.repoxopService.porCodigo(this.codigo).subscribe({
            next: (datos: Repoxopcion[]) => {
               this.repoxopcion = datos;
               // console.log('this.repoxopcion: ', this.repoxopcion)
               if (this.repoxopcion.length > 0) {
                  this.formImprimir.patchValue({ repoxopcion: this.repoxopcion[0].idrepoxopcion });
                  //Obtiene los reportes Jasper de la primera opción
                  this.repojrService.obtenerPorCodigo(this.codigo + '01').subscribe({
                     next: datos => {
                        this.reportesjr = datos;
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
                     error: err => {
                        console.error(err.error); this.authService.mostrarError('Error Reportes', err.error)
                     }
                  });
               }
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
      const repo = this.repoxopcion.find((r: any) => r.idrepoxopcion === idrepoxopcion);
      const codigo = repo!.codigo
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
               this.swparametros = true;
               if (Object.keys(this.reportesjr[0].parametros!).length === 0) this.swparametros = false;
               else this.parametrosFormulario(this.reportesjr[0].parametros);
            } else {
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
      const raw = this.reporteSeleccionado?.parametros;
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
         const existe = Object.keys(this.partixcertiToImpExp).find(k => k.toLowerCase() === param.nombre.toLowerCase());
         switch (param.tipo) {
            case 'java.lang.String':
               valorInicial = existe ? this.partixcertiToImpExp[existe] ?? '' : '';
               break;
            case 'java.lang.Integer':
               // console.log('this.certi:', this.certi)
               // if (param.nombre == 'Desde') valorInicial = this.proy.desdeNum || 0;
               // else if (param.nombre == 'Hasta') valorInicial = this.proy.hastaNum || 0;
               // else valorInicial = 0;
               valorInicial = this.partixcertiToImpExp;
               break;
            case 'java.util.Date':
               // console.log('this.certi.desdeFecha: ', this.certi.desdeFecha)
               // if (param.nombre == 'DesdeFecha') valorInicial = this.proy.desdeFecha;
               // if (param.nombre == 'HastaFecha') valorInicial = this.proy.hastaFecha;
               // else valorInicial = convertirFechaDefecto('01/01/2025');
               break;
            case 'java.lang.Boolean':
               // valorInicial = false;
               break;
            default:
               valorInicial = '';
         }
         this.formImprimir.addControl(param.nombre, new FormControl(valorInicial));
      });
   }

   // //Añade los parámetros al Formulario (primero los ordena en al backend no se pudo)
   // parametrosFormularioOld(params: any): void {
   //    this.parametros = Object.entries(params)
   //       .map(([nombre, valor]) => {
   //          const [tipo, anchoCampoStr, ordenStr] = (valor as string).split('|');
   //          const anchoCampo = parseInt(anchoCampoStr, 10) || 12;
   //          const orden = parseInt(ordenStr, 10) || 999;
   //          return { nombre, tipo, anchoCampo, orden };
   //       })
   //       .sort((a, b) => a.orden - b.orden); // Ordena por 'orden'

   //    // console.log('this.parametros: ', this.parametros);
   //    this.parametros.forEach((param) => {
   //       // console.log('param: ', param);
   //       let valorInicial: any;
   //       switch (param.tipo) {
   //          case 'java.lang.String':
   //             if (param.nombre == 'Codigo') valorInicial = this.partixcertiToImpExp.codigo || '';
   //             else if (param.nombre == 'Nombre') valorInicial = this.partixcertiToImpExp.nombre || '';
   //             else valorInicial = '';
   //             // valorInicial = '';
   //             break;
   //          case 'java.lang.Integer':
   //             // console.log('this.certi:', this.certi)
   //             // if (param.nombre == 'Desde') valorInicial = this.proy.desdeNum || 0;
   //             // else if (param.nombre == 'Hasta') valorInicial = this.proy.hastaNum || 0;
   //             // else valorInicial = 0;
   //             break;
   //          case 'java.util.Date':
   //             // console.log('this.certi.desdeFecha: ', this.certi.desdeFecha)
   //             // if (param.nombre == 'DesdeFecha') valorInicial = this.proy.desdeFecha;
   //             // if (param.nombre == 'HastaFecha') valorInicial = this.proy.hastaFecha;
   //             // else valorInicial = convertirFechaDefecto('01/01/2025');
   //             break;
   //          case 'java.lang.Boolean':
   //             valorInicial = false;
   //             break;
   //          default:
   //             valorInicial = '';
   //       }
   //       this.formImprimir.addControl(param.nombre, new FormControl(valorInicial));
   //    });
   // }

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

   retornar() { this.router.navigate(['/partixcerti']); }

   generarJasper() {
      this.swbotones = true;
      const valores = this.formImprimir.value;
      // Arma los parámetros con nombre, tipo y valor
      const parametrosConTipo = this.parametros.map((p: any) => ({
         name: p.nombre,
         type: p.tipo,
         value: valores[p.nombre],
      }));
      // console.log('parametrosConTipo: ', parametrosConTipo);
      const dto = {
         reportName: this.reporteSeleccionado.nomrep,
         parameters: parametrosConTipo,
         extension: this.extension,
      };
      // console.log('dto: ', dto);
      this.repojrService.ejecutaReporteSQL(dto).subscribe({
         next: (data: Blob) => {
            console.log('data: ', data)
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
         error: (err) => console.error('Error al ejecutar reporte:', err),
      });
   }

   // generarJasperOld() {
   //    this.swbotones = true;
   //    const valores = this.formImprimir.value;

   //    // Arma los parámetros con nombre, tipo y valor
   //    const parametrosConTipo = this.parametros.map((p: any) => ({
   //       name: p.nombre,
   //       type: p.tipo,
   //       value: valores[p.nombre],
   //    }));

   //    const dto = {
   //       reportName: this.reporteSeleccionado.nomrep,
   //       parameters: parametrosConTipo,
   //       extension: this.extension,
   //    };
   //    // console.log('dto: ', dto);
   //    this.repojrService.ejecutaReporteSQL(dto).subscribe({
   //       next: (data: Blob) => {
   //          let tipo = 'application/pdf';
   //          if (dto.extension === 'xlsx') { tipo = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'; }
   //          if (dto.extension === 'csv') { tipo = 'text/plain'; }

   //          const blob = new Blob([data], { type: tipo });
   //          this.reporteUrl = URL.createObjectURL(blob); // Guardar la URL temporal
   //          this.swcalculando = false;
   //          this.txtcalculando = this.swimprimir ? 'Mostrar' : 'Descargar';

   //       },
   //       error: (err) => console.error('Error al ejecutar reporte:', err),
   //    });
   // }

   // Muestra el reporte en el Visor de reportes
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

   // convertirFechaISO(valor: any): string | null {
   //    if (!valor) return null;
   //    const fecha = new Date(valor);
   //    if (isNaN(fecha.getTime())) return null;
   //    return fecha.toISOString().substring(0, 10); // formato yyyy-MM-dd
   // }

}
