import { TestBed } from '@angular/core/testing';

import { ErpmodulosService } from './erpmodulos.service';

describe('ErpmodulosService', () => {
  let service: ErpmodulosService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ErpmodulosService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
