import { TestBed } from '@angular/core/testing';

import { EstrfuncService } from './estrfunc.service';

describe('EstrfuncService', () => {
  let service: EstrfuncService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EstrfuncService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
