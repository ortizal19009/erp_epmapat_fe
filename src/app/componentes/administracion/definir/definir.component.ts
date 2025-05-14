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
   archivo: File | null = null;
   clave: string = '';
   idDefinir: number = 1; // Cambia esto según el ID correspondiente

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
         email: '',
         clave_email: ''
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
         next: (datos: any) => {
            console.log(datos)
            this.formDefinir.setValue({
               razonsocial: datos.razonsocial,
               nombrecomercial: datos.nombrecomercial,
               ruc: datos.ruc,
               direccion: datos.direccion,
               tipoambiente: datos.tipoambiente,
               iva: datos.iva,
               email: datos.email, 
               clave_email: datos.clave_email
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
            // this.regresar()
         },
         error: err => console.error(err.error)
      });
   }

   regresar() { this.router.navigate(['/generadorxml']) }
   onFileChange(event: Event) {
      const input = event.target as HTMLInputElement;
      if (input.files && input.files.length > 0) {
         this.archivo = input.files[0]; // ✅ Carga correcta del archivo
      }
   }
   async subirFirma() {
      let formData: FormData = new FormData();
      if (!this.archivo || !this.clave) {
         alert('Debe seleccionar un archivo y escribir la clave.');
         return;
      }
      formData.append('archivo', this.archivo);
      formData.append('clave', this.clave);
      let dat: any = await this.defService.upFirma(this.idDefinir, formData)
      console.log(dat)
   }
}
