import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { CertipresuService } from 'src/app/servicios/contabilidad/certipresu.service';
import { EjecucionService } from 'src/app/servicios/contabilidad/ejecucio.service';
import { PartixcertiService } from 'src/app/servicios/contabilidad/partixcerti.service';
import { PresupueService } from 'src/app/servicios/contabilidad/presupue.service';
import { TramipresuService } from 'src/app/servicios/contabilidad/tramipresu.service';

@Component({
   selector: 'app-prmisoxtrami',
   templateUrl: './prmisoxtrami.component.html',
   styleUrls: ['./prmisoxtrami.component.css']
})
export class PrmisoxtramiComponent implements OnInit {

   formPrmisoxtrami: FormGroup;
   formModi: FormGroup;
   idtrami: number;
   iTramite = {} as interfaceTramite; //Interface para los datos del Trámite
   _prmisoxtrami: any;
   suma: number;
   tots: number[] = [0, 0, 0, 0];
   swnuevo: boolean
   _partixcerti: any;
   intpre: number | null;
   partida: { codpar: String, saldo: number, newsaldo: number } = { codpar: '', saldo: 0, newsaldo: 0 };
   swmodificar: boolean;
   sweliminar: boolean = false;
   swnumcerti: number | null;

   constructor(private router: Router, private fb: FormBuilder, private partixcertiService: PartixcertiService,
      private tramiService: TramipresuService, private ejecuService: EjecucionService, private presuService: PresupueService,
      private certiService: CertipresuService, public authService: AutorizaService) { }

