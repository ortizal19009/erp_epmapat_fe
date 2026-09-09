import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { VentanasService } from '../servicios/administracion/ventanas.service';

export interface Ventana {
  idventana?: number;
  nombre: string;
  color1: string;
  color2: string;
  idusuario: number;
  permissions: number;
}

@Injectable({ providedIn: 'root' })
export class ColoresService {
  rolepermission: number | null = null;

  private static readonly DEFAULT_COLORS: [string, string] = [
    'rgb(80, 4, 80)',
    'rgb(250, 200, 250)',
  ];

  constructor(
    private venService: VentanasService
  ) {}

  private getPermissionCacheKey(idusuario: number): string {
    return `ventana-permisos-${idusuario}`;
  }

  private async getPermissionMap(idusuario: number): Promise<Map<string, number>> {
    const cacheKey = this.getPermissionCacheKey(idusuario);
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      try {
        const rows = JSON.parse(cached);
        if (Array.isArray(rows)) {
          return new Map(
            rows.map((item: any) => [
              String(item?.nombre || '').trim().toLowerCase(),
              Number(item?.permissions ?? 0),
            ])
          );
        }
      } catch {}
    }

    const rows = await firstValueFrom(this.venService.getPermisosUsuario(idusuario));
    const normalized = (rows || []).map((item: any) => ({
      nombre: String(item?.nombre || '').trim().toLowerCase(),
      permissions: Number(item?.permissions ?? 0),
    }));
    sessionStorage.setItem(cacheKey, JSON.stringify(normalized));
    return new Map(normalized.map((item: any) => [item.nombre, item.permissions]));
  }

  clearPermissionCache(idusuario?: number): void {
    if (idusuario) {
      sessionStorage.removeItem(this.getPermissionCacheKey(idusuario));
      return;
    }

    Object.keys(sessionStorage)
      .filter((key) => key.startsWith('ventana-permisos-'))
      .forEach((key) => sessionStorage.removeItem(key));
  }

  public async setcolor(idusuario: number, ventana: string): Promise<[string, string]> {
    const cacheKey = `/${ventana}`;
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      try {
        const arr = JSON.parse(cached);
        if (Array.isArray(arr) && arr.length === 2) {
          return arr as [string, string];
        }
      } catch {}
    }

    try {
      const ventanas: Ventana | null = await this.venService.getByIdusuarioyNombre(
        idusuario,
        ventana
      );

      if (ventanas) {
        const result: [string, string] = [ventanas.color1, ventanas.color2];
        sessionStorage.setItem(cacheKey, JSON.stringify(result));
        return result;
      }

      const nueva: Ventana = {
        nombre: ventana,
        color1: ColoresService.DEFAULT_COLORS[0],
        color2: ColoresService.DEFAULT_COLORS[1],
        idusuario,
        permissions: 1,
      };

      await this.venService.saveVentana(nueva as any);
      const created: [string, string] = [nueva.color1, nueva.color2];
      sessionStorage.setItem(cacheKey, JSON.stringify(created));
      this.clearPermissionCache(idusuario);
      return created;
    } catch (error) {
      console.error('[ColoresService.setcolor] Error:', error);
      return ColoresService.DEFAULT_COLORS;
    }
  }

  public async getRolePermission(idusuario: number, ventana: string): Promise<number> {
    try {
      if (!idusuario || !ventana) {
        this.rolepermission = 1;
        return this.rolepermission;
      }

      const permissionMap = await this.getPermissionMap(idusuario);
      this.rolepermission =
        Number(permissionMap.get(String(ventana).trim().toLowerCase()) ?? 1) || 1;
      return this.rolepermission;
    } catch (error) {
      console.error('[ColoresService.getRolePermission] Error:', error);
      this.rolepermission = 1;
      return this.rolepermission;
    }
  }
}
