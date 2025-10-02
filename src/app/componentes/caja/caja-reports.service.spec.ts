import { TestBed } from '@angular/core/testing';

import { CajaReportsService } from './caja-reports.service';

describe('CajaReportsService', () => {
  let service: CajaReportsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CajaReportsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
