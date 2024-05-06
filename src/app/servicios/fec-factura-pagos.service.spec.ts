import { TestBed } from '@angular/core/testing';

import { FecFacturaPagosService } from './fec-factura-pagos.service';

describe('FecFacturaPagosService', () => {
  let service: FecFacturaPagosService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FecFacturaPagosService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
