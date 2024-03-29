import { Component, OnInit } from '@angular/core';
import {
  AbstractControl,
  AsyncValidatorFn,
  FormBuilder,
  FormGroup,
  ValidationErrors,
  Validators,
} from '@angular/forms';
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
  styleUrls: ['./add-transaci.component.css'],
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

  cuenta: Cuentas = new Cuentas();
  documento: Documentos = new Documentos();
  beneficiario: Beneficiarios = new Beneficiarios();
  asiento: Asientos = new Asientos();

  constructor(
    private router: Router,
    private fb: FormBuilder,
    private asiService: AsientosService,
    private cueService: CuentasService,
    private docuService: DocumentosService,
    private tranService: TransaciService,
    private authService: AutorizaService
  ) {}

  ngOnInit(): void {
    sessionStorage.setItem('ventana', '/transaci');
    let coloresJSON = sessionStorage.getItem('/transaci');
    if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));

    const datosToAddtransaci = JSON.parse(
      sessionStorage.getItem('datosToAddtransaci')!
    );
    this.totDebe = datosToAddtransaci.totDebe;
    this.totHaber = datosToAddtransaci.totHaber;

    this.idasiento = +sessionStorage.getItem('idasientoToTransaci')!;
    this.asiento.idasiento = this.idasiento;
    this.beneficiario.idbene = 1;
    let date: Date = new Date();
    this.formTransaci = this.fb.group(
      {
        orden: 10,
        idcuenta: ['', Validators.required, this.valCuenta.bind(this)],
        codcue: '',
        nomcue: ['', Validators.required],
        debcre: ['', Validators.required],
        valor: ['', [Validators.required, this.decimalValidator]],
        iddocumento: this.documento,
        numdoc: ['', Validators.required],
        idbene: this.beneficiario,
        idasiento: this.asiento,
        tiptran: 0,
        totbene: 0,
        descri: '',
        swconcili: false,
        usucrea: this.authService.idusuario,
        feccrea: date,
      },
      { updateOn: 'blur' }
    );

    this.datosAsiento();
    this.listarDocumentos();
  }

  colocaColor(colores: any) {
    document.documentElement.style.setProperty('--bgcolor1', colores[0]);
    const cabecera = document.querySelector('.cabecera');
    if (cabecera) cabecera.classList.add('nuevoBG1');
    document.documentElement.style.setProperty('--bgcolor2', colores[1]);
    const detalle = document.querySelector('.detalle');
    if (detalle) detalle.classList.add('nuevoBG2');
  }

  get f() {
    return this.formTransaci.controls;
  }

  regresar() {
    this.router.navigate(['/transaci']);
  }

  datosAsiento() {
    this.idasiento = +sessionStorage.getItem('idasientoToTransaci')!;
    this.asiService.unAsiento(this.idasiento).subscribe({
      next: (datos) => {
        this.iAsiento.asiento = datos.asiento;
        this.iAsiento.fecha = datos.fecha;
        this.iAsiento.comprobante =
          nomcomprobante(datos.tipcom) + datos.compro.toString();
        this.iAsiento.benefi = datos.idbene.nomben;
        this.iAsiento.documento = datos.iddocumento.nomdoc + ' ' + datos.numdoc;
        this.iAsiento.iddocumento = datos.iddocumento.iddocumento;
        this.documento.iddocumento = this.iAsiento.iddocumento;
        this.formTransaci.patchValue({
          iddocumento: this.iAsiento.iddocumento,
          numdoc: datos.numdoc,
          descri: datos.glosa,
        });
      },
      error: (err) => console.error(err.error),
    });
  }

  listarDocumentos() {
    this.docuService.getListaDocumentos().subscribe({
      next: (datos) => (this._documentos = datos),
      error: (err) => console.error(err.error),
    });
  }

  cuentasxTiptran(e: any) {
    if (e.target.value != '') {
      this.cueService.getByTiptran(0, e.target.value).subscribe({
        next: (datos) => (this._cuentas = datos),
        error: (err) => console.error(err.error),
      });
    }
  }

  onCuentaSelected(e: any) {
    const selectedOption = this._cuentas.find(
      (x: { codcue: any }) => x.codcue === e.target.value
    );
    if (selectedOption) {
      this.idcuenta = selectedOption.idcuenta;
      this.formTransaci.controls['codcue'].setValue(selectedOption.codcue);
      this.formTransaci.controls['nomcue'].setValue(selectedOption.nomcue);
    } else {
      this.idcuenta = null;
      this.formTransaci.controls['nomcue'].setValue('');
    }

    // const selectedOption = event.target.value;
    // if (this._cuentas) {
    //    const cuenta = this._cuentas.find((c: { codcue: any; }) => c.codcue === selectedOption);
    //    if (cuenta) {
    //       this.formTransaci.patchValue({
    //          codcue: selectedOption,
    //          nomcue: cuenta.nomcue
    //       });
    //    }
    // }
  }

  onSubmit() {
    this.cuenta.idcuenta = this.idcuenta!;
    this.formTransaci.value.idcuenta = this.cuenta;
    this.documento.iddocumento = this.formTransaci.get('iddocumento')!.value;
    this.formTransaci.value.iddocumento = this.documento;

    // let valor: number
    // valor = +this.formTransaci.value.valor;
    // valor = +this.formTransaci.get('valor')!.value
    // console.log('typeof valor: ', typeof valor)
    let valorNumerico: number = parseFloat(
      this.formTransaci.get('valor')!.value
    );
    console.log('valorNumerico: ', valorNumerico);

    this.formTransaci.controls['valor'].setValue(this.tmp);

    this.tranService.saveTransa(this.formTransaci.value).subscribe({
      next: (nex) => {
        if (this.formTransaci.get('debcre')!.value == 1)
          this.totDebe = this.totDebe + this.formTransaci.get('valor')!.value;
        else
          this.totHaber = this.totHaber + this.formTransaci.get('valor')!.value;
        this.asiService
          .updateTotdebAndTotcre(this.idasiento, this.totDebe, this.totHaber)
          .subscribe({
            next: (resp) => this.regresar(),
            error: (err) => console.error(err.error),
          });
        this.regresar();
      },
      error: (err) => console.error(err),
    });
  }

  //Si no hay nomcue se considera cuenta inválida
  // valIdcuentaOld() {
  //    const nomcue = this.formTransaci.get('nomcue')!.value
  //    if (!nomcue) {
  //       return of({ 'invalido': true });
  //    } else {
  //       return of(null);
  //    }
  // }

  //Valida que se haya seleccionado una Cuenta
  valCuenta(control: AbstractControl) {
    if (this.idcuenta == null) return of({ invalido: true });
    else return of(null);
  }

  decimalValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (value === null || value === undefined || value === '') {
      return null;
    }
    const regex = /^-?\d{1,3}(,\d{3})*(\.\d{0,2})?$/;
    return regex.test(value) ? null : { invalidDecimal: true };
  }

  // formatInputOld() {
  //    let valor = this.formTransaci.get('valor')!.value;
  //    let valorFormateado = parseFloat(valor).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  //    this.formTransaci.get('valor')!.setValue(valorFormateado);
  // }

  formatInput() {
    this.tmp = this.formTransaci.get('valor')!.value;
    console.log('tmp: ', this.tmp);
    let valorFormateado: string;
    let valor = this.formTransaci.get('valor')!.value;
    if (valor === '' || isNaN(valor))
      valorFormateado = ''; // Comprueba si el valor está vacío o NaN
    else {
      valorFormateado = parseFloat(valor).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    }
    this.f['valor'].setValue(valorFormateado);
  }
}

interface interfaceAsiento {
  asiento: number;
  fecha: Date;
  comprobante: string;
  documento: String;
  benefi: String;
  iddocumento: number;
}

//Nombre Tipo de Comprobante
function nomcomprobante(tipcom: number): string {
  var rtn: string;
  switch (tipcom) {
    case 1:
      rtn = 'I-';
      break;
    case 2:
      rtn = 'E-';
      break;
    case 3:
      rtn = 'DC-';
      break;
    case 4:
      rtn = 'DI-';
      break;
    case 5:
      rtn = 'DE-';
      break;
    default:
      rtn = '';
  }
  return rtn;
}
