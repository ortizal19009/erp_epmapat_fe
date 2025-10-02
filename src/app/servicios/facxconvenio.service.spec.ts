import { TestBed } from '@angular/core/testing';

import { FacxconvenioService } from './facxconvenio.service';

describe('FacxconvenioService', () => {
  let service: FacxconvenioService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FacxconvenioService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
