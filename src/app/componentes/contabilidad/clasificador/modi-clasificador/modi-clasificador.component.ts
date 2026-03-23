import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { map, of } from 'rxjs';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { ClasificadorService } from 'src/app/servicios/clasificador.service';

@Component({
   selector: 'app-modi-clasificador',
   templateUrl: './modi-clasificador.component.html',
   styleUrls: ['./modi-clasificador.component.css']
})

export class ModiClasificadorComponent implements OnInit {

   formClasificador: FormGroup;
   intcla: number;
   antcodpar: String;
   codgrupo: String;

   constructor(public fb: FormBuilder, private router: Router,
      public authService: AutorizaService, private clasifService: ClasificadorService) { }

   ngOnInit() {
      sessionStorage.setItem('ventana', '/clasificador');
      let coloresJSON = sessionStorage.getItem('/clasificador');
      if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));

      this.intcla = +sessionStorage.getItem("intclaToModi")!;

      this.formClasificador = this.fb.group({
         codpar: ['', [Validators.required], [this.valFormato.bind(this), this.valGrupo.bind(this), this.valCodpar.bind(this)]],
         nivpar: [''],
         grupar: [''],
         nompar: ['', [Validators.required, Validators.minLength(3)]],
         despar: '',
         usumodi: null,
         fecmodi: null,
      },
         { updateOn: "blur" }
      );
      this.buscar();
   }

   colocaColor(colores: any) {
      document.documentElement.style.setProperty('--bgcolor1', colores[0]);
      const cabecera = document.querySelector('.cabecera');
      if (cabecera) cabecera.classList.add('nuevoBG1')
      document.documentElement.style.setProperty('--bgcolor2', colores[1]);
      const detalle = document.querySelector('.detalle');
      if (detalle) detalle.classList.add('nuevoBG2');
   }

   buscar() {
      let fecha: Date = new Date();
      this.clasifService.getById(this.intcla).subscribe({
         next: datos => {
            this.antcodpar = datos.codpar;
            this.formClasificador.patchValue({
               codpar: datos.codpar,
               nivpar: datos.nivpar,
               grupar: datos.grupar,
               nompar: datos.nompar,
               despar: datos.despar,
               usumodi: this.authService.idusuario,
               fecmodi: fecha
            });
         },
         error: err => console.error(err.error)
      });
   }

   get f() { return this.formClasificador.controls; }

   actualizar() {
      this.clasifService.updateClasificador(this.formClasificador.value).subscribe(datos => {
      }, error => console.log(error));
      this.retornar();
   }

   retornar() { this.router.navigate(['clasificador']) }

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
         map(result => result && control.value != this.antcodpar ? { existe: true } : null)
      );
   }

}

