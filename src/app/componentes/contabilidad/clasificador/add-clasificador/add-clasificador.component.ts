import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ClasificadorService } from 'src/app/servicios/clasificador.service';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { map, of } from 'rxjs';

@Component({
   selector: 'app-add-clasificador',
   templateUrl: './add-clasificador.component.html',
   styleUrls: ['./add-clasificador.component.css']
})

export class AddClasificadorComponent implements OnInit {

   formClasificador: FormGroup;
   codgrupo: String;

   constructor(public fb: FormBuilder, public router: Router, public authService: AutorizaService,
      private clasifService: ClasificadorService ) { }

   ngOnInit(): void {
      sessionStorage.setItem('ventana', '/clasificador');
      let coloresJSON = sessionStorage.getItem('/clasificador');
      if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));

      let date: Date = new Date();
      this.formClasificador = this.fb.group({
         codpar: ['', [Validators.required], [this.valFormato.bind(this), this.valGrupo.bind(this), this.valCodpar.bind(this)]],
         nivpar: 0,
         grupar: [''],
         nompar: ['', [Validators.required, Validators.minLength(3)]],
         despar: [''],
         cueejepresu: [''],
         presupuesto: 0,
         ejecucion: 0,
         devengado: 0,
         reforma: 0,
         asigna_ini: 0,
         usucrea: 1,
         feccrea: date,
         balancostos: 0
      },
         { updateOn: "blur" });
   }

   colocaColor(colores: any) {
      document.documentElement.style.setProperty('--bgcolor1', colores[0]);
      const cabecera = document.querySelector('.cabecera');
      if (cabecera) cabecera.classList.add('nuevoBG1')
      document.documentElement.style.setProperty('--bgcolor2', colores[1]);
      const detalle = document.querySelector('.detalle');
      if (detalle) detalle.classList.add('nuevoBG2');
   }

   regresar() { this.router.navigate(['/clasificador']); }

   guardar() {
      let h_codigo = document.getElementById("codpar") as HTMLInputElement;
      let l_codigo = h_codigo.value;
      // this.findByCodigos(l_codigo);

      let h_descripcion = document.getElementById("nompar") as HTMLInputElement;
      let l_descripcion = h_descripcion.value;

      // this.clasifService.getByNombre(l_descripcion).subscribe(datos => {
      //    this.rtn2 = 0;
      //    if (datos.length >= 1) {
      //       this.rtn2 = 1;
      //       this.nompar = l_descripcion;
      //    }
      // }, error => console.error(error));
      this.guardarCuenta();
   }

   get f() { return this.formClasificador.controls; }

   guardarCuenta(): void {
      this.clasifService.saveClasificador(this.formClasificador.value).subscribe(datos => {
         this.router.navigate(['/clasificador']);
      }, error => console.error(error));

   }

   //Valida el formato de codpar
   valFormato(control: AbstractControl) {
      let rtn = this.validateFormato(control.value);
      if (!rtn) return of({ invalido: true });
      else return of(null);
   }

   // Expresión regular para validar formato
   validateFormato(str: string): boolean {
      const regex = /^(?:\d{1,2}|\d{2}\.\d{2}|\d{2}\.\d{2}\.\d{2})$/;
      return regex.test(str);
   }

   //Valida grupo
   valGrupo(control: AbstractControl) {
      let g: number;
      switch (control.value.length) {
         case 1: return of(null);
         case 2: g = 1; break;
         case 5: g = 2; break;
         case 8: g = 5; break;
         default: return of( null );
      }
      this.codgrupo = control.value.slice(0, g);
      return this.clasifService.valCodpar(this.codgrupo).pipe(
         map(result => !result ? { grupoinvalido: true } : null)
      );
   }

   //Valida codpar
   valCodpar(control: AbstractControl) {
      return this.clasifService.valCodpar(control.value).pipe(
         map(result => result ? { existe: true } : null)
      );
   }

}

