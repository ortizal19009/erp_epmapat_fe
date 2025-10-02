import { TestBed } from '@angular/core/testing';

import { FacturamodificacionesService } from './facturamodificaciones.service';

describe('FacturamodificacionesService', () => {
  let service: FacturamodificacionesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FacturamodificacionesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
