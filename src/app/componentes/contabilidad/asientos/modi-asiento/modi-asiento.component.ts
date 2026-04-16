import { Component, OnInit } from '@angular/core';
import { AbstractControl, AsyncValidatorFn, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { map, Observable, of, switchMap } from 'rxjs';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { Documentos } from 'src/app/modelos/administracion/documentos.model';
import { Asientos } from 'src/app/modelos/contabilidad/asientos.model';
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
   idasiento: number;
   asiento: number;
   tipcom: number;
   antcompro: number;
   documentos: Documentos[] = [];
   beneficiarios: Beneficiarios[] = [];
   idbene: number | null;
   numcuentas: number = 0;

   constructor(private beneService: BeneficiariosService, private router: Router, private fb: FormBuilder, public authService: AutorizaService,
      private docuService: DocumentosService, private asiService: AsientosService, private tranService: TransaciService) { }

   ngOnInit(): void {
      sessionStorage.setItem('ventana', '/asientos');
      let coloresJSON = sessionStorage.getItem('/asientos');
      if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));

      this.idasiento = +sessionStorage.getItem("idasientoToModi")!;
      let date: Date = new Date();
      this.formAsiento = this.fb.group({
         fecha: ['', Validators.required, this.valAño()],
         tipasi: '',
         tipcom: ['', { validators: [Validators.required], updateOn: 'change' }],
         compro: ['', Validators.required, this.valCompro()],
         intdoc: this.documentos,
         numdoc: [null, [Validators.required, Validators.minLength(1)]],
         idbene: [null, Validators.required, this.valBenefi()],
         glosa: '',
         usumodi: this.authService.idusuario,
         fecmodi: date
      }, { updateOn: "blur" });

      this.datosAsiento();
      this.listaDocumentos();
      this.changeTipcom();
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
               fecha: datos.fecha,
               tipasi: datos.tipasi,
               tipcom: datos.tipcom,
               compro: datos.compro,
               intdoc: datos.intdoc.intdoc,
               numdoc: datos.numdoc,
               idbene: datos.idbene.nomben,
               glosa: datos.glosa,
            });
            //Dependiendo de si ya tiene transacciones habilita o deshabilita fecha y tipo de asiento
            this.tranService.countByIdasiento(this.idasiento).subscribe({
               next: resp => {
                  this.numcuentas = resp;
                  if (this.numcuentas > 0) {
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
         next: (documentos: Documentos[]) => this.documentos = documentos,
         error: err => console.error(err.error),
      });
   }

   get f() { return this.formAsiento.controls; }

   // Modifica tipo de comprobante
   changeTipcom(): void {
      this.formAsiento.get('tipcom')!.valueChanges.pipe(
         switchMap(tipcomValue => {
            this.tipcom = tipcomValue;
            return this.asiService.obtenerUltimoCompro(this.tipcom);
         })
      ).subscribe({
         next: ultimo => this.formAsiento.patchValue({ compro: ultimo + 1 }),
         error: err => console.error(err.error)
      });
   }

   benefixNombre(e: any) {
      if (e.target.value != '') {
         this.beneService.findByNomben(e.target.value).subscribe({
            next: (beneficiarios: Beneficiarios[]) => this.beneficiarios = beneficiarios,
            error: err => console.error(err.error),
         });
      }
   }
   onBenefiSelected(e: any) {
      const selectedOption = this.beneficiarios.find((x: { nomben: any; }) => x.nomben === e.target.value);
      if (selectedOption) this.idbene = selectedOption.idbene;
      else this.idbene = null;
   }

   onSubmit() {
      const dto: AsientoUpdateDTO = {};   // Todos los campos opcionales
      if (this.f['fecha'].dirty) { dto.fecha = this.f['fecha'].value; }
      if (this.f['tipasi'].dirty) { dto.tipasi = this.f['tipasi'].value; }
      if (this.f['tipcom'].dirty) { dto.tipcom = this.tipcom }
      if (this.f['compro'].dirty) { dto.compro = this.f['compro'].value; }
      if (this.f['intdoc'].dirty) { dto.intdoc = { intdoc: this.formAsiento.value.intdoc }; }
      if (this.f['numdoc'].dirty) { dto.numdoc = this.f['numdoc'].value; }
      if (this.f['idbene']?.dirty) { dto.idbene = { idbene: this.idbene }; }
      if (this.f['glosa'].dirty) { dto.glosa = this.f['glosa'].value; }
      dto.usumodi = this.authService.idusuario;
      dto.fecmodi = new Date();
      this.asiService.updateAsiento(this.idasiento, dto).subscribe({
         next: (actualizado: Asientos) => {
            this.authService.swal('success', `Asiento ${actualizado.asiento} modificado con éxito`);
            this.retornar();
         },
         error: err => { console.error(err.error); this.authService.mostrarError('Error al actualizar', err.error) }
      });
   }

   retornar() { this.router.navigate(['/asientos']); }

   //Valida el año de la fecha
   valAño(): AsyncValidatorFn {
      return (control: AbstractControl): Observable<ValidationErrors | null> => {
         const datos = this.authService.getDatosEmpresa();
         const añoEmpresa = datos?.fechap?.toString().slice(0, 4);
         const añoDigitado = control.value?.toString().slice(0, 4);
         const esValido = añoEmpresa === añoDigitado;
         return of(esValido ? null : { añoinvalido: true });
      };
   }

   // Valida número de Comprobante
   valCompro(): AsyncValidatorFn {
      return (control: AbstractControl): Observable<ValidationErrors | null> => {
         return this.asiService.valCompro(this.tipcom, control.value).pipe(
            map(existe => (existe && control.value != this.antcompro ? { existe: true } : null))
         );
      };
   }

   //Valida que se haya seleccionado un Beneficiario
   valBenefi(): AsyncValidatorFn {
      return (_control: AbstractControl): Observable<ValidationErrors | null> => {
         const esValido = this.idbene != null;
         return of(esValido ? null : { invalido: true });
      };
   }

}

export interface AsientoUpdateDTO {
   fecha?: Date;
   tipasi?: number;
   tipcom?: number;
   compro?: number;
   intdoc?: { intdoc: number };
   numdoc?: String;
   idbene?: { idbene: number | null };
   glosa?: String;
   usumodi?: number;
   fecmodi?: Date;
}