import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AutorizaService } from '../../compartida/autoriza.service';

@Injectable({ providedIn: 'root' })
export class AdminOnlyGuard implements CanActivate {
  constructor(private authService: AutorizaService, private router: Router) {}

  canActivate(): boolean {
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

    this.router.navigate(['/home']);
    return false;
  }
}
