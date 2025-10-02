import { TestBed } from '@angular/core/testing';

import { FecFacturaDetallesImpuestosService } from './fec-factura-detalles-impuestos.service';

describe('FecFacturaDetallesImpuestosService', () => {
  let service: FecFacturaDetallesImpuestosService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FecFacturaDetallesImpuestosService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