   ngOnInit(): void {
      sessionStorage.setItem('ventana', '/tramipresu');
      let coloresJSON = sessionStorage.getItem('/tramipresu');
      if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));

      this.idtrami = +sessionStorage.getItem('idtramiToPrmisoxtrami')!.toString();
      this.tramite();
      this.creaForm();
   }

   colocaColor(colores: any) {
      document.documentElement.style.setProperty('--bgcolor1', colores[0]);
      const cabecera = document.querySelector('.cabecera');
      if (cabecera) cabecera.classList.add('nuevoBG1')
      document.documentElement.style.setProperty('--bgcolor2', colores[1]);
      const detalle = document.querySelector('.detalle');
      if (detalle) detalle.classList.add('nuevoBG2');
   }

   creaForm() {
      //Form de nuevo prmisoxtrami
      this.formPrmisoxtrami = this.fb.group({
         numcerti: ['', [Validators.required, Validators.min(1)]],
         fecha: '',
         descripcion: ''
      });
   }

   tramite() {
      this.tramiService.findById(this.idtrami).subscribe({
         next: datos => {
            this.iTramite.numero = datos.numero;
            this.iTramite.fecha = datos.fecha;
            this.iTramite.docu = datos.intdoc.nomdoc + ' ' + datos.numdoc
            this.iTramite.beneficiario = datos.idbene.nomben
            this.iTramite.descri = datos.descri;
            this.prmisoxtrami();
         },
         error: (e) => console.error(e),
      });
   }

   prmisoxtrami() {
      this.ejecuService.getByIdtrami(this.idtrami).subscribe({
         next: datos => {
            this._prmisoxtrami = datos;
            this.totales();
         },
         error: (e) => console.error(e),
      });
   }

   get f() { return this.formPrmisoxtrami.controls; }

   //Totales de los compromisos del trámite
   totales() {
      this.suma = 0;
      this._prmisoxtrami.forEach((prmisoxtrami: any) => {
         this.suma = this.suma + prmisoxtrami.prmiso;
         this.partixcertiService.getById(prmisoxtrami.idparxcer).subscribe({
            next: datos => prmisoxtrami.certificacion = datos.idcerti.numero,
            error: err => console.error(err.error)
         });
      });
   }

   nuevo() {
      this.swnuevo = true;
      this.creaForm();
   }

   changeNumcerti() {
      let numcerti = this.formPrmisoxtrami.value.numcerti;
      this.certiService.getByNumero(numcerti, 1).subscribe({
         next: resp => {
            if (resp == null) {
               this.swnumcerti = 0;
            }
            else {
               this.swnumcerti = 1;
               // let idcerti = resp.idcerti;
               this.formPrmisoxtrami.controls['fecha'].setValue(resp.fecha.toString());
               this.formPrmisoxtrami.controls['descripcion'].setValue(resp.descripcion);
               this.partixcertiService.getByIdCerti(resp.idcerti).subscribe({
                  next: datos => {
                     this._partixcerti = datos;
                     // console.log('this._partixcerti: ', this._partixcerti);
                     this._partixcerti.forEach((partixcerti: any) => partixcerti.compromiso = 0);
                     this.totales1();
                  },
                  error: (e) => console.error(e),
               });
            }
         },
         error: err => console.error('Al buscar la certificación ', err.error)
      })
   }

   //Totales de los valores de las partidas de la certificación
   totales1() {
      this.tots = [0, 0, 0, 0];
      this._partixcerti.forEach((partixcerti: any) => {
         this.tots[0] = this.tots[0] + partixcerti.valor;
         this.tots[1] = this.tots[1] + (partixcerti.valor - partixcerti.totprmisos);
         this.tots[2] = this.tots[2] + +partixcerti.compromiso;
         this.tots[3] = this.tots[3] + (partixcerti.valor - partixcerti.totprmisos - partixcerti.compromiso);
      });
   }

   calcular(partixcerti: any) {
      // console.log('partixcerti.compromiso: ', partixcerti.compromiso)
      // if( compromiso > this._partixcerti.valor - this._partixcerti.totprmisos ){

      // }
      // console.log('Pasa')
      // console.log('compromiso: ', compromiso)
      this.totales1();
   }

   cancelar() {
      this.swnuevo = false;
      this.swmodificar = false;
      this.swnumcerti = null;
   }

   regresar() { this.router.navigate(['/tramipresu']); }

   modificar(prmisoxtrami: any) {
      //Form de modificar prmisoxtrami
      this.formModi = this.fb.group({
         codpar: '',
         nompar: '',
         numcerti: '',
         prmiso: '',
         descripcion: ''
      });
      this.swmodificar = true;
      this.formModi.patchValue({
         codpar: prmisoxtrami.intpre.codpar,
         nompar: prmisoxtrami.intpre.nompar,
         numcerti: prmisoxtrami.certificacion,
         prmiso: prmisoxtrami.prmiso,
         descripcion: prmisoxtrami.concep,
      });
   }

   //Datalist de codpar 
   // partidaxCodpar(e: any) {
   //    if (e.target.value != '') {
   //       this.presuService.findByCodpar(2, e.target.value).subscribe({
   //          next: datos => this._pargas = datos,
   //          error: err => console.error(err.error),
   //       });
   //    }
   // }
   // onPartidaSelected(e: any) {
   //    const selectedOption = this._pargas.find((x: { codpar: any; }) => x.codpar === e.target.value);
   //    if (selectedOption) {
   //       this.intpre = selectedOption.intpre;
   //       this.partida.saldo = selectedOption.inicia + selectedOption.totmod;
   //       this.formPrmisoxtrami.patchValue({
   //          nompar: selectedOption.nompar,
   //          saldo: selectedOption.inicia + selectedOption.totmod,
   //          valor: '',
   //          newsaldo: ''
   //       });
   //    }
   //    else this.intpre = null;
   // }

   handleClick(cuenta: any) {
   }

   // eliminar(partixcerti: Partixcerti) {
   //    this.sweliminar = false;
   //    this.partida.codpar = partixcerti.intpre.codpar;
   //    // this.tranService.porIdasiento(asiento.idasiento).subscribe({
   //    //    next: resp => {
   //    //       this.sweliminar = !resp
   //    //       this.iAsiento.idasiento = asiento.idasiento;
   //    //       this.iAsiento.asiento = asiento.asiento;
   //    //    },
   //    //    error: err => console.error('Al buscar si el Asiento tiene Transacciones: ', err.error),
   //    // });
   // }

   //Valida el número de certificación
   valNumcerti(control: AbstractControl) {
      // console.log('control.value: ', control.value);
      // this.certiService.getByNumero(control.value, 1).subscribe({
      //    next: resp => {console.log('resp: ', resp);
      //       if( resp == null ){
      //          return of({ 'noexiste': true})
      //       }
      //       return of(null);
      //    },
      //    error: err => console.error( 'Al buscar la certificación ', err.error)
      // });
      if (+control.value <= 0) return of({ 'invalido': true });
      else return of(null);
   }

   //Valida el Valor
   valValor(control: AbstractControl) {
      this.partida.newsaldo = Math.round((this.partida.saldo - +this.formPrmisoxtrami.controls['valor'].value) * 100) / 100;
      // this.partida.newsaldo = Math.round((+this.formPartixcerti.controls['saldo'].value - +this.formPartixcerti.controls['valor'].value) * 100) / 100;
      // console.log('this.partida.newsaldo (en validar): ', this.partida.newsaldo);
      this.formPrmisoxtrami.controls['newsaldo'].setValue(formatNumber2(this.partida.newsaldo));
      if (this.partida.newsaldo < 0) return of({ 'invalido': true });
      else return of(null);
   }

}

interface interfaceTramite {
   numero: number;
   fecha: Date;
   docu: string;
   beneficiario: string;
   descri: String;
}

function formatNumber2(num: number) {
   return num.toFixed(2).replace(/\./g, ',').replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}
