import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { map } from 'rxjs';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { Modulos } from 'src/app/modelos/modulos.model';
import { Rubros } from 'src/app/modelos/rubros.model';
import { Usoitems } from 'src/app/modelos/usoitems.model';
import { CatalogoitemService } from 'src/app/servicios/catalogoitem.service';
import { ModulosService } from 'src/app/servicios/modulos.service';
import { RubrosService } from 'src/app/servicios/rubros.service';
import { UsoitemsService } from 'src/app/servicios/usoitems.service';

@Component({
   selector: 'app-add-catalogoitems', templateUrl: './add-catalogoitems.component.html', styleUrls: ['./add-catalogoitems.component.css']
})

export class AddCatalogoitemsComponent implements OnInit {

   formProdu: FormGroup;
   _modulos: any;
   _usos: any;
   idmodulo: number;
   idusoitems: number;
   formBuscaRubros: FormGroup;
   filtro: any;
   _rubros: any;
   swvalido = 1;     //Búsqueda de Rubros
   privez = true;    //Para resetear los datos de Búsqueda de Rubros

   constructor(public router: Router, private fb: FormBuilder, private moduService: ModulosService,
      private produService: CatalogoitemService, private usoService: UsoitemsService,
      private rubService: RubrosService, private authService:AutorizaService) { }

   ngOnInit(): void {
      let modulos: Modulos = new Modulos;
      let usoitems: Usoitems = new Usoitems;
      let rubro: Rubros = new Rubros;
      this.formProdu = this.fb.group({
         idmodulo: modulos,
         idusoitems_usoitems: usoitems,
         rubro: '',
         idrubro_rubros: rubro,
         descripcion: [null, [Validators.required, Validators.minLength(3)], this.valNombre.bind(this)],
         cantidad: 0, estado: 1, facturable: 1,
         usucrea: this.authService.idusuario,
         feccrea: (new Date().toISOString().substring(0, 10))
      },
         { updateOn: "blur" });

      //Combo de los Módulos (Secciones)
      this.moduService.getListaModulos().subscribe({
         next: resp => this._modulos = resp,
         error: err => console.error(err.error)
      });

      let selectmodulo = document.getElementById("selectmodulo") as HTMLSelectElement;
      selectmodulo.addEventListener("change", () => {
         this.idmodulo = +selectmodulo.value!;
         this.f['descripcion'].setValue('');
         this.f['rubro'].setValue('');
         this.usoService.getByIdmodulo(this.idmodulo).subscribe({
            next: resp => {
               this._usos = resp;
               this.formProdu.value.idusoitems = resp;
            },
            error: err => console.error(err.error)
         });
      });

      let selectuso = document.getElementById("selectuso") as HTMLSelectElement;
      selectuso.addEventListener("change", () => {
         setTimeout(() => {
            this.f['descripcion'].setValue('');
            this.formProdu.value.idusoitems_usoitems = selectuso.value;
         }, 800);
         this.idusoitems = this._usos[+selectuso.value.slice(0, selectuso.value.indexOf(":"))].idusoitems;
      });

      this.formBuscaRubros = this.fb.group({
         descripcion: [null, [Validators.required, Validators.minLength(3)]],
         filtro: ''
      });
   }

   get f() { return this.formProdu.controls; }

   regresar() { this.router.navigate(['/catalogoitems']); }

   guardar() {
      this.produService.save(this.formProdu.value).subscribe({
         next: resp => { this.router.navigate(['/catalogoitems']); },
         error: err => console.error(err.error)
      });
   }

   rubrosModal() {
      this.swvalido = 1;
      if (this.privez) {
         this.privez = false;
      } else {
         this.formBuscaRubros.reset();
         this._rubros = [];
      }
   }

   buscaRubros() {
      let descripcion: String;
      if (this.formBuscaRubros.value.descripcion == null) descripcion = '';
      else descripcion = this.formBuscaRubros.value.descripcion.toLowerCase();
      this.rubService.getByModulo(this.idmodulo, descripcion).subscribe({
         next: resp => this._rubros = resp,
         error: err => console.error(err.error)
      });
   }

   selRubro(rubro: Rubros) {
      this.f['rubro'].setValue(rubro.descripcion);
      this.f['idrubro_rubros'].setValue(rubro);
   }

   valNombre(control: AbstractControl) {
      map(result => this.idusoitems == null ? { existe: true } : null);
      return this.produService.getByNombre(this.idusoitems, control.value)
         .pipe(
            map(result => result.length == 1 ? { existe: true } : null)
         );
   }

}
