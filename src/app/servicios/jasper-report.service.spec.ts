import { TestBed } from '@angular/core/testing';

import { JasperReportService } from './jasper-report.service';

describe('JasperReportService', () => {
  let service: JasperReportService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(JasperReportService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
