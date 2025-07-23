import { TestBed } from '@angular/core/testing';

import { SriService } from './sri.service';

describe('SriService', () => {
  let service: SriService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SriService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
