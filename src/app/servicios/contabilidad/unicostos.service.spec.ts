import { TestBed } from '@angular/core/testing';

import { UnicostosService } from './unicostos.service';

describe('UnicostosService', () => {
  let service: UnicostosService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UnicostosService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
