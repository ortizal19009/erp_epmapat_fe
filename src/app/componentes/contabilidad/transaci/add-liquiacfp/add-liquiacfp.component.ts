import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
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
import { BenextranService } from 'src/app/servicios/contabilidad/benextran.service';
import { CuentasService } from 'src/app/servicios/contabilidad/cuentas.service';
import { TransaciService } from 'src/app/servicios/contabilidad/transaci.service';

@Component({
   selector: 'app-add-liquiacfp',
   templateUrl: './add-liquiacfp.component.html',
   styleUrls: ['./add-liquiacfp.component.css']
})
export class AddLiquiacfpComponent implements OnInit {

   iAsiento = {} as interfaceAsiento; //Interface para los datos del Asiento
   totDebe: number;
   totHaber: number
   idasiento: number;
   formTransaci: FormGroup;
   _cuentas: any[] = [];
   idcuenta: number | null;
   _documentos: any;
   _benextran: any[] = []
   valor: number[] = [0];
   swinvalido: boolean;
   suma: number;

   asiento: Asientos = new Asientos;
   documento: Documentos = new Documentos;
   cuenta: Cuentas = new Cuentas;
   beneficiario: Beneficiarios = new Beneficiarios;

   constructor(private coloresService: ColoresService, private asiService: AsientosService, private router: Router,
      private fb: FormBuilder, private cueService: CuentasService, private tranService: TransaciService, private docuService: DocumentosService,
      private bxtService: BenextranService) { }

   ngOnInit(): void {
      sessionStorage.setItem('ventana', '/liquiacfp');
      let coloresJSON = sessionStorage.getItem('/liquiacfp');
      if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));
      else this.buscaColor();

      const datosToAddtransaci = JSON.parse(sessionStorage.getItem("datosToAddtransaci")!);
      this.totDebe = datosToAddtransaci.totDebe;
      this.totHaber = datosToAddtransaci.totHaber;

      this.idasiento = +sessionStorage.getItem('idasientoToTransaci')!;
      this.asiento.idasiento = this.idasiento;
      this.datosAsiento();

      let date: Date = new Date();
      this.formTransaci = this.fb.group({
         orden: 10,
         codcue: '',
         nomcue: ['', Validators.required],
         debcre: 2,
         valor: ['', Validators.required],
         idcuenta: ['', Validators.required, this.valCuenta.bind(this)],
         iddocumento: this.documento,
         numdoc: ['', Validators.required],
         idbene: this.beneficiario,
         idasiento: this.asiento,
         tiptran: 8,
         totbene: 0,
         descri: '',
         swconcili: false,
         usucrea: 1,
         feccrea: date
      }, { updateOn: "blur" });

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

   datosAsiento() {
      this.idasiento = +sessionStorage.getItem('idasientoToTransaci')!;
      this.asiService.unAsiento(this.idasiento).subscribe({
         next: datos => {
            this.iAsiento.asiento = datos.asiento;
            this.iAsiento.fecha = datos.fecha;
            this.iAsiento.comprobante = nomcomprobante(datos.tipcom) + datos.compro.toString();
            this.iAsiento.benefi = datos.idbene.nomben;
            this.iAsiento.documento = datos.iddocumento.nomdoc + ' ' + datos.numdoc;
            this.iAsiento.numdoc = datos.numdoc;
            this.iAsiento.iddocumento = datos.iddocumento.iddocumento;
            this.documento.iddocumento = this.iAsiento.iddocumento;
            this.formTransaci.patchValue({
               iddocumento: this.iAsiento.iddocumento,
               numdoc: datos.numdoc,
               descri: datos.glosa,
            });
            // this.aniadir();
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

   get f() { return this.formTransaci.controls; }

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

   cuentasxTiptran(e: any) {
      if (e.target.value != '') {
         this.cueService.getByTiptran(2, e.target.value).subscribe({
            next: datos => this._cuentas = datos,
            error: err => console.error(err.error),
         });
      }
   }

   onSubmit() {
      this.cuenta.idcuenta = this._cuentas[0].idcuenta;
      this.formTransaci.value.idcuenta = this.cuenta;
      this.documento.iddocumento = this.formTransaci.get('iddocumento')!.value;
      this.formTransaci.value.iddocumento = this.documento;

      this.tranService.saveTransa(this.formTransaci.value).subscribe({
         next: (resp) => {
            //Añade Beneficiario(s) (benextran)
            const _resp = resp as Transaci;  //Preferible a any
            // let items = this.formBenextran.get('items') as FormArray;
            // for (let i = 0; i < this.benes.length; i++) {
            //    let itemGroup = this.benes.at(i) as FormGroup;
            //    let iBenextran = {} as interfaceBenextran;
            //    iBenextran.idtransa = _resp;
            //    this.beneficiario.idbene = this._beneficiarios[0].idbene;
            //    iBenextran.idbene = this.beneficiario;
            //    this.documento.iddocumento = itemGroup.get('iddocumento')!.value;
            //    iBenextran.iddocumento = this.documento;
            //    let numdoc = itemGroup.get('numdoc')!.value;
            //    iBenextran.numdoc = numdoc;
            //    iBenextran.valor = itemGroup.get('valor')!.value;
            //    iBenextran.totpagcob = 0;
            //    iBenextran.pagocobro = 0;
            //    this.benextranService.saveBenextran(iBenextran).subscribe({
            //       // next: (nex) => {},
            //       error: err => console.error(err.error)
            //    });
            // }
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

   //Anticipos, CxC, F.Terceros y CxP
   acfp() {
      const hasta = new Date(this.iAsiento.fecha);
      let nomben = '';
      let tiptran = 2;
      this.bxtService.getACFP(hasta, nomben, tiptran, this._cuentas[0].codcue).subscribe({
         next: datos => {
            this._benextran = datos;
            this.valor = new Array(this._benextran.length).fill('');
            this.formTransaci.controls['valor'].setValue(0);
         },
         error: err => console.error(err.error)
      })
   }

   dobleclick(i: number) {
      this.valor[i] = this._benextran[i].valor - this._benextran[i].totpagcob;
      this._benextran[i].pagocobro = 1;
      this.totales();
      this.formTransaci.controls['valor'].setValue(this.suma);
   }

   changeValor(i: number) {
      this.swinvalido = false;
      if (this.valor[i] > this._benextran[i].valor - this._benextran[i].totpagcob) {
         this.swinvalido = true;
         this._benextran[i].pagocobro = 2;
      } else {
         if(this.valor[i] == 0) this._benextran[i].pagocobro = 0;
         else this._benextran[i].pagocobro = 1;
         this.totales();
         this.formTransaci.controls['valor'].setValue(this.suma);
      }
   }

   //Suma los valores y verifica si hay invalidos
   totales() {
      this.swinvalido = false;
      let v: number;
      this.suma = 0;
      for (let i = 0; i < this.valor.length; i++) {
         if (this._benextran[i].pagocobro == 2) this.swinvalido = true
         else {
            v = +this.valor[i];
            this.suma = this.suma + v;
         }
      }
   }

   regresar() { this.router.navigate(['/transaci']); }

   //Valida Cuenta
   valCuenta() {
      if (this.idcuenta == null) return of({ 'invalido': true });
      else return of(null);
   }

}

interface interfaceAsiento {
   asiento: number;
   fecha: Date;
   comprobante: string;
   documento: String;
   numdoc: String;
   benefi: String;
   iddocumento: number;
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
