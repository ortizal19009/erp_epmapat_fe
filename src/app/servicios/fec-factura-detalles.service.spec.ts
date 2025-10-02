import { TestBed } from '@angular/core/testing';

import { FecFacturaDetallesService } from './fec-factura-detalles.service';

describe('FecFacturaDetallesService', () => {
  let service: FecFacturaDetallesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FecFacturaDetallesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
