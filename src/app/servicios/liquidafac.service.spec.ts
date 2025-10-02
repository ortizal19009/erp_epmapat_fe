import { TestBed } from '@angular/core/testing';

import { LiquidafacService } from './liquidafac.service';

describe('LiquidafacService', () => {
  let service: LiquidafacService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LiquidafacService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
