import { TestBed } from '@angular/core/testing';

import { TpcontratosService } from './tpcontratos.service';

describe('TpcontratosService', () => {
  let service: TpcontratosService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TpcontratosService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
