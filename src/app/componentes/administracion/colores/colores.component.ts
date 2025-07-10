import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { VentanasService } from 'src/app/servicios/administracion/ventanas.service';

@Component({
   selector: 'app-colores',
   templateUrl: './colores.component.html',
   styleUrls: ['./colores.component.css']
})

export class ColoresComponent implements OnInit {

   colorForm: FormGroup;
   red0: number;
   green0: number;
   blue0: number;
   red1: number;
   green1: number;
   blue1: number;
   nomVentana: string;  //Ejm: '/rutas'

   constructor(private router: Router, private fb: FormBuilder, private venServicio: VentanasService, public authService: AutorizaService) { }

   ngOnInit(): void {
      this.nomVentana = sessionStorage.getItem('ventana')!;
      if (!this.nomVentana || this.nomVentana == '/inicio') {
         //Solo Inicializa para que no de errores y regresa
         this.nomVentana = '/cajas'
         sessionStorage.setItem('/cajas', JSON.stringify(['rgb(57, 95, 95)', 'rgb(207, 221, 210)']));
         this.router.navigate(['/inicio']);
      }

      let colores: string[];
      let coloresJSON = sessionStorage.getItem(this.nomVentana);
      if (coloresJSON !== null) {
         colores = JSON.parse(coloresJSON);
         document.documentElement.style.setProperty('--bgcolor1', colores[0]);
         const cabecera = document.querySelector('.cabecera');
         if (cabecera) cabecera.classList.add('nuevoBG1');
         document.documentElement.style.setProperty('--bgcolor2', colores[1]);
         const detalle = document.querySelector('.detalle');
         if (detalle) detalle.classList.add('nuevoBG2');
         //Datos para el formulario
         let rgbValues0 = extractRGBValues(colores[0]);
         this.red0 = rgbValues0!.r;
         this.green0 = rgbValues0!.g;
         this.blue0 = rgbValues0!.b;
         let rgbValues1 = extractRGBValues(colores[1]);
         this.red1 = rgbValues1!.r;
         this.green1 = rgbValues1!.g;
         this.blue1 = rgbValues1!.b;
         //Coloca los datos en los campos del formulario
         this.colorForm = this.fb.group({
            red0: this.red0,
            green0: this.green0,
            blue0: this.blue0,
            red1: this.red1,
            green1: this.green1,
            blue1: this.blue1
         });
      } else {
         console.error('El valor de color en sessionStorage es nulo o no existe.');
      }
   }

   updateColor() {
      const { red0, green0, blue0, red1, green1, blue1 } = this.colorForm.value;
      this.colorForm.patchValue({
         red0: this.clamp(red0),
         green0: this.clamp(green0),
         blue0: this.clamp(blue0),
         red1: this.clamp(red1),
         green1: this.clamp(green1),
         blue1: this.clamp(blue1)
      });
   }

   private clamp(value: number): number {
      return Math.min(255, Math.max(0, value));
   }

   async actualizar() {
      const rgb0 = 'rgb(' + this.colorForm.get('red0')?.value + ',' + this.colorForm.get('green0')?.value + ',' + this.colorForm.get('blue0')?.value + ')';
      const rgb1 = 'rgb(' + this.colorForm.get('red1')?.value + ',' + this.colorForm.get('green1')?.value + ',' + this.colorForm.get('blue1')?.value + ')';
      sessionStorage.setItem(this.nomVentana, JSON.stringify([rgb0, rgb1]));
      let ventana = {} as Ventana; //Interface para los datos de la Ventana a actualizar
      let v = this.nomVentana.slice(1);   //Nombre de la ventana sin el / (primer caracter)
      ventana.nombre = v;
      ventana.color1 = rgb0;
      ventana.color2 = rgb1;
      ventana.idusuario = this.authService.idusuario;
      // Busca la ventana por usuario y nombre para luego actualizarla
      let ventanas = await this.venServicio.getByIdusuarioyNombre(this.authService.idusuario, v)
      if (ventanas) {
         this.venServicio.updateVentana(ventanas.idventana, ventana).subscribe({
            next: resp => {
            },
            error: err => console.error(err.error)
         });
      }
      this.regresar();
   }

   regresar() { this.router.navigate([this.nomVentana]); }

}

// Función para extraer los valores numéricos R, G y B desde un formato RGB
function extractRGBValues(rgb: string) {
   var values = rgb.match(/\d+/g);
   if (values && values.length === 3) {
      var r = parseInt(values[0], 10);
      var g = parseInt(values[1], 10);
      var b = parseInt(values[2], 10);
      return { r, g, b };
   } else {
      console.error("Formato RGB no válido");
      return null;
   }
}

interface Ventana {
   idventana: number;
   nombre: string;
   color1: string;
   color2: string;
   idusuario: number;
}