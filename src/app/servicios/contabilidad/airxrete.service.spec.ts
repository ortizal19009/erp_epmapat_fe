import { TestBed } from '@angular/core/testing';

import { AirxreteService } from './airxrete.service';

describe('AirxreteService', () => {
  let service: AirxreteService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AirxreteService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
