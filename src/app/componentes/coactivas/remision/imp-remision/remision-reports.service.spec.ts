import { TestBed } from '@angular/core/testing';

import { RemisionReportsService } from './remision-reports.service';

describe('RemisionReportsService', () => {
  let service: RemisionReportsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RemisionReportsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
