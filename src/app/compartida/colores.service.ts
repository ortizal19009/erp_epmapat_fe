// Servicio compartido por todas las ventanas que usan colores
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
// Si tus métodos del servicio de ventanas devuelven Observables, descomenta la línea:
// import { firstValueFrom } from 'rxjs';
import { VentanasService } from '../servicios/administracion/ventanas.service';

export interface Ventana {
  idventana?: number;
  nombre: string;
  color1: string;
  color2: string;
  idusuario: number;
  permissions: number; // 1=lector, 2=editor, 3=admin (ajusta a tu convención)
}

@Injectable({ providedIn: 'root' })
export class ColoresService {
  /** Último permiso cargado para evitar accesos repetidos. */
  rolepermission: number | null = null;

  private static readonly DEFAULT_COLORS: [string, string] = [
    'rgb(80, 4, 80)',
    'rgb(250, 200, 250)',
  ];

  constructor(
    private venService: VentanasService,
    private router: Router
  ) {}

  /**
   * Obtiene y aplica colores para la ventana. Crea registro si no existe.
   * Además cachea en sessionStorage bajo la clave `/<ventana>`.
   */
  public async setcolor(idusuario: number, ventana: string): Promise<[string, string]> {
    const cacheKey = `/${ventana}`;

    // 1) intenta cache
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      try {
        const arr = JSON.parse(cached);
        if (Array.isArray(arr) && arr.length === 2) return arr as [string, string];
      } catch { /* ignora parse error y sigue */ }
    }

    // 2) backend: buscar por usuario+ventana
    try {
      // Si getByIdusuarioyNombre es Observable, usa:
      // const ventanas = await firstValueFrom(this.venService.getByIdusuarioyNombre(idusuario, ventana));
      const ventanas: Ventana | null = await this.venService.getByIdusuarioyNombre(idusuario, ventana);

      if (ventanas) {
        const result: [string, string] = [ventanas.color1, ventanas.color2];
        sessionStorage.setItem(cacheKey, JSON.stringify(result));
        return result;
      }

      // 3) no existe: crear con defaults
      const nueva: any = {
        nombre: ventana,
        color1: ColoresService.DEFAULT_COLORS[0],
        color2: ColoresService.DEFAULT_COLORS[1],
        idusuario,
        permissions: 1, // lector por defecto
      };

      // Si saveVentana es Observable, usa firstValueFrom(...)
      await this.venService.saveVentana(nueva);
      const created: [string, string] = [nueva.color1, nueva.color2];
      sessionStorage.setItem(cacheKey, JSON.stringify(created));
      return created;

    } catch (error) {
      console.error('[ColoresService.setcolor] Error:', error);
      // Fallback seguro
      return ColoresService.DEFAULT_COLORS;
    }
  }

  /**
   * Devuelve el permiso de rol para una ventana del usuario.
   * - 1 lector (default si no hay registro)
   * - 2 editor
   * - 3 admin
   */
  public async getRolePermission(idusuario: number, ventana: string): Promise<number> {
    try {
      // const datos = await firstValueFrom(this.venService.getByIdusuarioyNombre(idusuario, ventana));
      const datos: Ventana | null = await this.venService.getByIdusuarioyNombre(idusuario, ventana);

      if (!datos) {
        this.swal('info', 'Ventana no encontrada');
        // Puedes redirigir o no, según UX deseada:
        this.router.navigate(['/inicio']);
        this.rolepermission = 1;
        return this.rolepermission;
      }

      this.rolepermission = Number(datos.permissions) || 1;
      return this.rolepermission;
    } catch (error) {
      console.error('[ColoresService.getRolePermission] Error:', error);
      this.swal('warning', 'No se pudo obtener permisos. Usando lectura.');
      this.rolepermission = 1;
      return this.rolepermission;
    }
  }

  private swal(icon: 'success' | 'error' | 'info' | 'warning', mensaje: string) {
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
