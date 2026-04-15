import { Component, OnInit } from '@angular/core';
import { AbstractControl, AsyncValidatorFn, FormArray, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AutorizaService } from '@compartida/autoriza.service';
import { ColoresService } from '@compartida/colores.service';
import { Documentos } from '@modelos/administracion/documentos.model';
import { Asientos } from '@modelos/contabilidad/asientos.model';
import { Cuentas } from '@modelos/contabilidad/cuentas.model';
import { Ejecucio } from '@modelos/contabilidad/ejecucio.model';
import { Tramipresu } from '@modelos/contabilidad/tramipresu.model';
import { Transaci } from '@modelos/contabilidad/transaci.model';
import { DocumentosService } from '@servicios/administracion/documentos.service';
import { AsientosService } from '@servicios/contabilidad/asientos.service';
import { CuentasService } from '@servicios/contabilidad/cuentas.service';
import { EjecucionService } from '@servicios/contabilidad/ejecucio.service';
import { TramipresuService } from '@servicios/contabilidad/tramipresu.service';
import { TransaciService } from '@servicios/contabilidad/transaci.service';
import { map, Observable } from 'rxjs';
import { EjecucioCreateDTO, EjecucioVM } from 'src/app/dtos/contabilidad/ejecucio.dto';
import { TransaciCreateDTO } from 'src/app/dtos/contabilidad/transaci.dto';

@Component({
  selector: 'app-add-trandecomprom',
  templateUrl: './add-trandecomprom.component.html',
  styleUrls: ['./add-trandecomprom.component.css']
})
export class AddTrandecompromComponent implements OnInit {

   idasiento!: number;
   formAsiento!: FormGroup;
   formTransaci!: FormGroup;
   formDevengar!: FormGroup;
   asiento: Asientos;
   documentos: Documentos[] = [];
   compromisos: Ejecucio[] = [];
   suma!: number;
   swvarias: boolean = false;
   filactual!: number;
   cuentasAsociadas: (Cuentas[] | null)[] = [];
   cuentaSeleccionada: (Cuentas | null)[] = [];
   idtrami!: number | null;
   hover: boolean = false;
   swbenediferente = false;
   swfechamayor = false;
   totales: { totalValor: number; totalSaldo: number; totalDevengar: number } = { totalValor: 0, totalSaldo: 0, totalDevengar: 0 };
   devengados: EjecucioVM[] = [];
   totDevengado: number = 0;

   constructor(private asiService: AsientosService, private router: Router, public authService: AutorizaService,
      private fb: FormBuilder, private cueService: CuentasService, private tranService: TransaciService, private docuService: DocumentosService,
      private ejecuService: EjecucionService, private tramiService: TramipresuService, private coloresService: ColoresService) { }

