import { TestBed } from '@angular/core/testing';

import { NiifhomologaService } from './niifhomologa.service';

describe('NiifhomologaService', () => {
  let service: NiifhomologaService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NiifhomologaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
