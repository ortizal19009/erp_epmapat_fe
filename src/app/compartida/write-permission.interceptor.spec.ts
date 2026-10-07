import { HttpRequest, HttpResponse } from '@angular/common/http';
import { of } from 'rxjs';
import Swal from 'sweetalert2';
import { environment } from 'src/environments/environment';
import { WritePermissionInterceptor } from './write-permission.interceptor';

describe('Emission report permissions', () => {
  let interceptor: WritePermissionInterceptor;
  let next: any;
  const endpoint = `${environment.API_URL.replace(/\/$/, '')}/jasperReports/reportes`;
  beforeEach(() => {
    sessionStorage.setItem('abc', btoa(JSON.stringify({ idusuario: 11 })));
    sessionStorage.setItem('ventana-permisos-11', JSON.stringify([{ nombre: 'emisiones', permissions: 1 }]));
    interceptor = new WritePermissionInterceptor({ handle: () => of(new HttpResponse({ body: [] })) } as any, { url: '/imp-emisiones' } as any);
    next = { handle: jasmine.createSpy().and.returnValue(of(new HttpResponse({ body: new Blob(['pdf']) }))) };
    spyOn(Swal, 'fire').and.returnValue(Promise.resolve({} as any));
  });
  afterEach(() => { sessionStorage.removeItem('abc'); sessionStorage.removeItem('ventana-permisos-11'); });
  it('allows the three emission templates for readers', () => {
    ['ResumenEmision', 'Refacturaciones', 'RefacturacionesRubros'].forEach(reportName =>
      interceptor.intercept(new HttpRequest('POST', endpoint, { reportName }), next).subscribe());
    expect(next.handle).toHaveBeenCalledTimes(3);
  });
  it('denies reports without read access', () => {
    sessionStorage.setItem('ventana-permisos-11', JSON.stringify([{ nombre: 'emisiones', permissions: 0 }]));
    interceptor.intercept(new HttpRequest('POST', endpoint, { reportName: 'ResumenEmision' }), next).subscribe({ error: () => {} });
    expect(next.handle).not.toHaveBeenCalled();
  });
  it('keeps mutations, unknown templates and lookalike URLs blocked', () => {
    [new HttpRequest('POST', `${environment.API_URL}/emisiones/3/generar-pendientes`, {}),
      new HttpRequest('PUT', `${environment.API_URL}/emisiones/3`, {}),
      new HttpRequest('DELETE', `${environment.API_URL}/emisiones/3`, {}),
      new HttpRequest('POST', endpoint, { reportName: 'OtroReporte' }),
      new HttpRequest('POST', endpoint + '/guardar', { reportName: 'ResumenEmision' })]
      .forEach(req => interceptor.intercept(req, next).subscribe({ error: () => {} }));
    expect(next.handle).not.toHaveBeenCalled();
  });
  it('preserves writer and administrator access', () => {
    sessionStorage.setItem('ventana-permisos-11', JSON.stringify([{ nombre: 'emisiones', permissions: 2 }]));
    interceptor.intercept(new HttpRequest('POST', `${environment.API_URL}/emisiones`, {}), next).subscribe();
    sessionStorage.setItem('abc', btoa(JSON.stringify({ idusuario: 1 })));
    interceptor.intercept(new HttpRequest('POST', endpoint, { reportName: 'ResumenEmision' }), next).subscribe();
    expect(next.handle).toHaveBeenCalledTimes(2);
  });
});
