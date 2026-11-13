import { of, throwError } from 'rxjs';
import { EmailAdminComponent } from './email-admin.component';

describe('EmailAdminComponent: disponibilidad del microservicio', () => {
  let component: EmailAdminComponent;
  beforeEach(() => {
    component = Object.create(EmailAdminComponent.prototype);
  });

  it('informa que el microservicio no responde y permite actualizar de nuevo', () => {
    const getAccounts = jasmine.createSpy().and.returnValue(throwError(() => ({ status: 502 })));
    (component as any).emailAdminService = { getAccounts };
    component.loadAll();
    expect(component.loading).toBeFalse();
    expect(component.errorMessage).toContain('microservicio de correos');
    expect(component.errorMessage).toContain('HTTP 502');
    getAccounts.and.returnValue(of([]));
    spyOn<any>(component, 'loadSummary');
    spyOn<any>(component, 'loadBlacklist');
    component.loadAll();
    expect(component.errorMessage).toBe('');
    expect(component.loading).toBeFalse();
    expect(component.accounts).toEqual([]);
  });

  it('distingue un rechazo por permisos de una caida del microservicio', () => {
    (component as any).emailAdminService = { getAccounts: () => throwError(() => ({
      status: 403, error: { error: 'Sesion o permisos insuficientes' }
    })) };
    component.loadAll();
    expect(component.errorMessage).toBe('Sesion o permisos insuficientes');
    expect(component.loading).toBeFalse();
  });
});
