import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { ColoresService } from 'src/app/compartida/colores.service';
import { DefinirService } from 'src/app/servicios/administracion/definir.service';

@Component({
   selector: 'app-definir',
   templateUrl: './definir.component.html',
   styleUrls: ['./definir.component.css']
})
export class DefinirComponent implements OnInit {

   formDefinir: FormGroup;

   constructor(public fb: FormBuilder, private router: Router, private coloresService: ColoresService,
      public authService: AutorizaService, private defService: DefinirService) { }

   ngOnInit(): void {
      sessionStorage.setItem('ventana', '/definir');
      let coloresJSON = sessionStorage.getItem('/definir');
      if (coloresJSON) this.colocaColor(JSON.parse(coloresJSON));
      else this.buscaColor();


      this.formDefinir = this.fb.group({
         razonsocial: ['', Validators.required],
         nombrecomercial: ['', Validators.required],
         ruc: ['', [Validators.required, Validators.minLength(13), Validators.maxLength(13)]],
         direccion: ['', Validators.required],
         tipoambiente: ['', Validators.required],
         iva: ['', Validators.required],
      },
         // { updateOn: "blur" }
      );

      this.buscaDefinir();

   }

   colocaColor(colores: any) {
      document.documentElement.style.setProperty('--bgcolor1', colores[0]);
      const cabecera = document.querySelector('.cabecera');
      if (cabecera) cabecera.classList.add('nuevoBG1')
      document.documentElement.style.setProperty('--bgcolor2', colores[1]);
      const detalle = document.querySelector('.detalle');
      if (detalle) detalle.classList.add('nuevoBG2');
   }

   async buscaColor() {
      try {
         const datos = await this.coloresService.setcolor(this.authService.idusuario, 'definir');
         const coloresJSON = JSON.stringify(datos);
         sessionStorage.setItem('/definir', coloresJSON);
         this.colocaColor(datos);
      } catch (error) {
         console.error(error);
      }
   }

   get f() { return this.formDefinir.controls; }

   buscaDefinir() {
      this.defService.getByIddefinir(1).subscribe({
         next: datos => {
            this.formDefinir.setValue({
               razonsocial: datos.razonsocial,
               nombrecomercial: datos.nombrecomercial,
               ruc: datos.ruc,
               direccion: datos.direccion,
               tipoambiente: datos.tipoambiente,
               iva: datos.iva,
            });
         },
         error: err => console.error(err.error)
      });
   }

   onTipoambienteChange(event: any) {
      let tipoambiente = event.target.value;
    }

   guardar() {
      this.defService.updateDefinir(1, this.formDefinir.value).subscribe({
         next: datos => {
            this.regresar()
         },
         error: err => console.error(err.error)
      });
   }

   regresar() { this.router.navigate(['/generadorxml']) }

}
