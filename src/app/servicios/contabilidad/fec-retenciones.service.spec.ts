import { TestBed } from '@angular/core/testing';

import { FecRetencionService } from './fec-retenciones.service';

describe('FecRetencionService', () => {
  let service: FecRetencionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FecRetencionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
