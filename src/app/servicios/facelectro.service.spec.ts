import { TestBed } from '@angular/core/testing';

import { FacelectroService } from './facelectro.service';

describe('FacelectroService', () => {
  let service: FacelectroService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FacelectroService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
