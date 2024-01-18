import { TestBed } from '@angular/core/testing';

import { AbonadosService } from './abonados.service';

describe('AbonadosService', () => {
  let service: AbonadosService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AbonadosService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
