import { TestBed } from '@angular/core/testing';

import { AutorizaService } from './autoriza.service';

describe('AutorizaService', () => {
  let service: AutorizaService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AutorizaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
