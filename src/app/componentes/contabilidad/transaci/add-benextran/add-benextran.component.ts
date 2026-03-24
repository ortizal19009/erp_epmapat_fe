import { Component, OnInit } from '@angular/core';
import { AbstractControl, AsyncValidatorFn, FormArray, FormBuilder, FormControl, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { ColoresService } from 'src/app/compartida/colores.service';
import { BenextranCreateDTO } from 'src/app/dtos/contabilidad/benextran.dto';
import { TransaciCreateDTO } from 'src/app/dtos/contabilidad/transaci.dto';
import { Documentos } from 'src/app/modelos/administracion/documentos.model';
import { Asientos } from 'src/app/modelos/contabilidad/asientos.model';
import { Beneficiarios } from 'src/app/modelos/contabilidad/beneficiarios.model';
import { Cuentas } from 'src/app/modelos/contabilidad/cuentas.model';
import { Ejecucio } from 'src/app/modelos/contabilidad/ejecucio.model';
import { Transaci } from 'src/app/modelos/contabilidad/transaci.model';
import { DocumentosService } from 'src/app/servicios/administracion/documentos.service';
import { AsientosService } from 'src/app/servicios/contabilidad/asientos.service';
import { BeneficiariosService } from 'src/app/servicios/contabilidad/beneficiarios.service';
import { BenextranService } from 'src/app/servicios/contabilidad/benextran.service';
import { CuentasService } from 'src/app/servicios/contabilidad/cuentas.service';
import { EjecucionService } from 'src/app/servicios/contabilidad/ejecucio.service';
import { TransaciService } from 'src/app/servicios/contabilidad/transaci.service';

@Component({
   selector: 'app-add-benextran',
   templateUrl: './add-benextran.component.html',
   styleUrls: ['./add-benextran.component.css']
})

export class AddBenextranComponent implements OnInit {

   iAsiento = {} as interfaceAsiento; //Interface para los datos del Asiento
   formTransaci: FormGroup;
   idasiento: number;
   cuentas: Cuentas[] = [];
   idcuenta: number | null;
   documentos: Documentos[] = [];
   totDebe: number;
   totHaber: number;
   tiptran: { numero: number; nombre: string; cabecera1: string; cabecera2: string };
   transaci: Transaci[] = [];
   arrBeneficiarios: any[] = [];
   arrIdbeneficiario: number[] | null[] = [];
   nomDebcre: string = 'Debe';
   formBenextran: FormGroup;
   ejecuciones: Ejecucio[] = []; //Ejecuciones del asiento
   intpreSeleccionado: number | null;

   constructor(private router: Router, private fb: FormBuilder, private coloresService: ColoresService, public authService: AutorizaService,
      private cueService: CuentasService, private asiService: AsientosService, private docuService: DocumentosService,
      private beneService: BeneficiariosService, private tranService: TransaciService, private benextranService: BenextranService,
      private ejecuService: EjecucionService) {
      this.formBenextran = this.fb.group({
         registros: this.fb.array([])
      }, { updateOn: "blur" });
   }

   ngOnInit(): void {
      sessionStorage.setItem('ventana', '/benextran');
      let coloresJSON = sessionStorage.getItem('/benextran');
      if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));
      else this.buscaColor();

      const datosToAddtransaci = JSON.parse(sessionStorage.getItem("datosToAddtransaci")!);
      this.idasiento = datosToAddtransaci.idasiento;
      this.totDebe = +datosToAddtransaci.totDebe;
      this.totHaber = +datosToAddtransaci.totHaber;
      const tiptranInfo = nombreTiptran(datosToAddtransaci.tiptran);
      this.tiptran = { numero: datosToAddtransaci.tiptran, nombre: tiptranInfo.nombre, cabecera1: tiptranInfo.cabecera1, cabecera2: tiptranInfo.cabecera2 };
      if (this.tiptran.numero > 4) { this.nomDebcre = 'Haber'; };

      let date: Date = new Date();
      this.formTransaci = this.fb.group({
         orden: [+datosToAddtransaci.orden, Validators.required],
         idcuenta: ['', Validators.required, this.valCuenta()],
         codcue: '',
         nomcue: ['', Validators.required],
         valor: ['', Validators.required],
         intdoc: this.documentos,
         numdoc: ['', Validators.required],
         codpar: '',
         nompar: '',
         descri: '',
         benextran: this.fb.array([])
      }, { updateOn: "blur" });

      this.datosAsiento();
      this.listarDocumentos();
   }

   async buscaColor() {
      try {
         const datos = await this.coloresService.setcolor(1, 'transaci');
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

   get f() { return this.formTransaci.controls; }

   datosAsiento() {
      this.asiService.unAsiento(this.idasiento).subscribe({
         next: datos => {
            this.iAsiento.asiento = datos.asiento;
            this.iAsiento.fecha = datos.fecha;
            this.iAsiento.comprobante = this.authService.comprobante(datos.tipcom, datos.compro);
            this.iAsiento.benefi = datos.idbene.nomben;
            this.iAsiento.documento = datos.intdoc.nomdoc + ' ' + datos.numdoc;
            this.iAsiento.numdoc = datos.numdoc;
            this.iAsiento.intdoc = datos.intdoc.intdoc;
            this.formTransaci.patchValue({
               intdoc: this.iAsiento.intdoc,
               numdoc: datos.numdoc,
               descri: datos.glosa,
            });
         },
         error: err => console.error(err.error)
      });
      if (this.tiptran.numero == 3 || this.tiptran.numero == 6) this.partidasCobroPago();
   }

   listarDocumentos() {
      this.docuService.getListaDocumentos().subscribe({
         next: (documentos: Documentos[]) => this.documentos = documentos,
         error: (err) => console.error(err.error)
      });
   }

   partidasCobroPago() {
      //OJO: Debe buscar solo partidas de ingreso o gasto (no las dos)
      this.ejecuService.findByIdAsiento(this.idasiento).subscribe({
         next: (ejecuciones: Ejecucio[]) => {
            this.ejecuciones = ejecuciones;
            // console.log('this.ejecuciones: ', this.ejecuciones)
            if (ejecuciones && ejecuciones.length > 0) {
               this.formTransaci.patchValue({
                  codpar: this.ejecuciones[0].intpre.codpar,
                  nompar: this.ejecuciones[0].intpre.nompar
               });
            }
         },
         error: err => { console.error(err.error); this.authService.mostrarError('Error al buscar la Ejecución', err.error) },
      });
   }

   cuentasxTiptran(e: any) {
      if (e.target.value != '') {
         this.cueService.getByTiptran(this.tiptran.numero, e.target.value).subscribe({
            next: (cuentas: Cuentas[]) => this.cuentas = cuentas,
            error: err => console.error(err.error),
         });
      }
   }
   onCuentaSelected(e: any) {
      const selectedOption = this.cuentas.find((x: { codcue: any; }) => x.codcue === e.target.value);
      if (selectedOption) {
         this.idcuenta = selectedOption.idcuenta;
         this.f['codcue'].setValue(selectedOption.codcue);
         this.formTransaci.controls['nomcue'].setValue(selectedOption.nomcue);
      }
      else {
         this.idcuenta = null;
         this.formTransaci.controls['nomcue'].setValue('');
      };
   }

   changePartida(ejecucio: Ejecucio) {
      this.intpreSeleccionado = ejecucio.intpre.intpre;
      this.formTransaci.controls['codpar'].setValue(ejecucio.intpre.codigo + '.' + ejecucio.intpre.codpar);
      this.formTransaci.controls['nompar'].setValue(ejecucio.intpre.nompar);
   }

   //Beneficiarios por Transacción
   get registros(): FormArray { return this.formBenextran.get('registros') as FormArray }

   agregarFila(): void {
      const index = this.registros.length;
      this.registros.push(this.crearRegistro(index));
   }

   crearRegistro(i: number): FormGroup {
      return this.fb.group({
         beneficiario: ['', Validators.required, this.valBeneficiario(i)],
         valor: [0, [Validators.required, Validators.min(0)]]
      });
   }

   eliminarFila(index: number): void {
      this.registros.removeAt(index);
      const suma = this.getTotalValorBenextran();
      if (suma != 0) this.formTransaci.controls['valor'].setValue(suma)
      else this.formTransaci.controls['valor'].setValue(null)
   }

   benefixNombre(index: number, e: any) {
      if (!this.arrBeneficiarios[index]) { this.arrBeneficiarios[index] = []; }
      if (e.target.value != '') {
         this.beneService.findByNomben(e.target.value).subscribe({
            next: (beneficiarios: Beneficiarios[]) => this.arrBeneficiarios[index] = beneficiarios,
            error: err => console.error(err.error),
         });
      } else this.arrBeneficiarios[index] = [];
   }
   onBenefiSelected(index: number, e: any) {
      const selectedOption = this.arrBeneficiarios[index]?.find((x: { nomben: any; }) => x.nomben === e.target.value);
      if (selectedOption) this.arrIdbeneficiario[index] = selectedOption.idbene;
      else this.arrIdbeneficiario[index] = null;
   }

   seleccionarTexto(event: FocusEvent): void {
      const input = event.target as HTMLInputElement;
      input.select();
   }

   changeValor() {
      const suma = this.getTotalValorBenextran();
      if (suma != 0) this.formTransaci.controls['valor'].setValue(suma)
      else this.formTransaci.controls['valor'].setValue(null)
   }

   getTotalValorBenextran(): number {
      return this.registros.controls.reduce((total, fila) => {
         const valor = fila.get('valor')?.value;
         return total + (typeof valor === 'number' ? valor : 0);
      }, 0);
   }

   onSubmit() {
      let intpre: number | null = null;
      if (this.tiptran.numero == 3 || this.tiptran.numero == 6) { intpre = this.intpreSeleccionado }
      const dto: TransaciCreateDTO = {
         idasiento: { idasiento: this.idasiento },
         tiptran: this.tiptran.numero,
         orden: this.formTransaci.value.orden,
         idcuenta: { idcuenta: this.idcuenta! },
         codcue: this.formTransaci.value.codcue,
         debcre: this.nomDebcre === 'Debe' ? 1 : 2,
         valor: this.formTransaci.value.valor,
         intdoc: { intdoc: this.formTransaci.value.intdoc },
         numdoc: this.formTransaci.value.numdoc,
         descri: this.formTransaci.value.descri,
         idbene: { idbene: this.arrIdbeneficiario[0]! },
         totbene: this.registros.length,
         intpre: intpre,
         usucrea: this.authService.idusuario,
         feccrea: new Date(),
      };
      this.tranService.saveTransaci(dto).subscribe({
         next: (newtransaci: Transaci) => {
            //Añade Beneficiario(s) (benextran) en lote
            const registrosFA = this.formBenextran.get('registros') as FormArray;
            const dtoLote: BenextranCreateDTO[] = registrosFA.controls.map((ctrl, index) => {
               const fila = ctrl.value;
               return {
                  inttra: { inttra: newtransaci.inttra },
                  idbene: { idbene: this.arrIdbeneficiario[index]! },
                  intdoc: { intdoc: newtransaci.intdoc.intdoc },
                  numdoc: newtransaci.numdoc,
                  valor: fila.valor,
                  totpagcob: 0,
                  pagocobro: 0
               };
            });
            // console.log('dtoLote: ', dtoLote)
            this.benextranService.guardarLote(dtoLote).subscribe({
               next: () => {
                  this.authService.swal('success', `Transacción de la Cuenta ${newtransaci.codcue} guardada con éxito`);
                  this.regresar();
               },
               error: err => { console.error(err.error); this.authService.mostrarError('Error al guardar Benextran por lote', err.error) }
            });

         },
         error: err => { console.error(err.error); this.authService.mostrarError('Error al guardar Transaci', err.error) }
      });
   }

   regresar() { this.router.navigate(['/transaci']); }

   //Valida Cuenta
   valCuenta(): AsyncValidatorFn {
      return (_control: AbstractControl): Observable<ValidationErrors | null> => {
         const esValido = this.idcuenta != null;
         return of(esValido ? null : { invalido: true });
      };
   }

   //Valida Beneficiario
   valBeneficiario(i: number): AsyncValidatorFn {
      return (_control: AbstractControl): Observable<ValidationErrors | null> => {
         if (this.arrIdbeneficiario[i] == null) return of({ 'invalido': true });
         else return of(null);
      };
   }

}

interface interfaceAsiento {
   asiento: number;
   fecha: Date;
   comprobante: string;
   documento: String;
   numdoc: String;
   benefi: String;
   intdoc: number;
}

function nombreTiptran(tiptran: number): { nombre: string, cabecera1: string, cabecera2: string } {
   if (tiptran == 2) return { nombre: 'Registro de Anticipo(s)', cabecera1: 'Anticipo', cabecera2: 'Liquidado' };
   if (tiptran == 3) return { nombre: 'Registro de Cuenta(s) por cobrar', cabecera1: 'Cuenta por cobrar', cabecera2: 'Cobrado' };
   if (tiptran == 4) return { nombre: 'Registro de Cuenta(s) por cobrar año anterior', cabecera1: 'Valor', cabecera2: 'Cobrado' };
   if (tiptran == 5) return { nombre: 'Registro de Depósitos y fondos de terceros', cabecera1: 'Valor', cabecera2: 'Liquidado' };
   if (tiptran == 6) return { nombre: 'Registro de Cuenta(s) por pagar', cabecera1: 'Cuenta por Pagar', cabecera2: 'Pagado' };
   if (tiptran == 7) return { nombre: 'Registro de Cuenta(s) por pagar año anterior', cabecera1: 'Valor', cabecera2: 'Pagado' };
   return { nombre: '(Ninguno)', cabecera1: ' ', cabecera2: ' ' };
}
