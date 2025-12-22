import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ColoresService } from 'src/app/compartida/colores.service';
import { Documentos } from 'src/app/modelos/administracion/documentos.model';
import { Conciliaban } from 'src/app/modelos/contabilidad/conciliaban.model';
import { Transaci } from 'src/app/modelos/contabilidad/transaci.model';
import { DocumentosService } from 'src/app/servicios/administracion/documentos.service';
import { ConciliabanService } from 'src/app/servicios/contabilidad/conciliaban.service';
import { CuentasService } from 'src/app/servicios/contabilidad/cuentas.service';
import { TransaciService } from 'src/app/servicios/contabilidad/transaci.service';

@Component({
   selector: 'app-bancos',
   templateUrl: './bancos.component.html',
   styleUrls: ['./bancos.component.css']
})

export class BancosComponent implements OnInit {

   formBancos: FormGroup;
   formConcilia: FormGroup;
   formTransaci: FormGroup;
   filtro: string;
   swfiltro: boolean;
   _movibank: any;
   _bancos: any = [];
   conciliaban: any;
   _documentos: any;
   conciliaBan: Conciliaban = new Conciliaban();
   documento: Documentos = new Documentos;
   sumdebe: number;
   sumhaber: number;
   meses: any = [
      { valor: 1, nombre: 'Enero' },
      { valor: 2, nombre: 'Febrero' },
      { valor: 3, nombre: 'Marzo' },
      { valor: 4, nombre: 'Abril' },
      { valor: 5, nombre: 'Mayo' },
      { valor: 6, nombre: 'Junio' },
      { valor: 7, nombre: 'Julio' },
      { valor: 8, nombre: 'Agosto' },
      { valor: 9, nombre: 'Septiembre' },
      { valor: 10, nombre: 'Octubre' },
      { valor: 11, nombre: 'Noviembre' },
      { valor: 12, nombre: 'Diciembre' },
   ];

   constructor(private fb: FormBuilder, private router: Router, private cueService: CuentasService,
      private tranService: TransaciService, private coloresService: ColoresService,
      private docuService: DocumentosService, private conciService: ConciliabanService) { }

