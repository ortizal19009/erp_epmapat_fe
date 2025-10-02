import { TestBed } from '@angular/core/testing';

import { FacxncService } from './facxnc.service';

describe('FacxncService', () => {
  let service: FacxncService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FacxncService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
