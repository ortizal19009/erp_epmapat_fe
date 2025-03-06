import { TestBed } from '@angular/core/testing';

import { NtacreditoService } from './ntacredito.service';

describe('NtacreditoService', () => {
  let service: NtacreditoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NtacreditoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
