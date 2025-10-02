import { TestBed } from '@angular/core/testing';

import { CondmultasinteresesService } from './condmultasintereses.service';

describe('CondmultasinteresesService', () => {
  let service: CondmultasinteresesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CondmultasinteresesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
