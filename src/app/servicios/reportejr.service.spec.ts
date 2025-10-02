import { TestBed } from '@angular/core/testing';

import { ReportejrService } from './reportejr.service';

describe('ReportejrService', () => {
  let service: ReportejrService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ReportejrService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
