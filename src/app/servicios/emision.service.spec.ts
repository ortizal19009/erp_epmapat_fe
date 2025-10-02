import { TestBed } from '@angular/core/testing';

import { EmisionService } from './emision.service';

describe('EmisionService', () => {
  let service: EmisionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EmisionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
