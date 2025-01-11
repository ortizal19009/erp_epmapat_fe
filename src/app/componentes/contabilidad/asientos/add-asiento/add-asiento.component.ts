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

@Component({
   selector: 'app-add-asiento',
   templateUrl: './add-asiento.component.html',
   styleUrls: ['./add-asiento.component.css']
})
export class AddAsientoComponent implements OnInit {

   formAsiento: FormGroup;
   _beneficiarios: any[] = [];
   date: Date = new Date();
   _documentos: any;
   tipcom: number;
   idbene: number | null;

   documento: Documentos = new Documentos;
   beneficiario: Beneficiarios = new Beneficiarios;

   constructor(private router: Router, private fb: FormBuilder, private beneService: BeneficiariosService,
      public authService: AutorizaService, private docuService: DocumentosService, private asiService: AsientosService) { }

   ngOnInit(): void {
      sessionStorage.setItem('ventana', '/asientos');
      let coloresJSON = sessionStorage.getItem('/asientos');
      if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));

      this.documento.intdoc = 1;

      this.formAsiento = this.fb.group({
         asiento: '',
         fecha: '',
         tipasi: 2,
         tipcom: ['', [Validators.required]],
         compro: ['', Validators.required, this.valCompro.bind(this)],
         numcue: 0,
         totdeb: 0,
         totcre: 0,
         numdocban: null,
         cerrado: 0,
         swretencion: 0,
         totalspi: 0,
         intdoc: this.documento,
         numdoc: ['', [Validators.required]],
         idbene: ['', [Validators.required], [this.valBenefi.bind(this)]],
         glosa: '',
         idcueban: '',
         usucrea: this.authService.idusuario,
         feccrea: this.date
      },
         { updateOn: "blur" });

      this.ultimafecha();
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

   ultimafecha() {
      this.asiService.obtenerUltimaFecha().subscribe({
         next: x => this.formAsiento.patchValue({ fecha: x }),
         error: err => console.error('Error al obtener la última fecha', err.error)
      });
   }

   listarDocumentos() {
      this.docuService.getListaDocumentos().subscribe({
         next: datos => {
            this._documentos = datos;
            this.formAsiento.patchValue({ intdoc: 1 });
         },
         error: err => console.error(err.error)
      });
   }

   benefixNombre(e: any) {
      if (e.target.value != '') {
         this.beneService.findByNomben(e.target.value).subscribe({
            next: datos => this._beneficiarios = datos,
            error: err => console.error(err.error),
         });
      }
   }
   onBenefiSelected(e: any) {
      const selectedOption = this._beneficiarios.find((x: { nomben: any; }) => x.nomben === e.target.value);
      if (selectedOption) this.idbene = selectedOption.idbene;
      else this.idbene = null;
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

   saveAsiento() {
      this.asiService.siguienteNumero().subscribe(numero => {
         const siguienteNumero = numero;
         this.formAsiento.value.asiento = siguienteNumero;

         this.documento.intdoc = this.formAsiento.get('intdoc')!.value;
         this.formAsiento.value.intdoc = this.documento;

         this.beneficiario.idbene = this.idbene!;
         this.formAsiento.value.idbene = this.beneficiario;

         this.asiService.saveAsiento(this.formAsiento.value).subscribe({
            next: datos => {
               let buscaDesdeNum = siguienteNumero - 10;
               if (buscaDesdeNum <= 0) buscaDesdeNum = 1;
               sessionStorage.setItem('buscaDesdeNum', buscaDesdeNum.toString());
               sessionStorage.setItem('buscaHastaNum', siguienteNumero.toString());
               this.regresar();
            },
            error: err => console.error(err.error),
         });
      });
   }

   regresar() { this.router.navigate(['/asientos']); }

   valCompro(control: AbstractControl) {
      return this.asiService.valCompro(this.tipcom, control.value)
         .pipe(
            map(result => result ? { existe: true } : null)
         );
   }

   //Valida que se haya seleccionado un Beneficiario
   valBenefi(control: AbstractControl) {
      if (this.idbene == null) return of({ 'invalido': true });
      else return of(null);
   }

}
