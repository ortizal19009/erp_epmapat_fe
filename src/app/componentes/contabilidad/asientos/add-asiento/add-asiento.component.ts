import { Component, OnInit } from '@angular/core';
import { AbstractControl, AsyncValidatorFn, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { map, Observable, of, switchMap } from 'rxjs';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { Documentos } from 'src/app/modelos/administracion/documentos.model';
import { Asientos } from 'src/app/modelos/contabilidad/asientos.model';
import { Beneficiarios } from 'src/app/modelos/contabilidad/beneficiarios.model';
import { DocumentosService } from 'src/app/servicios/administracion/documentos.service';
import { AsientosService } from 'src/app/servicios/contabilidad/asientos.service';
import { BeneficiariosService } from 'src/app/servicios/contabilidad/beneficiarios.service';

@Component({
   selector: 'app-add-asiento',
   templateUrl: './add-asiento.component.html',
   styleUrls: ['./add-asiento.component.css']
})
export class AddAsientoComponent implements OnInit {

   formAsiento: FormGroup;
   beneficiarios: Beneficiarios[] = [];
   idbene: number | null;
   documentos: Documentos[] = [];
   tipcom: number;
   inicioFormulario: number = 0;
   tiempoTranscurrido: number = 0;

   constructor(private router: Router, private fb: FormBuilder, private beneService: BeneficiariosService,
      public authService: AutorizaService, private docuService: DocumentosService, private asiService: AsientosService) { }

   ngOnInit(): void {
      sessionStorage.setItem('ventana', '/asientos');
      let coloresJSON = sessionStorage.getItem('/asientos');
      if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));

      const datosEmpresa = this.authService.getDatosEmpresa()
      const año = datosEmpresa!.fechap.toString().slice(0, 4);
      const fecha = new Date(año + '-01-01')
      this.formAsiento = this.fb.group({
         fecha: [fecha, Validators.required, this.valAño()],
         tipasi: 2,
         tipcom: ['', { validators: [Validators.required], updateOn: 'change' }],
         compro: ['', Validators.required, this.valCompro()],
         intdoc: this.documentos,
         numdoc: ['', [Validators.required]],
         idbene: ['', [Validators.required], [this.valBenefi()]],
         glosa: '',
      }, { updateOn: "blur" });

      this.inicioFormulario = Date.now();
      this.ultimafecha();
      this.listarDocumentos();
      this.changeTipcom();
   }

   colocaColor(colores: any) {
      document.documentElement.style.setProperty('--bgcolor1', colores[0]);
      const cabecera = document.querySelector('.cabecera');
      if (cabecera) cabecera.classList.add('nuevoBG1')
      document.documentElement.style.setProperty('--bgcolor2', colores[1]);
      const detalle = document.querySelector('.detalle');
      if (detalle) detalle.classList.add('nuevoBG2');
   }

   ultimafecha() {
      this.asiService.obtenerUltimaFecha().subscribe({
         next: (ultimafecha: Date) => {
            // console.log('ultimafecha: ', ultimafecha)
            // const soloFecha = ultimafecha.toString().substring(0, 10);
            this.formAsiento.patchValue({ fecha: ultimafecha })
      },
         error: err => console.error('Error al obtener la última fecha', err.error)
      });
   }

   listarDocumentos() {
      this.docuService.getListaDocumentos().subscribe({
         next: (documentos: Documentos[]) => {
            this.documentos = documentos;
            this.formAsiento.patchValue({ intdoc: 1 });
         },
         error: err => console.error(err.error)
      });
   }

   get f() { return this.formAsiento.controls; }

   changeTipcom(): void {
      this.formAsiento.get('tipcom')!.valueChanges.pipe(
         switchMap(tipcomValue => {
            this.tipcom = tipcomValue;
            return this.asiService.obtenerUltimoCompro(this.tipcom);
         })
      ).subscribe({
         next: ultimo => this.formAsiento.patchValue({ compro: ultimo + 1 }),
         error: err => console.error(err.error)
      });
   }

   //Seleccionar beneficiario
   benefixNombre(e: any) {
      if (e.target.value != '') {
         this.beneService.findByNomben(e.target.value).subscribe({
            next: (beneficiarios: Beneficiarios[]) => this.beneficiarios = beneficiarios,
            error: err => console.error(err.error),
         });
      }
   }
   onBenefiSelected(e: any) {
      const selectedOption = this.beneficiarios.find((x: { nomben: any; }) => x.nomben === e.target.value);
      if (selectedOption) this.idbene = selectedOption.idbene;
      else this.idbene = null;
   }

   // Guarda
   saveAsiento() {
      // Vuelve a validar el número de comprobante (Mientras toman café ...)
      this.validaComprobanteAntesDeGuardar().subscribe(existe => {
         if (existe) {
            const fin = Date.now();
            this.tiempoTranscurrido = fin - this.inicioFormulario;
            this.authService.mensaje404(`El Comprobante ${this.formAsiento.value.compro} ya fue creada por otro Usuario. 
               Tiempo transcurrido: ${this.authService.formatearTiempo(this.tiempoTranscurrido)}`);
            return;
         }
         this.asiService.siguienteNumero().subscribe(numero => {
            const siguienteNumero = numero;
            this.formAsiento.value.asiento = siguienteNumero;
            const dto: AsientoCreateDTO = {
               asiento: siguienteNumero,
               fecha: this.formAsiento.value.fecha,
               tipasi: this.formAsiento.value.tipasi,
               tipcom: this.formAsiento.value.tipcom,
               compro: this.formAsiento.value.compro,
               totdeb: 0,
               totcre: 0,
               cerrado: 0,
               glosa: this.formAsiento.value.glosa,
               numdoc: this.formAsiento.value.numdoc,
               numcue: 0,
               swretencion: 0,
               totalspi: 0,
               usucrea: this.authService.idusuario,
               feccrea: new Date(),
               intdoc: { intdoc: this.formAsiento.value.intdoc },
               idbene: { idbene: this.idbene }
            };
            this.asiService.saveAsiento(dto).subscribe({
               next: (nuevo: Asientos) => {
                  //Actualiza los datos de búsqueda para que se muestre en la lista de Trámites
                  let buscaDesdeNum = siguienteNumero - 16;
                  if (buscaDesdeNum <= 0) buscaDesdeNum = 1;
                  let year = new Date(this.f['fecha'].value).getFullYear(); // Extraer el año de la fecha 
                  const buscarAsientos = {
                     tipcom: 0,
                     desdeNum: buscaDesdeNum,
                     hastaNum: siguienteNumero,
                     desdeFecha: year.toString() + "-01-01",
                     hastaFecha: year.toString() + "-12-31",
                  };
                  this.authService.swal('success', `Asiento ${nuevo.asiento} guardado con éxito`);
                  sessionStorage.setItem('ultidasiento', nuevo.idasiento.toString());
                  sessionStorage.setItem("buscarAsientos", JSON.stringify(buscarAsientos));
                  let datosToTransaci = {
                     idasiento: nuevo.idasiento,
                     desdeNum: buscaDesdeNum,
                     hastaNum: siguienteNumero,
                     padre: '/asientos'
                  };
                  sessionStorage.setItem('datosToTransaci', JSON.stringify(datosToTransaci));
                  this.router.navigate(['transaci']);
               },
               error: err => { console.error(err.error); this.authService.mostrarError('Error al guardar el Asiento', err.error); }
            });
         });
      });
   }

   regresar() { this.router.navigate(['/asientos']); }

   //Valida el año de la fecha
   valAño(): AsyncValidatorFn {
      return (control: AbstractControl): Observable<ValidationErrors | null> => {
         const datos = this.authService.getDatosEmpresa();
         const añoEmpresa = datos?.fechap?.toString().slice(0, 4);
         const añoDigitado = control.value?.toString().slice(0, 4);
         const esValido = añoEmpresa === añoDigitado;
         return of(esValido ? null : { añoinvalido: true });
      };
   }

   // Valida número de Comprobante
   valCompro(): AsyncValidatorFn {
      return (control: AbstractControl): Observable<ValidationErrors | null> => {
         return this.asiService.valCompro(this.tipcom, control.value).pipe(
            map(existe => (existe ? { existe: true } : null))
         );
      };
   }

   // Valida nuevamente el momento de gaurdar
   validaComprobanteAntesDeGuardar(): Observable<boolean> {
      const compro = this.formAsiento.get('compro')?.value;
      // console.log('Valida: ', this.tipcom, compro)
      return this.asiService.valCompro(this.tipcom, compro).pipe(
         map(existe => existe)
      );
   }

   //Valida que se haya seleccionado un Beneficiario
   valBenefi(): AsyncValidatorFn {
      return (_control: AbstractControl): Observable<ValidationErrors | null> => {
         const esValido = this.idbene != null;
         return of(esValido ? null : { invalido: true });
      };
   }

}

export interface AsientoCreateDTO {
   asiento: number;
   fecha: Date;
   tipasi: number;
   tipcom: number;
   compro: number;
   totdeb: number;
   totcre: number;
   cerrado: number;
   glosa: String;
   numdoc: String;
   numcue: number;
   swretencion: number;
   totalspi: number;
   usucrea: number;
   feccrea: Date;
   intdoc: { intdoc: number };
   idbene: { idbene: number | null };
}