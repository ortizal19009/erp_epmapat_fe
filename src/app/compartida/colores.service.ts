// Servicio compartido por todas las ventanas que usan colores
import { Injectable } from '@angular/core';
import { VentanasService } from '../servicios/administracion/ventanas.service';

@Injectable({
   providedIn: 'root'
})

export class ColoresService {

   constructor(private venService: VentanasService) { }

   public async setcolor(idusuario: number, ventana: string): Promise<string[]> {
      let ventanas = await this.venService.getByIdusuarioyNombre(idusuario, ventana)
      if (ventanas) return Promise.resolve([ventanas.color1, ventanas.color2]);
      else {
         let newVentana = {} as Ventana; //Interface para los datos de la nueva Ventana
         newVentana.nombre = ventana;
         newVentana.color1 = 'rgb(57, 95, 95)';
         newVentana.color2 = 'rgb(210, 221, 210)';
         newVentana.idusuario = idusuario;
         try {
            const respuesta = await this.venService.saveVentana(newVentana);
            return Promise.resolve([newVentana.color1, newVentana.color2]);
         } catch (error) {
            console.error(error);
         }
      }
      return Promise.resolve(['0']);
   }


}

interface Ventana {
   idventana: number;
   nombre: string;
   color1: string;
   color2: string;
   idusuario: number;
}