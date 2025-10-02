import { TestBed } from '@angular/core/testing';

import { Pliego24Service } from './pliego24.service';

describe('Pliego24Service', () => {
  let service: Pliego24Service;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Pliego24Service);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
