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
import { CuentasService } from 'src/app/servicios/contabilidad/cuentas.service';

@Component({
   selector: 'app-add-egreso',
   templateUrl: './add-egreso.component.html',
   styleUrls: ['./add-egreso.component.css']
})

export class AddEgresoComponent implements OnInit {

   formEgreso: FormGroup;
   _documentos: any;
   _bancos: any;
   _beneficiarios: any[] = [];
   idbene: number | null;
   _cxp: any;
   swcxp: boolean;

   constructor(private fb: FormBuilder, private router: Router, private authService: AutorizaService,
      private asiService: AsientosService, private docService: DocumentosService, private cueService: CuentasService,
      private beneService: BeneficiariosService) { }

   ngOnInit(): void {
      sessionStorage.setItem('ventana', '/egresos');
      let coloresJSON = sessionStorage.getItem('/egresos');
      if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));

      let fecha: Date = new Date();
      this.formEgreso = this.fb.group({
         asiento: '',
         fecha: fecha,
         tipasi: 3,
         tipcom: 2,
         compro: [null, [Validators.required, Validators.min(1)], this.valCompro.bind(this)],
         numcue: '',
         totdeb: 0,
         totcre: 0,
         glosa: '',
         numdoc: [null, Validators.required],
         numdocban: '',
         cerrado: 0,
         swretencion: 0,
         totalspi: 0,
         intdoc: Documentos,
         // idbene: Beneficiarios,
         idbene: ['', [Validators.required], [this.valBenefi.bind(this)]],
         idcueban: '',
         usucrea: this.authService.idusuario,
         feccrea: fecha,
      },
         { updateOn: "blur" }
      );
      this.ultimoEgreso();
      this.ultimafecha();
      this.listarDocumentos();
      this.listarBancos();
   }

   colocaColor(colores: any) {
      document.documentElement.style.setProperty('--bgcolor1', colores[0]);
      const cabecera = document.querySelector('.cabecera');
      if (cabecera) cabecera.classList.add('nuevoBG1')
      document.documentElement.style.setProperty('--bgcolor2', colores[1]);
      const detalle = document.querySelector('.detalle');
      if (detalle) detalle.classList.add('nuevoBG2');
   }

   ultimoEgreso() {
      this.asiService.obtenerUltimoCompro(2).subscribe({
         next: resp => {
            this.formEgreso.patchValue({
               compro: resp,
            });
         },
         error: err => console.error(err.error)
      });
   }

   ultimafecha() {
      this.asiService.obtenerUltimaFecha().subscribe({
         next: fec => this.formEgreso.patchValue({ fecha: fec }),
         error: err => console.error('Error al obtener la última fecha', err.error)
      });
   }

   listarDocumentos() {
      this.docService.getListaDocumentos().subscribe({
         next: datos => {
            this._documentos = datos;
            this.formEgreso.patchValue({ intdoc: 1 });
         },
         error: err => console.error(err.error)
      });
   }

   listarBancos() {
      this.cueService.getBancos().subscribe({
         next: datos => {
            this._bancos = datos;
            this.formEgreso.controls['idcueban'].setValue(this._bancos[0].idcuenta);
         },
         error: (e) => console.error(e),
      });
   }

   get f() { return this.formEgreso.controls; }

   regresar() { this.router.navigate(['/egresos']); }


   beneficiarioxNombre(e: any) {
      if (e.target.value != '') {
         this.beneService.findByNomben(e.target.value).subscribe({
            next: datos => this._beneficiarios = datos,
            error: err => console.error(err.error),
         });
      }
   }
   onBeneficiarioSelected(e: any) {
      const selectedOption = this._beneficiarios.find((x: { nomben: any; }) => x.nomben === e.target.value);
      if (selectedOption) this.idbene = selectedOption.idbene;
      else this.idbene = null;
   }

   prueba(){
console.log('this.idbene: ', this.idbene)
   }

   //Valida el número de egreso
   valCompro(control: AbstractControl) {
      return this.asiService.valCompro(2, control.value)
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