   ngOnInit(): void {
      sessionStorage.setItem('ventana', '/transaci');
      let coloresJSON = sessionStorage.getItem('/transaci');
      if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));
      else this.buscaColor();

      const datosToAddtransaci = JSON.parse(sessionStorage.getItem("datosToAddtransaci")!);
      this.idasiento = datosToAddtransaci.idasiento;

      this.formAsiento = this.fb.group({
         numero: '',
         comprobante: '',
         fecha: '',
         documentonum: '',
         beneficiario: '',
      })

      this.formTransaci = this.fb.group({
         orden: [+datosToAddtransaci.orden, [Validators.required, Validators.min(1)]],
         valor: ['', Validators.required],
         intdoc: null,
         numdoc: ['', Validators.required],
         descri: '',
         numero: ['', [Validators.required, Validators.min(1)], this.valNumero()],
         fectramite: '',
         nomben: ''
      },
         // { updateOn: "blur" } Sin blur Porque busca inmediatamente al cambiar el valor (OJO: Preferible subscripcion)
      );

      this.datosAsiento();
      this.listarDocumentos();

      this.formDevengar = this.fb.group({ devengar: this.fb.array([]) });
   }

   async buscaColor() {
      try {
         const datos = await this.coloresService.setcolor(this.authService.idusuario!, 'transaci');
         const coloresJSON = JSON.stringify(datos);
         sessionStorage.setItem('/transaci', coloresJSON);
         this.colocaColor(datos);
      } catch (error) {
         console.error(error);
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

   datosAsiento() {
      this.asiService.unAsiento(this.idasiento).subscribe({
         next: (asiento: Asientos) => {
            this.asiento = asiento;
            let documentonum: String;
            if (asiento.intdoc.intdoc == 1) documentonum = asiento.numdoc;
            else documentonum = asiento.intdoc.nomdoc + ' ' + asiento.numdoc;
            this.formAsiento.patchValue({
               numero: asiento.asiento,
               comprobante: this.authService.comprobante(asiento.tipcom, asiento.compro),
               fecha: asiento.fecha,
               documentonum: documentonum,
               beneficiario: asiento.idbene.nomben,
            });
            this.formTransaci.patchValue({
               intdoc: asiento.intdoc.intdoc,
               numdoc: asiento.numdoc,
               descri: asiento.glosa,
            });
         },
         error: err => { console.error(err.error); this.authService.mostrarError('Error al buscar el Asiento', err.error) }
      });
   }

   listarDocumentos() {
      this.docuService.getListaDocumentos().subscribe({
         next: (documentos: Documentos[]) => this.documentos = documentos,
         error: (err) => console.error(err.error)
      });
   }

   get f() { return this.formTransaci.controls; }

   buscaTramite() {
      const numero = this.formTransaci.get('numero')?.value;
      if (numero > 0 && !this.formTransaci.get('numero')?.hasError('existe')) {
         this.tramiService.buscaPorNumero(numero).subscribe({
            next: (tramite: Tramipresu | null) => {
               if (tramite) {
                  this.swfechamayor = false;
                  if (tramite.fecha > this.asiento.fecha) this.swfechamayor = true;
                  this.swbenediferente = false;
                  if (tramite.idbene.idbene != this.asiento.idbene.idbene) this.swbenediferente = true;
                  this.formTransaci.patchValue({
                     nomben: tramite.idbene.nomben,
                     fectramite: tramite.fecha
                  });
                  this.idtrami = tramite.idtrami;
                  //Recupera los compromisos
                  this.ejecuService.getByIdtrami(this.idtrami).subscribe({
                     next: (ejecucio: Ejecucio[]) => {
                        this.compromisos = ejecucio;
                        this.formTransaci.controls['valor'].setValue('');
                        // this.isLoading = false;
                        if (this.compromisos.length > 0) {
                           const controles = ejecucio.map((item) => {
                              const valor = item.prmiso - item.totdeven;
                              const control = this.fb.control(
                                 { value: 0, disabled: valor === 0 || this.swfechamayor },
                                 [Validators.required, Validators.min(0)],
                                 [this.valDevengar.bind(this)]
                              );
                              return control;
                           })
                           this.formDevengar.setControl('devengar', this.fb.array(controles));

                           this.cuentasAsociadas = ejecucio.map(() => null);
                           this.cuentaSeleccionada = ejecucio.map(() => null);
                           this.sumaTotales();
                        }
                     },
                     error: err => { console.error(err.error); this.authService.mostrarError('Error al buscar', err.error) }
                  });
               }
            },
            error: (err) => { console.error(err); this.authService.mostrarError('Error al buscar el Compromiso', err.error) }
         });
      } else {
         this.idtrami = null;
         this.formTransaci.patchValue({
            nomben: '',
            fectramite: ''
         });
         this.compromisos = [];
      }
   }

   get formArrayDevengar(): FormArray { return this.formDevengar.get('devengar') as FormArray; }

   seleccionarTexto(event: FocusEvent): void {
      const input = event.target as HTMLInputElement;
      input.select();
   }

   buscaDevengados(idprmiso: number) {
      this.ejecuService.obtenerPorIdprmiso(idprmiso).subscribe({
         next: (ejecucio: Ejecucio[]) => {
            this.devengados = ejecucio;
            // Calcula el total de devengado
            this.totDevengado = this.devengados.length > 1
               ? this.devengados.reduce((sum, e) => sum + (e.devengado || 0), 0)
               : (this.devengados[0]?.devengado || 0);
            // Carga los asientos
            this.devengados.forEach((e, index) => {
               if (e.idasiento) {
                  this.asiService.unAsiento(e.idasiento).subscribe(a => {
                     this.devengados[index].asiento = a;
                  });
               }
            });
         },
         error: (err) => { console.error(err); this.authService.mostrarError('Error al buscar los Devengados', err.error) }
      });
   }

   abrirAsiento(asiento: Asientos) {
      let datosToTransaci = {
         idasiento: asiento.idasiento,
         desdeNum: 2,
         hastaNum: asiento.asiento,
         padre: 'Ninguno'
      };
      sessionStorage.setItem('datosTosTransaci', JSON.stringify(datosToTransaci));
      const url = `${window.location.origin}/transaci`;
      window.open(url, '_blank');
   }

   changeValor(i: number) {
      const control = this.formArrayDevengar.at(i);
      const valor = control.value;
      if (valor > 0) {
         const asodebe = this.compromisos[i].intpre.codigo;
         this.cueService.getByAsodebe(asodebe).subscribe({
            next: (resultado) => {
               this.cuentasAsociadas[i] = resultado;

               if (resultado && resultado.length > 0) {
                  this.cuentaSeleccionada[i] = resultado[0];
                  // Limpiar error si existía
                  const { noTienecuenta, ...rest } = control.errors || {};
                  control.setErrors(Object.keys(rest).length ? rest : null);
               } else {
                  this.cuentaSeleccionada[i] = null;
                  control.setErrors({ ...control.errors, noTienecuenta: true });
               }
               this.sumaTotales();
            },
            error: (err) => {
               console.error('Error al buscar resultado', err);
               this.cuentasAsociadas[i] = null;
               this.cuentaSeleccionada[i] = null;
               control.setErrors({ ...control.errors, noTienecuenta: true });
            }
         });
      } else {
         this.cuentasAsociadas[i] = null;
         this.cuentaSeleccionada[i] = null;
         // Limpiar error si existía
         const { noTienecuenta, ...rest } = control.errors || {};
         control.setErrors(Object.keys(rest).length ? rest : null);
      }
   }

   sumaTotales(): void {
      let totalValor = 0;
      let totalSaldo = 0;
      let totalDevengar = 0;
      const formArray = this.formArrayDevengar;
      let algunaInvalida = false;
      for (let i = 0; i < this.compromisos.length; i++) {
         const ejecu = this.compromisos[i];
         const valor = ejecu.prmiso || 0;
         const totdeven = ejecu.totdeven || 0;
         const control = formArray?.at(i);
         const devengar = control?.value || 0;

         totalValor += valor;
         totalSaldo += valor - totdeven;

         if (control?.invalid) { algunaInvalida = true; }
         totalDevengar += devengar;
      }
      this.totales.totalValor = totalValor;
      this.totales.totalSaldo = totalSaldo;
      this.totales.totalDevengar = algunaInvalida ? 0 : totalDevengar;
      if (this.formArrayDevengar.valid && this.totales.totalDevengar > 0) {
         this.formTransaci.controls['valor'].setValue(this.totales.totalDevengar);
      } else {
         this.formTransaci.controls['valor'].setValue(null);
      }
   }

   dobleclick(i: number) {
      // this.arrCompromisos[i].valor = this._compromisos[i].prmiso - this._compromisos[i].totdeven;
      // this.arrCompromisos[i].estado = 1;
      // let asodebe = this._compromisos[i].presupuesto.codigo;
      // this.cueService.getByAsodebe(asodebe).subscribe({
      //    next: datos => {
      //       switch (datos.length) {
      //          case 0:
      //             this.arrCompromisos[i].codcue = 'No tiene cuenta';
      //             // this.swinvalido = true;
      //             break;
      //          case 1:
      //             this.arrCompromisos[i].codcue = datos[0].codcue;
      //             this.arrCompromisos[i].idcuenta = datos[0].idcuenta;
      //             break;

      //          default:
      //             if (datos.length > 1) {
      //                this.swvarias = true;
      //                this._cuentas = datos;
      //                this.filactual = i;
      //                this.arrCompromisos[i].codcue = 'Varias';
      //             }
      //             else this.arrCompromisos[i].codcue = '';
      //             break;
      //       }
      //    },
      //    error: err => console.error(err.error)
      // });
      // // this.metodoTotales();
      // this.formTransaccion.controls['valor'].setValue(this.suma);
   }

   changeCuenta(index: number, cuenta: Cuentas): void {
      this.cuentaSeleccionada[index] = cuenta;
   }

   onSubmit() {
      const compromisosFiltrados = this.filtraCompromisosParaGuardar();
      // console.log('compromisosFiltrados: ', compromisosFiltrados)
      this.guardaTransacciones(0, compromisosFiltrados);
   }

   //Filtra los compromisos (en ejecucion), incluye el valor digitado y la cuenta seleccionada
   filtraCompromisosParaGuardar(): { ejecucion: Ejecucio, devengar: number; cuenta: Cuentas }[] {
      const compromisosFiltrados = [];
      for (let i = 0; i < this.compromisos.length; i++) {
         const control = this.formArrayDevengar.at(i);
         const valor = control?.value;
         if (valor > 0 && control?.valid) {
            compromisosFiltrados.push({
               ejecucion: this.compromisos[i],
               devengar: valor,
               cuenta: this.cuentaSeleccionada[i]!
            });
         }
      }
      return compromisosFiltrados;
   }

   guardaTransacciones(i: number, compromisosFiltrados: { ejecucion: Ejecucio, devengar: number, cuenta: Cuentas }[]) {
      const dtoTransaci: TransaciCreateDTO = {
         idasiento: { idasiento: this.idasiento },
         tiptran: 1,
         orden: this.formTransaci.value.orden,
         idcuenta: { idcuenta: compromisosFiltrados[i].cuenta.idcuenta },
         codcue: compromisosFiltrados[i].cuenta.codcue,
         debcre: 1,
         valor: compromisosFiltrados[i].devengar,
         intdoc: { intdoc: this.formTransaci.value.intdoc },
         numdoc: this.formTransaci.value.numdoc,
         descri: this.formTransaci.value.descri,
         idbene: { idbene: 1 },
         totbene: 0,
         intpre: null,
         usucrea: this.authService.idusuario,
         feccrea: new Date(),
      };
      this.tranService.saveTransaci(dtoTransaci).subscribe({
         next: (transaci: Transaci) => {
            const dtoEjecucio: EjecucioCreateDTO = {
               tipeje: 3,
               intpre: { intpre: compromisosFiltrados[i].ejecucion.intpre.intpre },
               codpar: compromisosFiltrados[i].ejecucion.intpre.codpar,
               fecha_eje: this.formAsiento.value.fecha,
               modifi: 0,
               prmiso: 0,
               totdeven: 0,
               devengado: compromisosFiltrados[i].devengar,
               cobpagado: 0,
               concep: this.formTransaci.value.descri,
               idrefo: 0,
               idtrami: null,
               idasiento: this.idasiento,
               inttra: transaci.inttra,
               idparxcer: null,
               idprmiso: compromisosFiltrados[i].ejecucion.inteje,
               idtrata: 0,
               usucrea: this.authService.idusuario,
               feccrea: new Date(),
            }
            this.ejecuService.saveEjecu(dtoEjecucio).subscribe({
               next: () => {
                  if (i < compromisosFiltrados.length - 1) {
                     i = i + 1;
                     this.guardaTransacciones(i, compromisosFiltrados);
                  } else { this.regresar(); };
               },
               error: err => { console.error(err.error); this.authService.mostrarError('Error al guardar Ejecucio', err.error) }
            });
         },
         error: err => { console.error(err.error); this.authService.mostrarError('Error al guardar Transaci', err.error) }
      })
   }


   regresar() { this.router.navigate(['/transaci']); }

   //Valida numero de Trámite (solo retorna true / false)
   valNumero(): AsyncValidatorFn {
      return (control: AbstractControl): Observable<ValidationErrors | null> => {
         return this.tramiService.valNumero(control.value).pipe(
            map(result => result ? null : { existe: true })
         );
      };
   }

   // Valida valor devengado
   valDevengar(control: AbstractControl): Promise<ValidationErrors | null> {
      return new Promise((resolve) => {
         const index = this.formArrayDevengar.controls.indexOf(control);
         const ejecu = this.compromisos[index];
         if (!ejecu) return resolve(null);
         const valor = parseFloat(control.value);
         const saldo = ejecu.prmiso - ejecu.totdeven;
         if (isNaN(valor)) return resolve(null);
         if (valor > saldo) {
            resolve({ devengarExcede: { maxPermitido: saldo } });
         } else { resolve(null) }
      });
   }

}
