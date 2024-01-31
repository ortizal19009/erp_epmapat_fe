import { TestBed } from '@angular/core/testing';

import { ConveniosReportsService } from './convenios-reports.service';

describe('ConveniosReportsService', () => {
  let service: ConveniosReportsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ConveniosReportsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
