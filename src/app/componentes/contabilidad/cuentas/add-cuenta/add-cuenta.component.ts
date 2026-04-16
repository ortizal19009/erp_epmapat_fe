import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { map, of } from 'rxjs';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { Cuentas } from 'src/app/modelos/contabilidad/cuentas.model';
import { Niveles } from 'src/app/modelos/contabilidad/niveles.model';
import { CuentasService } from 'src/app/servicios/contabilidad/cuentas.service';
import { NivelesService } from 'src/app/servicios/contabilidad/niveles.service';

@Component({
   selector: 'app-add-cuenta',
   templateUrl: './add-cuenta.component.html',
   styleUrls: ['./add-cuenta.component.css']
})

export class AddCuentaComponent implements OnInit {

   formCuenta: FormGroup;
   _niveles: Niveles[] = [];
   grucue: string | null;
   nomgru: string | null;
   nivel: Niveles;
   nivcue: number;
   nivcuenew: number;

   niveles: Niveles = new Niveles();

   constructor(private router: Router, private fb: FormBuilder, public authService: AutorizaService,
      private cuentasService: CuentasService, private nivService: NivelesService) {
   }

   ngOnInit() {
      sessionStorage.setItem('ventana', '/cuentas');
      let coloresJSON = sessionStorage.getItem('/cuentas');
      if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));

      const addCuentaJSON = sessionStorage.getItem('addCuenta');
      if (addCuentaJSON) {
         let addCuenta = JSON.parse(addCuentaJSON);
         this.grucue = addCuenta.grucue;
         this.nomgru = addCuenta.nomgru;
         this.nivcue = +addCuenta.nivcue;
         sessionStorage.removeItem('addCuenta');
      }
      this.nivelSiguiente();
   }

   colocaColor(colores: any) {
      document.documentElement.style.setProperty('--bgcolor1', colores[0]);
      const cabecera = document.querySelector('.cabecera');
      if (cabecera) cabecera.classList.add('nuevoBG1')
      document.documentElement.style.setProperty('--bgcolor2', colores[1]);
      const detalle = document.querySelector('.detalle');
      if (detalle) detalle.classList.add('nuevoBG2');
   }

   nivelSiguiente() {
      this.nivService.getSiguienteNivcue(this.nivcue).subscribe({
         next: (nivel: Niveles) => {
            this.nivel = nivel;
            this.nivcuenew = nivel.nivcue;
            this.crearForm();
         },
         error: err => console.error(err.error)
      })
   }

   crearForm() {
      let date: Date = new Date();
      this.formCuenta = this.fb.group({
         codcue: [this.grucue + '.', [Validators.required, Validators.minLength(this.nivcuenew), Validators.maxLength(this.nivcuenew)], [this.valCodcue.bind(this), this.valGrupo.bind(this)]],
         nomcue: [null, [Validators.required, Validators.minLength(3)], this.valNomcue.bind(this)],
         grucue: this.grucue,
         nomgru: this.nomgru,
         nivcue: this.nivel.nomniv,
         idnivel: Niveles,
         movcue: 1,
         asodebe: [''],
         asohaber: [''],
         sigef: 0,
         tiptran: 0,
         intgrupo: '',
         grufluefec: '',
         usucrea: this.authService.idusuario,
         feccrea: date
      },
         { updateOn: "blur" });
   }

   get f() { return this.formCuenta.controls; }

   guardar() {
      this.formCuenta.value.nivcue = this.nivel.nivcue;
      this.niveles.idnivel = this.nivel.idnivel;
      this.formCuenta.value.idnivel = this.niveles;
      if (this.formCuenta.value.movcue == 1) this.formCuenta.value.movcue = 2
      else this.formCuenta.value.movcue = 1
      this.cuentasService.saveCuenta(this.formCuenta.value).subscribe({
         next: (nueva: Cuentas) => {
            sessionStorage.setItem('ultidcuenta', nueva.idcuenta.toString());
            this.regresar();
         },
         error: err => console.error('Al guardar la nueva cuenta: ', err.error)
      });
   }

   regresar() { this.router.navigate(['/cuentas']); }

   //Valida codcue
   valCodcue(control: AbstractControl) {
      return this.cuentasService.valCodcue(control.value)
         .pipe(map(result => result ? { existe: true } : null));
   }

   //Valida que no se modifique el Grupo
   valGrupo(control: FormControl) {
      const grucue = this.formCuenta.get('grucue')!.value.toString() + '.';
      const codcue = control.value.toString().slice(0, grucue.length);
      if (grucue !== codcue) return of({ invalido: true });
      else return of(null);
   }

   //Valida nomcue
   valNomcue(control: AbstractControl) {
      return this.cuentasService.valNomcue(control.value)
         .pipe(map(result => result ? { existe: true } : null));
   }

}
