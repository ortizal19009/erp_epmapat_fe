import { TestBed } from '@angular/core/testing';

import { ValoresncService } from './valoresnc.service';

describe('ValoresncService', () => {
  let service: ValoresncService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ValoresncService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
