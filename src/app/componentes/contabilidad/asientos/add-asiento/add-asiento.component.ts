import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { map } from 'rxjs';
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
   _beneficiarios: any;
   date: Date = new Date();
   _documentos: any;
   tipcom: number;

   beneficiario: Beneficiarios = new Beneficiarios;
   documento: Documentos = new Documentos;

   constructor(private beneService: BeneficiariosService, private router: Router, private fb: FormBuilder,
      private docuService: DocumentosService, private asiService: AsientosService) { }

   ngOnInit(): void {
      sessionStorage.setItem('ventana', '/asientos');
      let coloresJSON = sessionStorage.getItem('/asientos');
      if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));

      this.documento.iddocumento = 1;

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
         cerrado: false,
         swretencion: false,
         totalspi: 0,
         iddocumento: this.documento,
         // iddocumento: 1,
         numdoc: ['', [Validators.required]],
         idbene: ['', [Validators.required]],
         glosa: '',
         idcueban: '',
         usucrea: 1,
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
            this.formAsiento.patchValue({ iddocumento: 1 });
         },
         error: err => console.error(err.error)
      });
   }

   benefixNombre(e: any) {
      if (e.target.value != '') {
         this.beneService.findByNombre(e.target.value).subscribe({
            next: datos => this._beneficiarios = datos,
            error: err => console.error(err.error),
         });
      }
   }

   get f() { return this.formAsiento.controls; }

   changeTipcom() {
      let ultimoCompro: number;
      this.formAsiento.get('tipcom')!.valueChanges.subscribe(tipcomValue => {
         this.tipcom = tipcomValue;
         this.asiService.obtenerUltimoCompro(this.tipcom).subscribe(resp => {
            ultimoCompro = resp;
            this.formAsiento.patchValue({ compro: ultimoCompro + 1 })
         });
      });
   }

   saveAsiento() {
      this.asiService.siguienteNumero().subscribe(numero => {
         const siguienteNumero = numero;
         this.formAsiento.value.asiento = siguienteNumero;

         this.documento.iddocumento = this.formAsiento.get('iddocumento')!.value;
         this.formAsiento.value.iddocumento = this.documento;
         
         this.beneficiario.idbene = this._beneficiarios[0].idbene;
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

}
