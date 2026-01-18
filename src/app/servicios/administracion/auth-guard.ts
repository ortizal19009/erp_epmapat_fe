// auth.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AutorizaService } from 'src/app/compartida/autoriza.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private authService: AutorizaService, private router: Router) {}

  canActivate(): boolean {
    console.log('AuthGuard#canActivate called', this.authService.sessionlog);
    if (!this.authService.sessionlog) {
      this.router.navigate(['/inicio']);
      return false;
    }
    return true;
  }
}
