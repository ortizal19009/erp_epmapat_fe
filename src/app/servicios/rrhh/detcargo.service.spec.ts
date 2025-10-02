import { TestBed } from '@angular/core/testing';

import { DetcargoService } from './detcargo.service';

describe('DetcargoService', () => {
  let service: DetcargoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DetcargoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
