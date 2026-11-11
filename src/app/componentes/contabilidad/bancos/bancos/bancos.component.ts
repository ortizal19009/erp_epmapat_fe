import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
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

   movimientoSeleccionado: any = null;
   guardandoMovimiento = false;
   guardandoConciliacion = false;
   errorBancos = '';
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
      private docuService: DocumentosService, private conciService: ConciliabanService,
      private authService: AutorizaService) { }

   ngOnInit(): void {
      sessionStorage.setItem('ventana', '/bancos');
      let coloresJSON = sessionStorage.getItem('/bancos');
      if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));
      else this.buscaColor();


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
      this.listarBancos();
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

   async buscaColor() {
      try {
         const datos = await this.coloresService.setcolor(this.authService.idusuario, 'bancos');
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
            this._bancos = Array.isArray(datos) ? datos : [];
            this.formBancos.controls['idcuenta'].setValue(this._bancos[0]?.idcuenta ?? '');
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
      const previousMesConcili = transaci.mesconcili;
      const previousConcili = transaci.swconcili;
      const mes = Number(this.formBancos.value.mes);
      if (e.target.checked && (!Number.isInteger(mes) || mes < 1 || mes > 12)) {
         e.target.checked = previousConcili === 1;
         return;
      }
      transaci.swconcili = e.target.checked ? 1 : 0;
      transaci.mesconcili = e.target.checked ? mes : 0;
      const ahora = new Date();
      const fecha = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}-${String(ahora.getDate()).padStart(2, '0')}`;
      this.updateTransaci({ inttra: transaci.inttra, swconcili: transaci.swconcili,
         mesconcili: transaci.mesconcili, usumodi: this.authService.idusuario, fecmodi: fecha }, () => {
         transaci.mesconcili = previousMesConcili;
         transaci.swconcili = previousConcili;
         e.target.checked = previousConcili === 1;
         e.target.style.border = 'red 1px solid';
      });
      e.target.style.border = 'green 1px solid';
      setTimeout(() => {
         e.target.style.border = '';
      }, 1000);
   }

   updateTransaci(transaci: any, onError?: () => void) {
      this.tranService.updateTransaci(transaci).subscribe({
         next: datos => { },
         error: (e) => {
            onError?.();
            console.error(e);
         },
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
      this.conciliaban = null;
      this.errorBancos = '';
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
               banerrores: this.conciliaban.banerrores ?? 0,
               observa: this.conciliaban.observa,
            });
            this.changeLibros();
            this.changeBanco();
         },
         error: err => { this.conciliaban = null; this.errorBancos = err.status === 404 ? 'No existe conciliacion para la cuenta y mes seleccionados.' : 'No se pudo consultar la conciliacion.'; }
      })
   }

   changeLibros() {
      this.formConcilia.patchValue({
         libsaldo: Math.round((Number(this.formConcilia.value.libfinal || 0) - Number(this.formConcilia.value.libdepositos || 0) + Number(this.formConcilia.value.libcheques || 0) + Number(this.formConcilia.value.liberrores || 0)) * 100) / 100
      })
   }

   changeBanco() {
      const v = this.formConcilia.value;
      const final = Number(v.baninicial || 0) - Number(v.bandebitos || 0) + Number(v.bancreditos || 0);
      this.formConcilia.patchValue({
         banfinal: Math.round(final * 100) / 100,
         bansaldo: Math.round((final - Number(v.bancheaa || 0) - Number(v.bannc || 0) + Number(v.bannd || 0) + Number(v.banerrores || 0)) * 100) / 100,
      });
   }

   modificar(transaci: any) {
      this.movimientoSeleccionado = transaci;
      this.errorBancos = '';
      this.formTransaci.patchValue({
         intdoc: transaci.intdoc?.intdoc ?? null,
         numdoc: transaci.numdoc,
         descri: transaci.descri,
      });
   }

   guardarConciliacion() {
      if (!this.conciliaban?.idconcilia || this.guardandoConciliacion || this.formConcilia.invalid) return;
      const cuenta = Number(this.formBancos.value.idcuenta);
      const mes = Number(this.formBancos.value.mes);
      if (Number(this.conciliaban.idcuenta?.idcuenta) !== cuenta || Number(this.conciliaban.mes) !== mes) {
         this.errorBancos = 'La cuenta o mes cambio. Consulte nuevamente la conciliacion.'; return;
      }
      const cambio: any = { idconcilia: this.conciliaban.idconcilia, idcuenta: { idcuenta: cuenta }, mes,
         observa: this.formConcilia.value.observa };
      for (const campo of ['libinicial', 'libdebitos', 'libcreditos', 'libdepositos', 'libcheques', 'liberrores',
         'baninicial', 'bancreditos', 'bandebitos', 'bancheaa', 'bannc', 'bannd', 'banerrores']) {
         cambio[campo] = Number(this.formConcilia.value[campo] || 0);
         if (!Number.isFinite(cambio[campo])) { this.errorBancos = 'Revise los importes de la conciliacion.'; return; }
      }
      this.guardandoConciliacion = true; this.errorBancos = '';
      this.conciService.updateConciliaBan(cambio).subscribe({
         next: datos => {
            this.conciliaban = datos; this.guardandoConciliacion = false;
            document.querySelector<HTMLButtonElement>('#conciliacion button[data-dismiss="modal"]')?.click();
         },
         error: error => {
            this.guardandoConciliacion = false;
            this.errorBancos = error?.error?.message || 'No se pudo guardar la conciliacion. Intente nuevamente.';
         },
      });
   }

   guardarCambiosMovimiento() {
      if (!this.movimientoSeleccionado || this.guardandoMovimiento || this.formTransaci.invalid) return;
      const ahora = new Date();
      const fecha = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}-${String(ahora.getDate()).padStart(2, '0')}`;
      const valores = this.formTransaci.value;
      const movimiento = this.movimientoSeleccionado;
      const cambio = { inttra: movimiento.inttra,
         intdoc: valores.intdoc ? { intdoc: Number(valores.intdoc) } : null,
         numdoc: valores.numdoc, descri: valores.descri, usumodi: this.authService.idusuario, fecmodi: fecha };
      this.guardandoMovimiento = true;
      this.errorBancos = '';
      this.tranService.updateTransaci(cambio as any).subscribe({
         next: (datos: any) => {
            Object.assign(movimiento, { numdoc: cambio.numdoc, descri: cambio.descri,
               intdoc: datos?.intdoc ?? this._documentos?.find((d: any) => Number(d.intdoc) === Number(valores.intdoc)) ?? movimiento.intdoc });
            this.guardandoMovimiento = false;
            this.formTransaci.markAsPristine();
            document.querySelector<HTMLButtonElement>('#modificar button[data-dismiss="modal"]')?.click();
         },
         error: (error) => {
            this.guardandoMovimiento = false;
            this.errorBancos = error?.error?.message || 'No se pudo guardar el movimiento. Intente nuevamente.';
         },
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
