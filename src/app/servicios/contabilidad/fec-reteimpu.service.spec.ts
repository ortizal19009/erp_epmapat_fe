import { TestBed } from '@angular/core/testing';

import { FecReteimpuService } from './fec-reteimpu.service';

describe('FecReteimpuService', () => {
  let service: FecReteimpuService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FecReteimpuService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
