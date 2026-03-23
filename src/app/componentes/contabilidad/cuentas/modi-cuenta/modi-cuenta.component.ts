import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { map, of } from 'rxjs';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { CuentasService } from 'src/app/servicios/contabilidad/cuentas.service';
import { NivelesService } from 'src/app/servicios/contabilidad/niveles.service';
import { TransaciService } from 'src/app/servicios/contabilidad/transaci.service';

@Component({
   selector: 'app-modi-cuenta',
   templateUrl: './modi-cuenta.component.html',
   styleUrls: ['./modi-cuenta.component.css']
})
export class ModiCuentaComponent implements OnInit {

   movimientos: boolean;
   formCuenta: any;
   idcuenta: number;
   cuenta: any;
   antcodcue: String = '';
   antnomcue: String;
   antmovcuebool: boolean;
   antnivcue: number;

   constructor(private router: Router, public fb: FormBuilder, public authService: AutorizaService,
      private cueService: CuentasService, private nivService: NivelesService, private tranService: TransaciService) { }

   ngOnInit(): void {
      sessionStorage.setItem('ventana', '/cuentas');
      let coloresJSON = sessionStorage.getItem('/cuentas');
      if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));

      const cuentaJSON = sessionStorage.getItem('cuentaToModi');
      if (cuentaJSON) { this.cuenta = JSON.parse(cuentaJSON); }

      let date: Date = new Date();
      this.formCuenta = this.fb.group({
         grucue: '',
         nomgru: '',
         nivcue: '',
         nomniv: '',
         codcue: ['', [Validators.required, Validators.minLength(this.cuenta.nivcue), Validators.maxLength(this.cuenta.nivcue)], [this.valCodcue.bind(this), this.valGrupo.bind(this)]],
         nomcue: [null, [Validators.required, Validators.minLength(3)], this.valNomcue.bind(this)],
         movcue: ['', [], this.valMovcue.bind(this)],
         asodebe: '',
         asohaber: '',
         sigef: '',
         tiptran: '',
         intgrupo: '',
         grufluefec: '',
         usumodi: this.authService.idusuario,
         fecmodi: date,
      },
         { updateOn: "blur" }
      );
      this.datosCuenta();
   }

   colocaColor(colores: any) {
      document.documentElement.style.setProperty('--bgcolor1', colores[0]);
      const cabecera = document.querySelector('.cabecera');
      if (cabecera) cabecera.classList.add('nuevoBG1')
      document.documentElement.style.setProperty('--bgcolor2', colores[1]);
      const detalle = document.querySelector('.detalle');
      if (detalle) detalle.classList.add('nuevoBG2');
   }

   get f() { return this.formCuenta.controls; }

   regresar() { this.router.navigate(['/cuentas']); }

   datosCuenta() {
      this.antcodcue = this.cuenta.codcue;
      this.antnomcue = this.cuenta.nomcue;
      this.antnivcue = this.cuenta.nivcue;
      this.antmovcuebool = false
      if (this.cuenta.movcue == 2) this.antmovcuebool = true
      // Busca el nombre del grupo
      this.cueService.getCuentaByCodcue(this.cuenta.grucue).subscribe({
         next: datos1 => {
            // Busca el nombre del Nivel
            this.nivService.getByNivcue(this.cuenta.nivcue).subscribe({
               next: datos2 => {
                  this.formCuenta.patchValue({
                     grucue: this.cuenta.grucue,
                     nomgru: datos1.nomcue,
                     nomniv: datos2.nomniv,
                     codcue: this.cuenta.codcue,
                     nomcue: this.cuenta.nomcue,
                     asodebe: this.cuenta.asodebe,
                     asohaber: this.cuenta.asohaber,
                     tiptran: this.cuenta.tiptran,
                     movcue: this.antmovcuebool,
                     sigef: this.cuenta.sigef,
                     intgrupo: this.cuenta.intgrupo,
                     grufluefec: this.cuenta.grufluefec
                  });
               },
               error: err => console.error(err.error)
            });
         },
         error: err => console.error(err.error)
      });
   }

   blurMovcue(){
      
   }

   //Valida codcue
   valCodcue(control: AbstractControl) {
      return this.cueService.valCodcue(control.value)
         .pipe(map(result => this.antcodcue != control.value && result ? { existe: true } : null));
   }

   //Valida que no se modifique el Grupo
   valGrupo(control: FormControl) {
      const grucue = this.formCuenta.get('grucue').value.toString() + '.';
      const codcue = control.value.toString().slice(0, grucue.length);
      if (grucue !== codcue) return of({ invalido: true });
      else return of(null);
   }

   //Valida nomcue
   valNomcue(control: AbstractControl) {
      return this.cueService.valNomcue(control.value)
         .pipe(map(result => control.value != this.antnomcue && result ? { existe: true } : null));
   }

   async valMovcue(control: AbstractControl) {
      let rtn = null;
      // console.log('control.value: ', control.value)
      if (control.value) {
         //Al cambiar a Movimiento valida que no tenga desagregación
         if (this.antcodcue && this.antmovcuebool != control.value) {
            try {
               let resp: any;
               resp = this.cueService.valDesagregaAsync(this.antcodcue.toString(), this.antnivcue);
               if (resp) rtn = true;
            } catch (error) { console.error(error); }
            if (rtn) return of({ 'desagrega': true })
            else return of(null)
         }
         else { return of(null) }
      }
      else {   //Al cambiar a No movimiento valida que no tenga transacciones
         // if (this.antcodcue && this.antmovcuebool != control.value) {
         if (this.antmovcuebool != control.value) {
            try {
               const resp = this.tranService.tieneTransaciAsync(this.antcodcue.toString());
               if (await resp) {
                  console.log('Devuelve true')
                  rtn = true;
                  return of({ 'movimiento': true })
               }
               else {
                  console.log('Devuelve false')
                  rtn = false;
                  return of(null)
               }

            } catch (error) { console.error(error); }
            // console.log('rtn: ', rtn)
            if (rtn) {
               console.log('Regresa movimiento:', true)
               return of({ 'movimiento': true })
            }
            else {
               console.log('Regresa null')
               return of(null)
            }
         }
         else {
            console.log('Regresa por aqui')
            return of(null)
         }
      }
   }

   valMovcueNew(control: AbstractControl) {
      let rtn = false;
      if (control.value) {
         //Al cambiar a Movimiento valida que no tenga desagregación
         if (this.antcodcue && this.antmovcuebool != control.value) {
            try {
               let resp: any;
               resp = this.cueService.valDesagregaAsync(this.antcodcue.toString(), this.antnivcue);
               if (resp) rtn = true;
            } catch (error) { console.error(error); }
            if (rtn) return of({ 'desagrega': true })
            else return of(null)
         }
         else { return of(null) }
      }
      else {   //Al cambiar a No movimiento valida que no tenga transacciones
         // if (this.antcodcue && this.antmovcuebool != control.value) {
         // console.log('if: ', this.antmovcuebool, control.value)
         if (this.antmovcuebool != control.value) {
            // console.log('Envia: ', this.antcodcue.toString())
            this.tranService.tieneTransaci(this.antcodcue.toString()).subscribe({
               next: resp => {
                  if (resp) {
                     console.log('Devuelve true');
                     rtn = true;
                     return of({ 'movimiento': true })
                  } else {
                     console.log('Devuelve false');
                     rtn = false;
                     return of(null)
                  }
                  console.log('rtn: ', rtn)
                  if (rtn) return of({ 'movimiento': true })
                  else return of(null)
               },
               error: (error) => { console.error(error); }
            });
            if (rtn != null) {
               console.log('Pasa por aqui rtn: ', rtn)
               if (rtn) return of({ 'movimiento': true })
               else return of(null)
            }
            return of(null)
         }
         else return of(null)
      }
   }

}
