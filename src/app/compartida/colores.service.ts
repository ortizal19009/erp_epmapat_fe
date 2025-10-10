// Servicio compartido por todas las ventanas que usan colores
import { Injectable } from '@angular/core';
import { VentanasService } from '../servicios/administracion/ventanas.service';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class ColoresService {
  rolepermission: number;
  constructor(private venService: VentanasService, private router: Router) {}

  public async setcolor(idusuario: number, ventana: string): Promise<string[]> {
    let ventanas: any = await this.venService.getByIdusuarioyNombre(
      idusuario,
      ventana
    );
    if (ventanas) return Promise.resolve([ventanas.color1, ventanas.color2]);
    else {
      let newVentana = {} as Ventana; //Interface para los datos de la nueva Ventana
      newVentana.nombre = ventana;
      newVentana.color1 = 'rgb(80, 4, 80)';
      newVentana.color2 = 'rgb(250, 200, 250)';
      newVentana.idusuario = idusuario;
      newVentana.permissions = 1;
      try {
        const respuesta = await this.venService.saveVentana(newVentana);
        return Promise.resolve([newVentana.color1, newVentana.color2]);
      } catch (error) {
        console.error(error);
      }
    }
    return Promise.resolve(['0']);
  }
  async getRolePermission(idusuario: number, ventana: string): Promise<any> {
    this.rolepermission;
    let datos: any = await this.venService.getByIdusuarioyNombre(
      idusuario,
      ventana
    );
    if (!datos) {
      this.swal('info', 'Ventana no encontrada');
      this.router.navigate(['/inicio']);
      //return (this.rolepermission = 1);
    }
    console.log(this.rolepermission);
    return (this.rolepermission = datos.permissions);
  }

  swal(icon: 'success' | 'error' | 'info' | 'warning', mensaje: string) {
    Swal.fire({
      toast: true,
      icon,
      title: mensaje,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
    });
  }
}

interface Ventana {
  idventana: number;
  nombre: string;
  color1: string;
  color2: string;
  idusuario: number;
  permissions: number;
}
