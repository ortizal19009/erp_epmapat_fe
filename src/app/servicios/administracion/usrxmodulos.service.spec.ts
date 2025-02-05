import { TestBed } from '@angular/core/testing';

import { UsrxmodulosService } from './usrxmodulos.service';

describe('UsrxmodulosService', () => {
  let service: UsrxmodulosService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UsrxmodulosService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
