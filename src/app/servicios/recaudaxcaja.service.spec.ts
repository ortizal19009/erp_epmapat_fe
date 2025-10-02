import { TestBed } from '@angular/core/testing';

import { RecaudaxcajaService } from './recaudaxcaja.service';

describe('RecaudaxcajaService', () => {
  let service: RecaudaxcajaService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RecaudaxcajaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
