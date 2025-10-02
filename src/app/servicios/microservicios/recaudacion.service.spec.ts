import { TestBed } from '@angular/core/testing';

import { RecaudacionService } from './recaudacion.service';

describe('RecaudacionService', () => {
  let service: RecaudacionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RecaudacionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
