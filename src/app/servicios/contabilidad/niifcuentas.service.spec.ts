import { TestBed } from '@angular/core/testing';

import { NiifcuentasService } from './niifcuentas.service';

describe('NiifcuentasService', () => {
  let service: NiifcuentasService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NiifcuentasService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
