import { Component, OnInit } from '@angular/core';
import { AbstractControl, AsyncValidatorFn, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { Documentos } from 'src/app/modelos/administracion/documentos.model';
import { Asientos } from 'src/app/modelos/contabilidad/asientos.model';
import { Beneficiarios } from 'src/app/modelos/contabilidad/beneficiarios.model';
import { Cuentas } from 'src/app/modelos/contabilidad/cuentas.model';
import { DocumentosService } from 'src/app/servicios/administracion/documentos.service';
import { AsientosService } from 'src/app/servicios/contabilidad/asientos.service';
import { CuentasService } from 'src/app/servicios/contabilidad/cuentas.service';
import { TransaciService } from 'src/app/servicios/contabilidad/transaci.service';

@Component({
   selector: 'app-add-transaci',
   templateUrl: './add-transaci.component.html',
   styleUrls: ['./add-transaci.component.css']
})
export class AddTransaciComponent implements OnInit {

   formTransaci: FormGroup;
   idasiento: number;
   iAsiento = {} as interfaceAsiento; //Interface para los datos del Asiento
   _cuentas: any[] = [];
   idcuenta: number | null;
   _documentos: any;
   totDebe: number;
   totHaber: number;
   tmp: number;

   documento: Documentos = new Documentos;
   beneficiario: Beneficiarios = new Beneficiarios;

   constructor(private router: Router, private fb: FormBuilder, private asiService: AsientosService, public authService: AutorizaService,
      private cueService: CuentasService, private docuService: DocumentosService, private tranService: TransaciService) { }

   ngOnInit(): void {
      sessionStorage.setItem('ventana', '/transaci');
      let coloresJSON = sessionStorage.getItem('/transaci');
      if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));

      const datosToAddtransaci = JSON.parse(sessionStorage.getItem("datosToAddtransaci")!);
      this.idasiento = datosToAddtransaci.idasiento;
      this.totDebe = +datosToAddtransaci.totDebe;
      this.totHaber = +datosToAddtransaci.totHaber;

      const asiento: Asientos = new Asientos;
      asiento.idasiento = this.idasiento;
      this.beneficiario.idbene = 1;
      let date: Date = new Date();
      this.formTransaci = this.fb.group({
         orden: 10,
         idcuenta: ['', Validators.required, this.valCuenta.bind(this)],
         codcue: '',
         nomcue: ['', Validators.required],
         debcre: ['', Validators.required],
         valor: ['', [Validators.required, this.decimalValidator]],
         intdoc: this.documento,
         numdoc: ['', Validators.required],
         idbene: this.beneficiario,
         idasiento: asiento,
         tiptran: 0,
         totbene: 0,
         descri: '',
         swconcili: 0,
         usucrea: this.authService.idusuario,
         feccrea: date
      },
         { updateOn: "blur" });

      this.datosAsiento();
      this.listarDocumentos();

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

   regresar() { this.router.navigate(['/transaci']); }

   datosAsiento() {
      this.asiService.unAsiento(this.idasiento).subscribe({
         next: datos => {
            this.iAsiento.asiento = datos.asiento;
            this.iAsiento.fecha = datos.fecha;
            this.iAsiento.comprobante = nomcomprobante(datos.tipcom) + datos.compro.toString();
            this.iAsiento.benefi = datos.idbene.nomben;
            this.iAsiento.documento = datos.intdoc.nomdoc + ' ' + datos.numdoc;
            this.iAsiento.intdoc = datos.intdoc.intdoc;
            this.documento.intdoc = this.iAsiento.intdoc;
            this.formTransaci.patchValue({
               intdoc: this.iAsiento.intdoc,
               numdoc: datos.numdoc,
               descri: datos.glosa
            });
         },
         error: err => console.error(err.error)
      });
   }

   cuentasxTiptran(e: any) {
      if (e.target.value != '') {
         this.cueService.findByTiptran(0, e.target.value).subscribe({
            next: datos => this._cuentas = datos,
            error: err => console.error(err.error),
         });
      }
   }
   onCuentaSelected(e: any) {
      const selectedOption = this._cuentas.find((x: { codcue: any; }) => x.codcue === e.target.value);
      if (selectedOption) {
         this.idcuenta = selectedOption.idcuenta
         this.f['codcue'].setValue(selectedOption.codcue);
         this.f['nomcue'].setValue(selectedOption.nomcue);
      }
      else {
         this.idcuenta = null;
         this.formTransaci.controls['nomcue'].setValue('');
      };
   }

   listarDocumentos() {
      this.docuService.getListaDocumentos().subscribe({
         next: datos => this._documentos = datos,
         error: (err) => console.error(err.error)
      });
   }

   onSubmit() {
      const cuenta: Cuentas = new Cuentas();
      cuenta.idcuenta = this.idcuenta!;
      this.f['idcuenta'].setValue( cuenta );

      this.documento.intdoc = this.formTransaci.get('intdoc')!.value;
      this.f['intdoc'].setValue( this.documento );

      this.f['valor'].setValue(this.tmp);

      this.tranService.saveTransa(this.formTransaci.value).subscribe({
         next: nex => {
            if (this.formTransaci.get('debcre')!.value == 1) this.totDebe = this.totDebe + +this.formTransaci.get('valor')!.value
            else this.totHaber = this.totHaber + +this.formTransaci.get('valor')!.value
            this.asiService.updateTotdebAndTotcre(this.idasiento, +this.totDebe, +this.totHaber).subscribe({
               next: resp => this.regresar(),
               error: err => console.error(err.error)
            });
            this.regresar()
         },
         error: err => console.error(err.error)
      });
   }

   //Valida que se haya seleccionado una Cuenta
   valCuenta(control: AbstractControl) {
      if (this.idcuenta == null) return of({ 'invalido': true });
      else return of(null);
   }

   decimalValidator(control: AbstractControl): ValidationErrors | null {
      const value = control.value;
      if (value === null || value === undefined || value === '') { return null; }
      const regex = /^-?\d{1,3}(,\d{3})*(\.\d{0,2})?$/;
      return regex.test(value) ? null : { invalidDecimal: true };
   }

   formatInput() {
      this.tmp = this.formTransaci.get('valor')!.value;
      let valorFormateado: string;
      let valor = this.formTransaci.get('valor')!.value;
      if (valor === '' || isNaN(valor)) valorFormateado = '';         // Comprueba si el valor está vacío o NaN
      else {
         valorFormateado = parseFloat(valor).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      }
      this.f['valor'].setValue(valorFormateado);
      // console.log("this.formTransaci.get('valor')!.value: ", this.formTransaci.get('valor')!.value)
   }

}

interface interfaceAsiento {
   asiento: number;
   fecha: Date;
   comprobante: string;
   documento: String;
   benefi: String;
   intdoc: number;
}

//Nombre Tipo de Comprobante
function nomcomprobante(tipcom: number): string {
   switch (tipcom) {
      case 1: return 'I-';
      case 2: return 'E-';
      case 3: return 'DC-';
      case 4: return 'DI-';
      case 5: return 'DE-';
      default: return '';
   }
}
