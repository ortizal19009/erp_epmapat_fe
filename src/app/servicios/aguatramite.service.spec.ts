import { TestBed } from '@angular/core/testing';

import { AguatramiteService } from './aguatramite.service';

describe('AguatramiteService', () => {
  let service: AguatramiteService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AguatramiteService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
