import { AutorizaService } from './autoriza.service';
import { Router } from '@angular/router';
import { DefinirService } from '../servicios/administracion/definir.service';

describe('AutorizaService session restoration', () => {
  let savedSession: string | null;
  let savedToken: string | null;
  let savedModules: string | null;
  let savedFlag: string | null;
  const create = () => new AutorizaService(
    jasmine.createSpyObj('Router', ['navigate']) as Router,
    {} as DefinirService,
  );

  beforeEach(() => {
    savedSession = sessionStorage.getItem('abc');
    savedToken = sessionStorage.getItem('webJwt');
    savedModules = sessionStorage.getItem('modulos');
    savedFlag = localStorage.getItem('sessionlog');
    ['abc', 'webJwt', 'modulos'].forEach(key => sessionStorage.removeItem(key));
    localStorage.removeItem('sessionlog');
  });

  afterEach(() => {
    [['abc', savedSession], ['webJwt', savedToken], ['modulos', savedModules]].forEach(([key, value]) => {
      if (value === null) sessionStorage.removeItem(key!);
      else sessionStorage.setItem(key!, value!);
    });
    if (savedFlag === null) localStorage.removeItem('sessionlog');
    else localStorage.setItem('sessionlog', savedFlag);
  });

  it('restores the session before components initialize without a localStorage flag', () => {
    create().saveSession({ idusuario: 2, alias: 'Jose', object: { modulo: 2, moduActual: 2 } }, 'token');
    localStorage.removeItem('sessionlog');
    const reloaded = create();
    expect(reloaded.sessionlog).toBeTrue();
    expect(reloaded.idusuario).toBe(2);
    expect(reloaded.moduActual).toBe(2);
  });

  it('preserves Unicode names and remains compatible with legacy session readers', () => {
    create().saveSession({ idusuario: 2, alias: 'Jos? ?? ??' }, 'token');
    expect(create().alias).toBe('Jos? ?? ??');
    expect(JSON.parse(atob(sessionStorage.getItem('abc')!)).alias).toBe('Jos? ?? ??');
  });

  it('keeps the token when only the module cache is malformed', () => {
    create().saveSession({ idusuario: 2 }, 'token');
    sessionStorage.setItem('modulos', 'invalid JSON');
    expect(create().sessionlog).toBeTrue();
    expect(sessionStorage.getItem('webJwt')).toBe('token');
  });

  it('does not restore a logged-out session', () => {
    const service = create();
    service.saveSession({ idusuario: 2 }, 'token');
    service.logout();
    expect(create().sessionlog).toBeFalse();
    expect(sessionStorage.getItem('webJwt')).toBeNull();
  });

  it('requires the token even when the legacy flag says logged in', () => {
    sessionStorage.setItem('abc', btoa(JSON.stringify({ idusuario: 2 })));
    localStorage.setItem('sessionlog', 'true');
    expect(create().sessionlog).toBeFalse();
  });
});
