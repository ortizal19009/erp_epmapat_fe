import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { NiifcuentasService } from './niifcuentas.service';

describe('Opciones del plan NIIF', () => {
  let service: NiifcuentasService, http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(NiifcuentasService); http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  it('modifica una cuenta con PUT, como exige el backend', () => {
    service.updateNiifCuenta({ idniifcue: 7 } as any).subscribe();
    const req = http.expectOne(r => r.url.endsWith('/niifcuentas/upd/7'));
    expect(req.request.method).toBe('PUT'); req.flush({});
  });
});
