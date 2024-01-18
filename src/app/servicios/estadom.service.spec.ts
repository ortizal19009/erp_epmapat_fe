import { TestBed } from '@angular/core/testing';

import { EstadomService } from './estadom.service';

describe('EstadomService', () => {
  let service: EstadomService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EstadomService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
