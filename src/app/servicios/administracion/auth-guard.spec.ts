import { AuthGuard } from './auth-guard';
import { Router } from '@angular/router';
import { AutorizaService } from '../../compartida/autoriza.service';
import { PerfilAccesoService } from './perfil-acceso.service';

describe('AuthGuard', () => {
  it('should create an instance', () => {
    expect(new AuthGuard(
      {} as AutorizaService,
      {} as Router,
      {} as PerfilAccesoService,
    )).toBeTruthy();
  });
});
