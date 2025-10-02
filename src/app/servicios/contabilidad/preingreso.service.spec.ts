import { TestBed } from '@angular/core/testing';

import { PreingresoService } from './preingreso.service';

describe('PreingresoService', () => {
  let service: PreingresoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PreingresoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
