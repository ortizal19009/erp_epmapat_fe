import { TestBed } from '@angular/core/testing';

import { BenextranService } from './benextran.service';

describe('BenextranService', () => {
  let service: BenextranService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BenextranService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
