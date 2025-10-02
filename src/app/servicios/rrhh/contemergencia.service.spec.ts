import { TestBed } from '@angular/core/testing';

import { ContemergenciaService } from './contemergencia.service';

describe('ContemergenciaService', () => {
  let service: ContemergenciaService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ContemergenciaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
