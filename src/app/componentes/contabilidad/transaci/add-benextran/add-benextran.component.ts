import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormControl, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { ColoresService } from 'src/app/compartida/colores.service';
import { Documentos } from 'src/app/modelos/administracion/documentos.model';
import { Asientos } from 'src/app/modelos/contabilidad/asientos.model';
import { Beneficiarios } from 'src/app/modelos/contabilidad/beneficiarios.model';
import { Cuentas } from 'src/app/modelos/contabilidad/cuentas.model';
import { Transaci } from 'src/app/modelos/contabilidad/transaci.model';
import { DocumentosService } from 'src/app/servicios/administracion/documentos.service';
import { AsientosService } from 'src/app/servicios/contabilidad/asientos.service';
import { BeneficiariosService } from 'src/app/servicios/contabilidad/beneficiarios.service';
import { BenextranService } from 'src/app/servicios/contabilidad/benextran.service';
import { CuentasService } from 'src/app/servicios/contabilidad/cuentas.service';
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
   _cuentas: any[] = [];
   idcuenta: number | null;
   _documentos: any;
   totDebe: number;
   totHaber: number
   _transaci: any
   formBenextran: FormGroup;
   _beneficiarios: any[] = [];
   idbenefi: number | null
   iTransaci = {} as interfaceTransaci;
   benes: FormArray;
   control: any
   uniqueIdCounter = 0; // Inicializa tu contador
   formBene: FormGroup;

   cuenta: Cuentas = new Cuentas;
   documento: Documentos = new Documentos;
   beneficiario: Beneficiarios = new Beneficiarios;
   asiento: Asientos = new Asientos;

   constructor(private router: Router, private fb: FormBuilder, private coloresService: ColoresService, private cueService: CuentasService,
      private asiService: AsientosService, private docuService: DocumentosService, private beneService: BeneficiariosService,
      private tranService: TransaciService, private benextranService: BenextranService) { }

   ngOnInit(): void {
      sessionStorage.setItem('ventana', '/benextran');
      let coloresJSON = sessionStorage.getItem('/benextran');
      if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));
      else this.buscaColor();

      const datosToAddtransaci = JSON.parse(sessionStorage.getItem("datosToAddtransaci")!);
      this.totDebe = datosToAddtransaci.totDebe;
      this.totHaber = datosToAddtransaci.totHaber;

      this.idasiento = +sessionStorage.getItem('idasientoToTransaci')!;
      this.asiento.idasiento = this.idasiento;
      this.beneficiario.idbene = 1;
      let date: Date = new Date();
      this.formTransaci = this.fb.group({
         orden: 10,
         idcuenta: ['', Validators.required, this.valCuenta.bind(this)],
         codcue: '',
         nomcue: ['', Validators.required],
         debcre: 1,
         valor: ['', Validators.required],
         intdoc: this.documento,
         numdoc: ['', Validators.required],
         idbene: this.beneficiario,
         idasiento: this.asiento,
         tiptran: 2,
         totbene: 0,
         descri: '',
         swconcili: false,
         usucrea: 1,
         feccrea: date
      }, { updateOn: "blur" });

      this.datosAsiento();
      this.listarDocumentos();

      // this.formBenextran = this.fb.group({
      //    items: this.fb.array([]),
      //    numdoc: ['', [Validators.required]]
      // });

      // this.benes = this.formBenextran.get('items') as FormArray;

      this.formBene = new FormGroup({
         'campos': new FormArray([])
      });
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
   f1(fila: number) {
      const control = this.formBenextran.get('items') as any;
      return control.controls.find((c: { get: (arg0: string) => any; }) => c.get('id')!.value === fila);
   }

   datosAsiento() {
      this.idasiento = +sessionStorage.getItem('idasientoToTransaci')!;
      this.asiService.unAsiento(this.idasiento).subscribe({
         next: datos => {
            this.iAsiento.asiento = datos.asiento;
            this.iAsiento.fecha = datos.fecha;
            this.iAsiento.comprobante = nomcomprobante(datos.tipcom) + datos.compro.toString();
            this.iAsiento.benefi = datos.idbene.nomben;
            this.iAsiento.documento = datos.intdoc.nomdoc + ' ' + datos.numdoc;
            this.iAsiento.numdoc = datos.numdoc;
            this.iAsiento.intdoc = datos.intdoc.intdoc;
            this.documento.intdoc = this.iAsiento.intdoc;
            this.formTransaci.patchValue({
               intdoc: this.iAsiento.intdoc,
               numdoc: datos.numdoc,
               descri: datos.glosa,
            });
            this.aniadir();
         },
         error: err => console.error(err.error)
      });
   }

   listarDocumentos() {
      this.docuService.getListaDocumentos().subscribe({
         next: datos => this._documentos = datos,
         error: (err) => console.error(err.error)
      });
   }

   cuentasxTiptran(e: any) {
      if (e.target.value != '') {
         this.cueService.getByTiptran(2, e.target.value).subscribe({
            next: datos => this._cuentas = datos,
            error: err => console.error(err.error),
         });
      }
   }
   
   onCuentaSelected(e: any) {
      const selectedOption = this._cuentas.find((x: { codcue: any; }) => x.codcue === e.target.value);
      if (selectedOption) {
         this.idcuenta = selectedOption.idcuenta;
         this.formTransaci.controls['nomcue'].setValue(selectedOption.nomcue);
      }
      else {
         this.idcuenta = null;
         this.formTransaci.controls['nomcue'].setValue('');
      };
   }

   regresar() { this.router.navigate(['/transaci']); }

   getCampos() {
      return <FormArray>this.formBene.get('campos');
   }

   aniadir() {
      const grupo = new FormGroup({
         // 'idbene': new FormControl(null, Validators.required, this.valBenefi.bind(this)),
         'idbene': new FormControl(null),
         'intdoc': new FormControl(this.iAsiento.intdoc, Validators.required),
         'numdoc': new FormControl(this.iAsiento.numdoc, Validators.required),
         'valor': new FormControl(null, Validators.required),
         'totpagcob': new FormControl(null, Validators.required),
         'saldo': new FormControl(null),
      });
      (<FormArray>this.formBene.get('campos')).push(grupo);
   }

   onSubmit() {
      this.cuenta.idcuenta = this._cuentas[0].idcuenta;
      this.formTransaci.value.idcuenta = this.cuenta;
      this.documento.intdoc = this.formTransaci.get('intdoc')!.value;
      this.formTransaci.value.intdoc = this.documento;

      this.tranService.saveTransa(this.formTransaci.value).subscribe({
         next: (resp) => {
            //Añade Beneficiario(s) (benextran)
            const _resp = resp as Transaci;  //Preferible a any
            // let items = this.formBenextran.get('items') as FormArray;
            for (let i = 0; i < this.benes.length; i++) {
               let itemGroup = this.benes.at(i) as FormGroup;
               let iBenextran = {} as interfaceBenextran;
               iBenextran.inttra = _resp;
               this.beneficiario.idbene = this._beneficiarios[0].idbene;
               iBenextran.idbene = this.beneficiario;
               this.documento.intdoc = itemGroup.get('intdoc')!.value;
               iBenextran.intdoc = this.documento;
               let numdoc = itemGroup.get('numdoc')!.value;
               iBenextran.numdoc = numdoc;
               iBenextran.valor = itemGroup.get('valor')!.value;
               iBenextran.totpagcob = 0;
               iBenextran.pagocobro = 0;
               this.benextranService.saveBenextran(iBenextran).subscribe({
                  // next: (nex) => {},
                  error: err => console.error(err.error)
               });
            }
            //Actualiza Totales del Asiento
            if (this.formTransaci.get('debcre')!.value == 1) this.totDebe = this.totDebe + this.formTransaci.get('valor')!.value
            else this.totHaber = this.totHaber + this.formTransaci.get('valor')!.value
            this.asiService.updateTotdebAndTotcre(this.idasiento, this.totDebe, this.totHaber).subscribe({
               next: resp => this.regresar(),
               error: err => console.error(err.error)
            });
         },
         error: (error) => {
            console.error('Error al guardar:', error);
         }
      });

      // this.tranService.saveTransa1(this.formTransaci.value).subscribe({
      //    next: transa => { 
      //       const id = transa.idtransa;
      //       console.log('id devuelto: ', id)

      //       if(this.formTransaci.get('debcre')!.value == 1) this.totDebe = this.totDebe + this.formTransaci.get('valor')!.value
      //       else this.totHaber = this.totHaber + this.formTransaci.get('valor')!.value
      //       this.asiService.updateTotdebAndTotcre(this.idasiento, this.totDebe, this.totHaber).subscribe({
      //          next: resp => this.regresar(),
      //          error: err => console.error(err.error)
      //       });
      //       this.regresar()
      //    },
      //    error: err => console.error(err.error)
      // });
   }

   formatInput() {
      let valorFormateado: string;
      let valor = this.formTransaci.get('valor')!.value;
      if (valor === '' || isNaN(valor)) valorFormateado = '';         // Comprueba si el valor está vacío o NaN
      else {
         valorFormateado = parseFloat(valor).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      }
      this.f['valor'].setValue(valorFormateado);
   }

   decimalValidator(control: AbstractControl): ValidationErrors | null {
      const value = control.value;
      if (value === null || value === undefined || value === '') { return null; }
      const regex = /^-?\d{1,3}(,\d{3})*(\.\d{0,2})?$/;
      return regex.test(value) ? null : { invalidDecimal: true };
   }

   // benefixNombre1(e: any) {
   //    if (e.target.value != '') {
   //       this.beneService.findByNombre(e.target.value).subscribe({
   //          next: datos => this._beneficiarios = datos,
   //          error: err => console.error(err.error),
   //       });
   //    }
   // }
   benefixNombre(e: any) {
      if (e.target.value != '') {
         this.beneService.findByNomben(e.target.value).subscribe({
            next: datos => this._beneficiarios = datos,
            error: err => console.error(err.error),
         });
      }
   }

   onBeneSelected(e: any, i: number) {
      const selectedOption = this._beneficiarios.find((x: { nomben: any; }) => x.nomben === e.target.value);
      if (selectedOption) this.idbenefi = selectedOption.idbene;
      else this.idbenefi = null;
      console.log('this.idbenefi:', this.idbenefi);

      // Agregar la validación después de que onBeneSelected se haya ejecutado
      const grupo = (<FormArray>this.formBene.get('campos')).at(i) as FormGroup;
      grupo.get('idbene')?.setValidators([Validators.required, this.valBenefi.bind(this)]);
      grupo.get('idbene')?.updateValueAndValidity();
   }

   // generateUniqueId(): number {
   //    return this.uniqueIdCounter++;
   // }

   // aniadir1() {
   //    this.control = this.formBenextran.get('items') as any;
   //    const uniqueId = this.generateUniqueId();
   //    this.control.push(
   //       this.fb.group({
   //          id: [uniqueId],
   //          idbene: ['', Validators.required],
   //          intdoc: [this.iAsiento.intdoc, Validators.required],
   //          numdoc: [this.iAsiento.numdoc, [Validators.required]],
   //          valor: [0, [Validators.required]],
   //          totpagcob: 0,
   //          saldo: 0
   //       })
   //    );
   //    this.formBenextran.get('numdoc')!.addValidators([Validators.required]);
   // }

   // aniadir2() {
   //    const control = this.formBenextran.get('items') as FormArray;
   //    const uniqueId = this.generateUniqueId();

   //    // Crea una nueva instancia del grupo de formulario para asegurar que tenga su propio contador
   //    const newFormGroup = this.fb.group({
   //       id: [uniqueId],
   //       idbene: ['', Validators.required],
   //       intdoc: [this.iAsiento.intdoc, Validators.required],
   //       numdoc: [this.iAsiento.numdoc, [Validators.required]],
   //       valor: [0, [Validators.required]],
   //       totpagcob: 0,
   //       saldo: 0
   //    });

   //    control.push(newFormGroup);
   //    this.formBenextran.get('numdoc')!.addValidators([Validators.required]);
   // }

   // Getter para acceder a los controles del formArray
   get formArrayControls() {
      return (this.formBenextran.get('items') as any).controls;
   }

   changeValor() {
      let sum = 0;
      for (let i = 0; i < this.benes.length; i++) {
         let itemGroup = this.benes.at(i) as FormGroup;
         let valor = +itemGroup.get('valor')!.value;
         // console.log('valor: ', valor)
         sum = sum + valor;
      }
      console.log('sum: ', sum)
      this.formTransaci.controls['valor'].setValue(sum.toString());
   }

   total() {
      // let items = this.formBenextran.get('items') as FormArray;
      let sum = 0;
      for (let i = 0; i < this.benes.length; i++) {
         let itemGroup = this.benes.at(i) as FormGroup;
         let valor = itemGroup.get('valor')!.value;
         sum = sum + itemGroup.get('valor')!.value;
      }
   }

   //Valida Cuenta
   valCuenta() {
      if (this.idcuenta == null) return of({ 'invalido': true });
      else return of(null);
   }

   //Valida Beneficiario
   valBenefiOk() {
      console.log('Pasa')
      if (this.idbenefi == null) return of({ 'invalido': true });
      else return of(null);
   }
   valBenefi() {
      console.log('Pasa');
      let rtn: any;
      if (this.idbenefi == null) rtn = { 'invalido': true }
      else rtn = null;
      console.log('Retorna: ', rtn);
      return of(rtn)
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

interface interfaceTransaci {
   idtransa: number;
}

//Nombre Tipo de Comprobante
function nomcomprobante(tipcom: number): string {
   var rtn: string;
   switch (tipcom) {
      case 1: rtn = 'I-';
         break;
      case 2: rtn = 'E-';
         break;
      case 3: rtn = 'DC-';
         break;
      case 4: rtn = 'DI-';
         break;
      case 5: rtn = 'DE-';
         break;
      default:
         rtn = '';
   }
   return rtn;
}

interface interfaceBenextran {
   idbenxtra: number;
   inttra: Transaci;
   idbene: Beneficiarios;
   intdoc: Documentos;
   numdoc: string;
   valor: number;
   totpagcob: number;
   pagocobro: number;
   intpre: number;
   codparreci: string;
   codcuereci: string;
   asierefe: number;
}
