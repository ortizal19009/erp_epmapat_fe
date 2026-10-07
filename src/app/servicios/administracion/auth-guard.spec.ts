import { AuthGuard } from './auth-guard';
import { Router } from '@angular/router';
import { AutorizaService } from '../../compartida/autoriza.service';
import { PerfilAccesoService } from './perfil-acceso.service';
import { ActivatedRouteSnapshot } from '@angular/router';
import { of } from 'rxjs';

describe('AuthGuard', () => {
  [0, 401, 502, 503, 504].forEach((status) => {
    it(`handles failed session verification with status ${status}`, () => {
      const router = jasmine.createSpyObj('Router', ['navigate']);
      const auth = { sessionlog: true, idusuario: 2, logout: jasmine.createSpy('logout') };
      const profile = {
        loadForCurrentUser: () => of(false), verificationErrorStatus: status,
      };
      const guard = new AuthGuard(auth as unknown as AutorizaService, router,
        profile as unknown as PerfilAccesoService);
      const result = guard.canActivate({ routeConfig: { path: 'facturacion' } } as ActivatedRouteSnapshot);
      if (typeof result === 'boolean') { fail('Expected verification'); return; }
      result.subscribe((allowed) => {
        expect(allowed).toBeFalse();
        if (status === 401) expect(auth.logout).toHaveBeenCalled();
        else {
          expect(auth.logout).not.toHaveBeenCalled();
          expect(router.navigate).toHaveBeenCalledWith(['/service-unavailable'], {
            queryParams: { status: String(status) },
          });
        }
      });
    });
  });
  [0, 1, 2, 3].forEach((level) => {
    ['trazabilidad', ''].forEach((path) => {
      it(`controls trazabilidad access at level ${level} for route '${path}'`, () => {
        const router = jasmine.createSpyObj('Router', ['navigate']);
        const profile = jasmine.createSpyObj('PerfilAccesoService', [
          'loadForCurrentUser', 'hasModule', 'hasWindowPermission',
        ]);
        profile.loadForCurrentUser.and.returnValue(of(true));
        profile.hasModule.and.returnValue(true);
        profile.hasWindowPermission.and.callFake((name: string, minimum: number) =>
          name === 'trazabilidad' && level >= minimum
        );
        const guard = new AuthGuard(
          { sessionlog: true, idusuario: 2 } as AutorizaService,
          router,
          profile,
        );
        const route = {
          routeConfig: { path }, data: { windowPermission: 'trazabilidad' },
        } as unknown as ActivatedRouteSnapshot;
        const result = guard.canActivate(route);
        if (typeof result === 'boolean') {
          fail('Expected profile validation');
          return;
        }
        result.subscribe((allowed) => {
          expect(allowed).toBe(level >= 1);
          expect(profile.hasWindowPermission).toHaveBeenCalledWith('trazabilidad', 1);
          if (level === 0) expect(router.navigate).toHaveBeenCalledWith(['/home']);
          else expect(router.navigate).not.toHaveBeenCalled();
        });
      });
    });
  });
  it('should create an instance', () => {
    expect(new AuthGuard(
      {} as AutorizaService,
      {} as Router,
      {} as PerfilAccesoService,
    )).toBeTruthy();
  });
});
