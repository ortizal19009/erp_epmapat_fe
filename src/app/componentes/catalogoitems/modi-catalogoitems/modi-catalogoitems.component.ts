import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { map } from 'rxjs';
import { Modulos } from 'src/app/modelos/modulos.model';
import { Rubros } from 'src/app/modelos/rubros.model';
import { Usoitems } from 'src/app/modelos/usoitems.model';
import { CatalogoitemService } from 'src/app/servicios/catalogoitem.service';
import { ModulosService } from 'src/app/servicios/modulos.service';
import { RubrosService } from 'src/app/servicios/rubros.service';
import { UsoitemsService } from 'src/app/servicios/usoitems.service';

@Component({
   selector: 'app-modi-catalogoitems',
   templateUrl: './modi-catalogoitems.component.html',
   styleUrls: ['./modi-catalogoitems.component.css']
})

export class ModiCatalogoitemsComponent implements OnInit {

   formProducto: FormGroup;
   disabled = true;
   _modulos: any;
   _usos: any;
   antdescripcion: String;
   idcatalogoitems: number; //Id del Producto que se modifica
   idmodulo: number;
   idusoitems: number;
   idrubro: number;
   formBuscaRubros: FormGroup;
   filtro: any;
   _rubros: any;

   constructor(private fb: FormBuilder, private router: Router, private produService: CatalogoitemService,
      private moduService: ModulosService, private usoService: UsoitemsService,
      private rubService: RubrosService) {
   }

   ngOnInit(): void {
      this.idcatalogoitems = +sessionStorage.getItem("idproductoToModi")!;
      let modulos: Modulos = new Modulos;
      let uso: Usoitems = new Usoitems;
      let rubro: Rubros = new Rubros;
      this.formProducto = this.fb.group({
         idmodulo: modulos,
         idusoitems_usoitems: uso,
         idrubro_rubros: rubro,
         nomrubro: '',
         descripcion: [null, [Validators.required, Validators.minLength(3)], this.valNombre.bind(this)],
         cantidad: 0,
         facturable: 0,
         estado: 0,
         usucrea: 1,
         feccrea: '',
         usumodi: 1,
         fecmodi: ''
      },
      { updateOn: "blur" }
      );
      this.listarModulos();
      this.datosProducto();
      this.listenerChanges();

      this.formBuscaRubros = this.fb.group({
         descripcion: [null, [Validators.required, Validators.minLength(3)]],
         filtro: ''
      });
   }

   listarModulos() {
      this.moduService.getListaModulos().subscribe({
         next: resp => {
            this._modulos = resp;

            setTimeout(() => {
               let opcModulo = document.getElementById(`idmodulo_` + this.idmodulo) as HTMLElement;
               if (opcModulo != null) {
                  opcModulo.setAttribute("selected", "");
                  this.usoService.getByIdmodulo(this.idmodulo).subscribe({
                     next: resp => {
                        this._usos = resp;

                        setTimeout(() => {
                           let opcUso = document.getElementById(`idusoitems_` + this.idusoitems) as HTMLElement;
                           opcUso.setAttribute("selected", "");
                        }, 500);
                     },
                     error: err => console.log(err.error)
                  });
               };
            }, 800);
         },
         error: err => console.log(err.error)
      });
   }

   datosProducto() {
      this.produService.getById(this.idcatalogoitems).subscribe({
         next: datos => {
            this.idmodulo = datos.idusoitems_usoitems.idmodulo_modulos.idmodulo;
            this.idusoitems = datos.idusoitems_usoitems.idusoitems;
            this.idrubro = datos.idrubro_rubros.idrubro;
            this.antdescripcion = datos.descripcion;
            this.formProducto.setValue({
               idmodulo: this._modulos,
               idusoitems_usoitems: datos.idusoitems_usoitems,
               idrubro_rubros: datos.idrubro_rubros,
               nomrubro: datos.idrubro_rubros.descripcion,
               descripcion: datos.descripcion,
               cantidad: datos.cantidad,
               facturable: datos.facturable,
               estado: datos.estado,
               usucrea: datos.usucrea,
               feccrea: datos.feccrea,
               usumodi: 1,
               fecmodi: (new Date().toISOString().substring(0, 10))
            })
         },
         error: err => console.log(err.msg.error)
      });
   }

   listenerChanges() {
      let selectmodulo = document.getElementById("selectmodulo") as HTMLSelectElement;
      selectmodulo.addEventListener("change", () => {
         this.idmodulo = +selectmodulo.value!;
         this.f['descripcion'].setValue('');
         this.f['nomrubro'].setValue('');
         this.usoService.getByIdmodulo(this.idmodulo).subscribe({
            next: resp => {
               this._usos = resp;
               this.formProducto.value.idusoitems = resp;
            },
            error: err => console.log(err.error)
         });
      });

      let selectuso = document.getElementById("selectuso") as HTMLSelectElement;
      selectuso.addEventListener("change", () => {
         setTimeout(() => {
            this.f['descripcion'].setValue('');
            this.formProducto.value.idusoitems_usoitems = selectuso.value;
         }, 800);
         this.idusoitems = this._usos[+selectuso.value.slice(0, selectuso.value.indexOf(":"))].idusoitems;
      });
   }

   get f() { return this.formProducto.controls; }

   onSubmit() {
      this.produService.updateProducto(this.idcatalogoitems, this.formProducto.value).subscribe({
        next: resp => this.retornar(),
        error: err => console.log(err.error)
      });
   }

   retornar() { this.router.navigate(['/info-catalogoitems']); }

   comparaModulo(o1: Modulos, o2: Modulos): boolean {
      if (o1 === undefined && o2 === undefined) { return true; }
      else {
         return o1 === null || o2 === null || o1 === undefined || o2 === undefined ? false : o1.idmodulo == o2.idmodulo;
      }
   }

   buscaRubros() {
      let descripcion: String;
      if (this.formBuscaRubros.value.descripcion == null) descripcion = '';
      else descripcion = this.formBuscaRubros.value.descripcion.toLowerCase();
      this.rubService.getByModulo(this.idmodulo, descripcion).subscribe({
         next: resp => this._rubros = resp,
         error: err => console.log(err.error)
      });
   }

   selRubro(rubro: Rubros) {
      this.f['nomrubro'].setValue(rubro.descripcion);
      this.f['idrubro_rubros'].setValue(rubro);
   }


   valNombre(control: AbstractControl) {
      return this.produService.getByNombre(3, control.value)
         .pipe(
            map(result => result.length == 1 && control.value != this.antdescripcion ? { existe: true } : null)
         );
   }

}
