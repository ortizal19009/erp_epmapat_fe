import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AutorizaService } from '../../compartida/autoriza.service';
import { VentanasService } from './ventanas.service';

@Injectable({ providedIn: 'root' })
export class AdminOnlyGuard implements CanActivate {
  constructor(
    private authService: AutorizaService,
    private router: Router,
    private ventanasService: VentanasService
  ) {}

  async canActivate(route: ActivatedRouteSnapshot, _state: RouterStateSnapshot): Promise<boolean> {
    if (this.authService.idusuario === 1) {
      return true;
    }

    try {
      const raw = sessionStorage.getItem('abc');
      if (raw) {
        const decoded = JSON.parse(atob(raw));
        if (+decoded?.idusuario === 1) {
          return true;
        }
      }
    } catch {}

    const userId = this.resolveUserId();
    const windowName = route.data?.['windowPermission'];
    const minPermission = Number(route.data?.['minPermission'] ?? 5);

    if (userId && windowName) {
      try {
        const permisos = await firstValueFrom(this.ventanasService.getPermisosUsuario(userId));
        const match = (permisos || []).find(
          (item: any) => String(item?.nombre || '').trim().toLowerCase() === String(windowName).trim().toLowerCase()
        );
        if (Number(match?.permissions ?? 0) >= minPermission) {
          return true;
        }
      } catch {}
    }

    this.router.navigate(['/home']);
    return false;
  }

  private resolveUserId(): number {
    if (this.authService.idusuario) {
      return this.authService.idusuario;
    }

    try {
      const raw = sessionStorage.getItem('abc');
      if (!raw) {
        return 0;
      }
      const decoded = JSON.parse(atob(raw));
      return +decoded?.idusuario || 0;
    } catch {
      return 0;
    }
  }
}
