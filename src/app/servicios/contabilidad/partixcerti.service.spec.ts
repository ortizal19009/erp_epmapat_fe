import { TestBed } from '@angular/core/testing';

import { PartixcertiService } from './partixcerti.service';

describe('PartixcertiService', () => {
  let service: PartixcertiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PartixcertiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
