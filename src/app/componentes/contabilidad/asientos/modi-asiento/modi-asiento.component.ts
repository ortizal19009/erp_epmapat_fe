import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { map, of } from 'rxjs';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { Documentos } from 'src/app/modelos/administracion/documentos.model';
import { Beneficiarios } from 'src/app/modelos/contabilidad/beneficiarios.model';
import { DocumentosService } from 'src/app/servicios/administracion/documentos.service';
import { AsientosService } from 'src/app/servicios/contabilidad/asientos.service';
import { BeneficiariosService } from 'src/app/servicios/contabilidad/beneficiarios.service';
import { TransaciService } from 'src/app/servicios/contabilidad/transaci.service';

@Component({
   selector: 'app-modi-asiento',
   templateUrl: './modi-asiento.component.html',
   styleUrls: ['./modi-asiento.component.css']
})
export class ModiAsientoComponent implements OnInit {

   formAsiento: FormGroup;
   tipcom: number;
   _beneficiarios: any;
   _documentos: any;
   idasiento: number;
   asiento: number;
   antcompro: number;
   swmodibene: boolean = false;
   idbene: number;

   beneficiario: Beneficiarios = new Beneficiarios;

   constructor(private beneService: BeneficiariosService, private router: Router, private fb: FormBuilder, public authService: AutorizaService,
      private docuService: DocumentosService, private asiService: AsientosService, private tranService: TransaciService) { }

   ngOnInit(): void {
      sessionStorage.setItem('ventana', '/asientos');
      let coloresJSON = sessionStorage.getItem('/asientos');
      if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));

      this.idasiento = +sessionStorage.getItem("idasientoToModi")!;
      let documento: Documentos = new Documentos();
      let date: Date = new Date();
      this.formAsiento = this.fb.group({
         asiento: '',
         fecha: '',
         tipasi: '',
         tipcom: '',
         compro: ['', Validators.required, this.valCompro.bind(this)],
         intdoc: documento,
         numdoc: [null, [Validators.required, Validators.minLength(1)]],
         idbene: [null, Validators.required, this.valBenefi.bind(this)],
         glosa: '',
         totdeb: '',
         totcre: '',
         numcue: '',
         swretencion: '',
         totalspi: '',
         // tramite: '', OJO: No se usan pero están como obligatorios
         usucrea: '',
         feccrea: '',
         usumodi: this.authService.idusuario,
         fecmodi: date
      },
         { updateOn: "blur" });

      this.datosAsiento();
      this.listaDocumentos();
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
      this.asiService.getById(this.idasiento).subscribe({
         next: datos => {
            this.asiento = datos.asiento;
            this.tipcom = datos.tipcom;
            this.antcompro = datos.compro;
            this.idbene = datos.idbene.idbene;
            this.formAsiento.patchValue({
               asiento: datos.asiento,
               fecha: datos.fecha,
               tipasi: datos.tipasi,
               tipcom: datos.tipcom,
               compro: datos.compro,
               intdoc: datos.intdoc,
               numdoc: datos.numdoc,
               idbene: datos.idbene.nomben,
               glosa: datos.glosa,
               totdeb: datos.totdeb,
               totcre: datos.totcre,
               numcue: datos.numcue,
               swretencion: datos.swretencion,
               totalspi: datos.totalspi,
               usucrea: datos.usucrea,
               feccrea: datos.feccrea
            });
            //Dependiendo de si ya tiene transacciones habilita o deshabilita fecha y tipo de asiento
            this.tranService.porIdasiento(this.idasiento).subscribe({
               next: resp => {
                  if (resp) {
                     this.formAsiento.get('fecha')!.disable();
                     this.formAsiento.get('tipasi')!.disable();
                  }
                  else {
                     this.formAsiento.get('fecha')!.enable();
                     this.formAsiento.get('tipasi')!.enable();
                  };
               },
               error: err => console.error('Al buscar si el Asiento tiene Transacciones: ', err.error),
            });

         },
         error: err => console.error(err.error)
      });
   }

   listaDocumentos() {
      this.docuService.getListaDocumentos().subscribe({
         next: datos => {
            // const intdoc = this.formAsiento.value.intdoc;
            // console.log('this.asiento: ', this.asiento)
            // const intdoc = this.asiento.intdoc;
            // console.log('this.intdoc: ', this.intdoc)
            // const defaDocumento = datos.find(registro => registro.intdoc == this.intdoc);
            // this.f['intdoc'].setValue(defaDocumento!.intdoc)
            this._documentos = datos
         },
         error: err => console.error(err.error),
      });
   }

   listarxNombre(e: any) {
      if (e.target.value != '') {
         this.beneService.findByNomben(e.target.value).subscribe({
            next: datos => {
               this.swmodibene = true;
               this._beneficiarios = datos;
            },
            error: err => console.error(err.error),
         });
      }
   }

   get f() { return this.formAsiento.controls; }

   changeTipcom() {
      let ultimoCompro: number;
      this.formAsiento.get('tipcom')!.valueChanges.subscribe(tipcomValue => {
         this.tipcom = tipcomValue;
         this.asiService.obtenerUltimoCompro(this.tipcom).subscribe({
            next: resp => {
               ultimoCompro = resp;
               this.formAsiento.patchValue({ compro: ultimoCompro + 1 })
            },
            error: err => { console.error(err.error) }
         });
      });
   }

   onSubmit() {
      if (this.swmodibene) this.beneficiario.idbene = this._beneficiarios[0].idbene;
      else this.beneficiario.idbene = this.idbene;
      this.f['idbene'].setValue(this.beneficiario);
      this.actualiza();
   }

   actualiza() {
      //Con getRawValue() porque los deshabilitados no se incluyen en el formulario 
      this.asiService.updateAsiento(this.idasiento, this.formAsiento.getRawValue()).subscribe({
         next: datos => this.retornar(),
         error: err => console.error(err.error),
      });
   }

   compararDocumentos(o1: Documentos, o2: Documentos): boolean {
      if (o1 === undefined && o2 === undefined) { return true; }
      else {
         return o1 === null || o2 === null || o1 === undefined || o2 === undefined ? false : o1.intdoc === o2.intdoc;
      }
   }

   retornar() { this.router.navigate(['/asientos']); }

   valCompro(control: AbstractControl) {
      return this.asiService.valCompro(this.tipcom, control.value)
         .pipe(
            map(result => result && control.value != this.antcompro ? { existe: true } : null)
         );
   }

   //Valida que se haya seleccionado un Beneficiario
   valBenefi(control: AbstractControl) {
      if (this.idbene == null) return of({ 'invalido': true });
      else return of(null);
   }

}
