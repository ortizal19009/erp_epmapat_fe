import { TestBed } from '@angular/core/testing';

import { TramipresuService } from './tramipresu.service';

describe('TramipresuService', () => {
  let service: TramipresuService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TramipresuService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
