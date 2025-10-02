import { TestBed } from '@angular/core/testing';

import { EjecucionService } from './ejecucio.service';

describe('EjecucionService', () => {
  let service: EjecucionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EjecucionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
