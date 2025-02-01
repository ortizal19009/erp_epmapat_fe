import { TestBed } from '@angular/core/testing';

import { FacxremiService } from './facxremi.service';

describe('FacxremiService', () => {
  let service: FacxremiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FacxremiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
