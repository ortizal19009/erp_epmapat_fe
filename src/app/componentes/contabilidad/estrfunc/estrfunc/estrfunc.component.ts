import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs';
import { EstrfuncService } from 'src/app/servicios/contabilidad/estrfunc.service';
import { PregastoService } from 'src/app/servicios/contabilidad/pregasto.service';

@Component({
   selector: 'app-estrfunc',
   templateUrl: './estrfunc.component.html',
   styleUrls: ['./estrfunc.component.css']
})
export class EstrfuncComponent implements OnInit {

   _estrfunc: any;
   formActividad: FormGroup;
   idestrfunc: number;
   opcion: number;      //1: Nuevo, 2: Modificar
   antcodigo: String;
   antnombre: String;
   sweliminar: boolean;
   actividad: String;
   totpartidas: number;

   constructor(public fb: FormBuilder, private estrfuncService: EstrfuncService, private router: Router,
      private pregasService: PregastoService) { }

   ngOnInit(): void {
      sessionStorage.setItem('ventana', '/estrfunc');
      this.setcolor();

      this.formActividad = this.fb.group({
         codigo: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(2)], this.valCodigo.bind(this)],
         nombre: ['', [Validators.required, Validators.minLength(3)], this.valNombre.bind(this)],
         movimiento: ['true'],
         objcosto: [0],
      });

      this.listarActividades();
   }

   setcolor() {
      let colores: string[];
      let coloresJSON = sessionStorage.getItem('/pregastos');
      if (!coloresJSON) {
         colores = ['rgb(80, 83, 54)', 'rgb(228, 248, 205)'];
         const coloresJSON = JSON.stringify(colores);
         sessionStorage.setItem('/pregastos', coloresJSON);
      } else colores = JSON.parse(coloresJSON);

      document.documentElement.style.setProperty('--bgcolor1', colores[0]);
      const cabecera = document.querySelector('.cabecera');
      if (cabecera) cabecera.classList.add('nuevoBG1')
      document.documentElement.style.setProperty('--bgcolor2', colores[1]);
      const detalle = document.querySelector('.detalle');
      if (detalle) detalle.classList.add('nuevoBG2');
   }

   public listarActividades() {
      this.estrfuncService.getListaEstrfunc().subscribe({
         next: datos => this._estrfunc = datos,
         error: err => console.error(err.error),
      });
   }

   get f() { return this.formActividad.controls; }

   onCellClick(event: any, idestrfunc: number) {
      const tagName = event.target.tagName;
      if (tagName === 'TD') {
         sessionStorage.setItem('idestrfuncToInfo', idestrfunc.toString() );
         this.router.navigate(['info-estrfunc']);
      }
   }

   nuevo() {
      this.opcion = 1;
      this.formActividad.setValue({
         codigo: '',
         nombre: '',
         movimiento: 1,
         objcosto: 0
      });
   }

   modificar(estrfunc: any) {
      this.opcion = 2;
      this.idestrfunc = estrfunc.idestrfunc;
      this.antcodigo = estrfunc.codigo;
      this.antnombre = estrfunc.nombre;
      this.formActividad.setValue({
         codigo: estrfunc.codigo,
         nombre: estrfunc.nombre,
         movimiento: estrfunc.movimiento,
         objcosto: estrfunc.objcosto
      });
   }

   aceptar() {
      if (this.opcion == 1) this.addActividad();
      if (this.opcion == 2) this.actuActividad();
   }

   addActividad() {
      this.estrfuncService.saveEstrfunc(this.formActividad.value).subscribe({
         next: resp => this.listarActividades(),
         error: err => console.error('Al guardar la nueva Actividad: ', err.error)
      });
   }

   actuActividad() {
      this.estrfuncService.updateEstrfun(this.idestrfunc, this.formActividad.value).subscribe({
         next: resp => this.listarActividades(),
         error: err => console.error('Al modificar la Actividad: ', err.error)
      });
   }

   elimActividad(estrfunc: any) {
      this.actividad = estrfunc.codigo + '  ' + estrfunc.nombre;
      this.idestrfunc = estrfunc.idestrfunc;
      this.pregasService.countByEstrfunc(estrfunc.idestrfunc).subscribe({
         next: resp => {
            this.totpartidas = +resp;
            if(+resp > 0)  this.sweliminar = false; else this.sweliminar = true;
         },
         error: err => console.error('Al contar las Partidas por Actividad: ', err.error)
      })
   }

   elimina() {
      if (this.idestrfunc != null) {
         this.estrfuncService.deleteEstrfunc(this.idestrfunc).subscribe({
            next: resp => this.listarActividades(),
            error: err => console.error('Al eliminar una Actividad: ', err.error),
         });
      }
   }

   public info(idestrfunc: number) {
      sessionStorage.setItem('idestrfuncToInfo', idestrfunc.toString());
      this.router.navigate(['info-estrfunc']);
   }

   //Validar por Código
   valCodigo(control: AbstractControl) {
      if (this.opcion == 1) {
         return this.estrfuncService.getByCodigo(control.value)
            .pipe(
               map(result => result.length == 1 ? { existe: true } : null)
            );
      }
      else {
         return this.estrfuncService.getByCodigo(control.value)
            .pipe(
               map(result => result.length == 1 && control.value != this.antcodigo ? { existe: true } : null)
            );
      }
   }

   //Validar por Nombre
   valNombre(control: AbstractControl) {
      if (this.opcion == 1) {
         return this.estrfuncService.getByNombre(control.value)
            .pipe(
               map(result => result.length == 1 ? { existe: true } : null)
            );
      }
      else {
         return this.estrfuncService.getByNombre(control.value)
            .pipe(
               map(result => result.length == 1 && control.value != this.antnombre ? { existe: true } : null)
            );
      }
   }

}
