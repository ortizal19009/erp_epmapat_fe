import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { ColoresService } from 'src/app/compartida/colores.service';
import { Documentos } from 'src/app/modelos/administracion/documentos.model';
import { Asientos } from 'src/app/modelos/contabilidad/asientos.model';
import { Beneficiarios } from 'src/app/modelos/contabilidad/beneficiarios.model';
import { Benextran } from 'src/app/modelos/contabilidad/benextran.model';
import { Cuentas } from 'src/app/modelos/contabilidad/cuentas.model';
import { Transaci } from 'src/app/modelos/contabilidad/transaci.model';
import { DocumentosService } from 'src/app/servicios/administracion/documentos.service';
import { AsientosService } from 'src/app/servicios/contabilidad/asientos.service';
import { BenextranService } from 'src/app/servicios/contabilidad/benextran.service';
import { CuentasService } from 'src/app/servicios/contabilidad/cuentas.service';
import { PagoscobrosService } from 'src/app/servicios/contabilidad/pagoscobros.service';
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
   tiptran: { numero: number; nombre: string, cabecera1: string, cabecera2: string };
   nomben: string;
   nomDebcre: string = 'Haber';
   formTransaci: FormGroup;
   _cuentas: any[] = [];
   idcuenta: number | null;
   _documentos: any;
   _benextran: any[] = []
   liquida: number[] = [0];
   swinvalido: boolean;
   suma: number;

   asiento: Asientos = new Asientos();
   documento: Documentos = new Documentos();
   cuenta: Cuentas = new Cuentas();
   beneficiario: Beneficiarios = new Beneficiarios();

   constructor(private coloresService: ColoresService, private asiService: AsientosService, private router: Router, public authService: AutorizaService,
      private fb: FormBuilder, private cueService: CuentasService, private tranService: TransaciService, private docuService: DocumentosService,
      private bxtService: BenextranService, private pagcobService: PagoscobrosService) { }

   ngOnInit(): void {
      sessionStorage.setItem('ventana', '/liquiacfp');
      let coloresJSON = sessionStorage.getItem('/liquiacfp');
      if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));
      else this.buscaColor();

      const datosToAddtransaci = JSON.parse(sessionStorage.getItem("datosToAddtransaci")!);
      this.idasiento = datosToAddtransaci.idasiento;
      this.asiento.idasiento = this.idasiento;
      this.totDebe = datosToAddtransaci.totDebe;
      this.totHaber = datosToAddtransaci.totHaber;
      const tiptranInfo = nombreTiptran(datosToAddtransaci.tiptran);
      this.tiptran = { numero: datosToAddtransaci.tiptran, nombre: tiptranInfo.nombre, cabecera1: tiptranInfo.cabecera1, cabecera2: tiptranInfo.cabecera2 };
      // console.log('this.tiptran: ', this.tiptran);
      let debcre = 2;   //tiptran 8,9 y 10 => Haber  11 y 12 => Debe
      if (this.tiptran.numero > 10) { debcre = 1; this.nomDebcre = 'Debe'; };

      let date: Date = new Date();
      this.formTransaci = this.fb.group({
         orden: +datosToAddtransaci.orden,
         codcue: '',
         nomcue: ['', Validators.required],
         debcre: debcre,
         valor: ['', Validators.required],
         idcuenta: ['', Validators.required, this.valCuenta.bind(this)],
         intdoc: this.documento,
         numdoc: ['', Validators.required],
         idbene: this.beneficiario,
         idasiento: this.asiento,
         tiptran: 8,
         totbene: 0,
         descri: '',
         swconcili: 0,
         usucrea: this.authService.idusuario,
         feccrea: date,
         nomben: ''
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

   datosAsiento() {
      this.asiService.unAsiento(this.idasiento).subscribe({
         next: datos => {
            this.iAsiento.asiento = datos.asiento;
            this.iAsiento.fecha = datos.fecha;
            this.iAsiento.comprobante = this.codcomprobante(datos.tipcom) + datos.compro.toString();
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
         this.f['codcue'].setValue(selectedOption.codcue);
         this.formTransaci.controls['nomcue'].setValue(selectedOption.nomcue);
      }
      else {
         this.idcuenta = null;
         this.formTransaci.controls['nomcue'].setValue('');
      };
   }

   cuentasxTiptran(e: any) {
      if (e.target.value != '') {
         this.cueService.getByTiptran(this.tiptran.numero - 6, e.target.value).subscribe({
            next: datos => this._cuentas = datos,
            error: err => console.error(err.error),
         });
      }
   }

   blurNomben() { this.nomben = this.formTransaci.get('nomben')!.value; }

   //Anticipos, CxC, F.Terceros y CxP de la cuenta seleccionada
   acfp() {
      const hasta = new Date(this.iAsiento.fecha);
      let nomben: string = '';
      if (this.nomben != null) nomben = this.nomben
      this.bxtService.getACFP(hasta, nomben, this.tiptran.numero - 6, this._cuentas[0].codcue).subscribe({
         next: datos => {
            this._benextran = datos;
            this.liquida = new Array(this._benextran.length).fill('');
            this.formTransaci.controls['valor'].setValue('');
         },
         error: err => console.error(err.error)
      });
   }

   dobleclick(i: number) {
      this.liquida[i] = this._benextran[i].valor - this._benextran[i].totpagcob;
      this._benextran[i].pagocobro = 1;
      this.totales();
      this.formTransaci.controls['valor'].setValue(this.suma);
   }

   changeValor(i: number) {
      this.swinvalido = false;
      if (this.liquida[i] > this._benextran[i].valor - this._benextran[i].totpagcob) {
         this.swinvalido = true;
         this._benextran[i].pagocobro = 2;
      } else {
         if (this.liquida[i] == 0) this._benextran[i].pagocobro = 0;
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
      for (let i = 0; i < this.liquida.length; i++) {
         if (this._benextran[i].pagocobro == 2) this.swinvalido = true
         else {
            v = +this.liquida[i];
            this.suma = this.suma + v;
         }
      }
   }

   regresar() { this.router.navigate(['/transaci']); }

   onSubmit() {
      const filteredBenextran = this._benextran.filter((x, index) => this.liquida[index] > 0);
      const filteredLiquida = this.liquida.filter((y, index) => this.liquida[index] > 0);
      this.cuenta.idcuenta = this._cuentas[0].idcuenta;
      this.formTransaci.value.idcuenta = this.cuenta;
      this.documento.intdoc = this.formTransaci.get('intdoc')!.value;
      this.formTransaci.value.intdoc = this.documento;
      this.formTransaci.value.totbene = 1;
      this.beneficiario.idbene = filteredBenextran[0].idbene.idbene;
      this.formTransaci.value.idbene = this.beneficiario;

      this.tranService.saveTransa(this.formTransaci.value).subscribe({
         next: (resp) => {
            //Añade a Pagoscobros
            const _resp = resp as Transaci;  //Transacción que se guarda
            for (let i = 0; i < filteredBenextran.length; i++) {
               let iPagoscobros = {} as interfacePagoscobros;
               iPagoscobros.inttra = _resp;
               this.beneficiario.idbene = filteredBenextran[i].idbene.idbene;
               iPagoscobros.idbene = this.beneficiario;
               iPagoscobros.idbenxtra = filteredBenextran[i];
               iPagoscobros.valor = filteredLiquida[i];
               this.pagcobService.save(iPagoscobros).subscribe({
                  next: () => {  //Aqui actualizar benextran.totpagcob
                     filteredBenextran[i].totpagcob = filteredBenextran[i].totpagcob + filteredLiquida[i];
                     this.bxtService.updateBenextran(filteredBenextran[i].idbenxtra, filteredBenextran[i]).subscribe({
                        next: () => console.log('Actualizado benextran.totpagcob'),
                        error: err => console.error('Error al actualizar benextran.totpagcob: ', err.error)
                     });
                  },
                  error: err => console.error('Al guardar pagoscobros: ', err.error)
               });
            }
            //Actualiza Totales del Asiento
            if (this.formTransaci.get('debcre')!.value == 1) this.totDebe = this.totDebe + +this.formTransaci.get('valor')!.value
            else this.totHaber = this.totHaber + +this.formTransaci.get('valor')!.value
       /*      this.asiService.updateTotdebAndTotcre(this.idasiento, +this.totDebe, +this.totHaber).subscribe({
               next: () => this.regresar(),
               error: err => console.error(err.error)
            }); */
         },
         error: (error) => {
            console.error('Error al guardar transaci:', error);
         }
      });
   }

   //Valida Cuenta
   valCuenta() {
      if (this.idcuenta == null) return of({ 'invalido': true });
      else return of(null);
   }

   codcomprobante(tipcom: number): string {
      if (tipcom == 1) return 'I-';
      if (tipcom == 2) return 'E-';
      if (tipcom == 3) return 'DC-';
      if (tipcom == 4) return 'DI-';
      if (tipcom == 5) return 'DE-';
      return '';
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

interface interfacePagoscobros {
   idpagcob: number;
   inttra: Transaci;
   idbene: Beneficiarios;
   idbenxtra: Benextran;
   valor: number;
   intpre: number;
   codparreci: string;
   codcuereci: string;
   asierefe: number;
}

//Nombre del Tipo de Transacción (restado 6)
function nombreTiptranOld(tiptran: number) {
   if (tiptran == 8) return 'Liquidación de Anticipo(s)';
   if (tiptran == 9) return 'Cobro(s)';
   if (tiptran == 10) return 'Cobro(s) del año anterior';
   if (tiptran == 11) return 'Liquidación de Fondos de Terceros';
   if (tiptran == 12) return 'Pago(s)';
   return '(Ninguno)';
}

function nombreTiptran(tiptran: number): { nombre: string, cabecera1: string, cabecera2: string } {
   if (tiptran == 8) return { nombre: 'Liquidación de Anticipo(s)', cabecera1: 'Anticipo', cabecera2: 'Liquida' };
   if (tiptran == 9) return { nombre: 'Cobro(s)', cabecera1: 'CxC', cabecera2: 'Cobro' };
   if (tiptran == 10) return { nombre: 'Cobro(s) del año anterior', cabecera1: 'CxC AA', cabecera2: 'Cobro' };
   if (tiptran == 11) return { nombre: 'Liquidación de Fondos de Terceros', cabecera1: 'F.Terceros', cabecera2: 'Liquida' };
   if (tiptran == 12) return { nombre: 'Pago(s)', cabecera1: 'CxP', cabecera2: 'Pago' };
   return { nombre: '(Ninguno)', cabecera1: 'Error', cabecera2: ' ' };
}

function formatNumber(num: number) {
   return num.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
}