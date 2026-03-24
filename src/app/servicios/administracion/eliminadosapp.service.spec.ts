import { TestBed } from '@angular/core/testing';

import { EliminadosappService } from './eliminadosapp.service';

describe('EliminadosappService', () => {
  let service: EliminadosappService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EliminadosappService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