   ngOnInit(): void {
      sessionStorage.setItem('ventana', '/bancos');
      let coloresJSON = sessionStorage.getItem('/bancos');
      if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));
      else this.buscaColor();

      this.listarBancos();
      this.listarDocumentos();

      this.formBancos = this.fb.group({
         idcuenta: '',
         mes: 1,
      });

      this.formConcilia = this.fb.group({
         libinicial: 0,
         libdebitos: 0,
         libcreditos: 0,
         libfinal: 0,
         libdepositos: 0,
         libcheques: 0,
         liberrores: 0,
         libsaldo: 0,
         baninicial: 0,
         bancreditos: 0,
         bandebitos: 0,
         banfinal: 0,
         // bancheaa: [0,decimalValidator.bind(this)],
         // bancheaa: [0, Validators.pattern('^[0-9]*\\.[0-9]{0,2}$')],
         bancheaa:['', Validators.pattern('^[0-9]*(\.[0-9]{0,2})?$') ],


         bannc: 0,
         bannd: 0,
         banerrores: 0,
         bansaldo: 0,
         observa: ''
      });

      this.formTransaci = this.fb.group({
         intdoc: 1,
         numdoc: '',
         descri: '',
      });
   }

   colocaColor(colores: any) {
      document.documentElement.style.setProperty('--bgcolor1', colores[0]);
      const cabecera = document.querySelector('.cabecera');
      if (cabecera) cabecera.classList.add('nuevoBG1')
      document.documentElement.style.setProperty('--bgcolor2', colores[1]);
      const detalle = document.querySelector('.detalle');
      if (detalle) detalle.classList.add('nuevoBG2');
   }

   async buscaColor() {
      try {
         const datos = await this.coloresService.setcolor(1, 'bancos');
         const coloresJSON = JSON.stringify(datos);
         sessionStorage.setItem('/bancos', coloresJSON);
         this.colocaColor(datos);
      } catch (error) {
         console.error(error);
      }
   }

   listarBancos() {
      this.cueService.getBancos().subscribe({
         next: datos => {
            this._bancos = datos;
            this.formBancos.controls['idcuenta'].setValue(this._bancos[0].idcuenta);
         },
         error: (e) => console.error(e),
      });
   }

   listarDocumentos() {
      this.docuService.getListaDocumentos().subscribe({
         next: (datos) => {
            this._documentos = datos;
         },
         error: (e) => console.error(e),
      });
   }

   buscar() {
      this.tranService.getMovibank(+this.formBancos.value.idcuenta, +this.formBancos.value.mes!).subscribe({
         next: (datos) => {
            this._movibank = datos;
            this.sumdebe = 0; this.sumhaber = 0;
            this.totales();
         },
         error: (e) => console.error(e),
      });
   }

   totales() {
      this._movibank.forEach((movi: any) => {
         if (movi.debcre == 1) this.sumdebe = this.sumdebe + movi.valor;
         else this.sumhaber = this.sumhaber + movi.valor;
      });
   }

   comprobante(tipcom: number, compro: number) {
      if (tipcom == 1) return 'I-' + compro.toString();
      if (tipcom == 2) return 'E-' + compro.toString();
      if (tipcom == 3) return 'DC-' + compro.toString();
      if (tipcom == 4) return 'DI-' + compro.toString();
      if (tipcom == 5) return 'DE-' + compro.toString();
      return '';
   }

   changeFiltro() {
      if (this.filtro.trim() !== '') this.swfiltro = true;
      else this.swfiltro = false;
   }

   get f() { return this.formTransaci.controls; }

   cambioDatosCheck(e: any, transaci: any) {
      let date: Date = new Date();

      if (e.target.checked === false) {
         transaci.mesconcili = 0;
         this.updateTransaci(transaci);
      } else if (e.target.checked === true) {
         transaci.mesconcili = date.getMonth();
         //transaci.mesconcili = 1;
         this.updateTransaci(transaci);
      }
      e.target.style.border = 'green 1px solid';
      setTimeout(() => {
         e.target.style.border = '';
      }, 1000);
   }

   updateTransaci(transaci: any) {
      this.tranService.updateTransaci(transaci).subscribe({
         next: datos => { },
         error: (e) => console.error(e),
      });
   }

   mal(transaci: Transaci) {
      if (transaci.intdoc.tipdoc >= 1 && transaci.intdoc.tipdoc <= 4) {
         return false;
      } else {
         return true;
      }
   }

   conciliacion() {
      this.conciService.getByIdcuentaMes(this.formBancos.value.idcuenta, this.formBancos.value.mes).subscribe({
         next: resp => {
            this.conciliaban = resp;
            this.formConcilia.patchValue({
               // libinicial: formatNumber2(this.conciliaban.libinicial),
               libinicial: this.conciliaban.libinicial,
               // libdebitos: formatNumber2(this.conciliaban.libdebitos),
               libdebitos: this.conciliaban.libdebitos,
               // libcreditos: formatNumber2(this.conciliaban.libcreditos),
               libcreditos: this.conciliaban.libcreditos,
               libfinal: Math.round((this.conciliaban.libinicial + this.conciliaban.libdebitos - this.conciliaban.libcreditos) * 100) / 100,
               libdepositos: this.conciliaban.libdepositos,
               libcheques: this.conciliaban.libcheques,
               liberrores: this.conciliaban.liberrores,
               libsaldo: Math.round(((this.conciliaban.libinicial + this.conciliaban.libdebitos - this.conciliaban.libcreditos) - this.conciliaban.libdepositos + this.conciliaban.libcheques + this.conciliaban.liberrores) * 100) / 100,
               // ESTADO DE CUENTA DEL BANCO
               baninicial: this.conciliaban.baninicial,
               bandebitos: this.conciliaban.bandebitos,
               bancreditos: this.conciliaban.bancreditos,
               banfinal: this.conciliaban.baninicial + this.conciliaban.bancreditos - this.conciliaban.bandebitos,
               bancheaa: this.conciliaban.bancheaa,
               bannc: this.conciliaban.bannc,
               bannd: this.conciliaban.bannd,
               bansaldo: Math.round(((this.conciliaban.baninicial + this.conciliaban.bancreditos - this.conciliaban.bandebitos) - this.conciliaban.bancheaa) * 100) / 100,
               observa: this.conciliaban.observa,
            });
         },
         error: err => console.error('Al recuperar los datos de conciliban: ', err.error)
      })
   }

   changeLibros() {
      this.formConcilia.patchValue({
         libsaldo: this.formConcilia.value.libfinal + this.formConcilia.value.libcheques + this.formConcilia.value.liberrores
      })
   }

   changeBanco() {
      this.formConcilia.patchValue({
         banfinal: this.formConcilia.value.baninicial - this.formConcilia.value.bandebitos + this.formConcilia.value.bancreditos,
         bansaldo: this.formConcilia.value.banfinal - this.formConcilia.value.bancheaa - this.formConcilia.value.bannc + this.formConcilia.value.bannd + this.formConcilia.value.banerrores
      })
   }

   modificar(transaci: any) {
      this.formTransaci.patchValue({
         intdoc: transaci.intdoc.intdoc,
         numdoc: transaci.numdoc,
         descri: transaci.descri,
      });
   }

   imprimir() {
      let buscarBancos: { idcuenta: number, mes: number }
      buscarBancos = {
         idcuenta: this.formBancos.value.idcuenta,
         mes: this.formBancos.value.mes,
      };
      sessionStorage.setItem("bancosToImpExp", JSON.stringify(buscarBancos));
      this.router.navigate(['/imp-bancos']);
   }

}

//Miles: coma y decimales: punto
// function formatNumber(num: number) {
//    return num.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
// }
//Miles: espacio y decimales: punto
// function formatNumber1(num: number) {
//    return num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
// }
//Miles: espacio y decimales: coma (igual que mask='separator.2') OJO: No aceptan negativos
// function formatNumber2Old(num: number) {
//    return num.toFixed(2).replace(/\./g, ',').replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
// }

// Validador personalizado
// function decimalValidator(control: FormControl): { [key: string]: boolean } | null {
//    const regExp = new RegExp(`^-?\\d*\\.?\\d{0,2}$`);
//    return regExp.test(control.value) ? null : { decimal: true };
// }
