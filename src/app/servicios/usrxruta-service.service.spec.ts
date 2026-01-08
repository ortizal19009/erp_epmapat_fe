import { TestBed } from '@angular/core/testing';

import { UsrxrutaServiceService } from './usrxruta-service.service';

describe('UsrxrutaServiceService', () => {
  let service: UsrxrutaServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UsrxrutaServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
