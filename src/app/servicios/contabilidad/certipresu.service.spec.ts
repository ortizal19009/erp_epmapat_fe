import { TestBed } from '@angular/core/testing';

import { CertipresuService } from './certipresu.service';

describe('CertipresuService', () => {
  let service: CertipresuService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CertipresuService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
