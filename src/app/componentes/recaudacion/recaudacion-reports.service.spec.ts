import { TestBed } from '@angular/core/testing';

import { RecaudacionReportsService } from './recaudacion-reports.service';

describe('RecaudacionReportsService', () => {
  let service: RecaudacionReportsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RecaudacionReportsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
