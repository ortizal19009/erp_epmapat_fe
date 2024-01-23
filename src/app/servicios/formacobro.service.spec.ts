import { TestBed } from '@angular/core/testing';

import { FormacobroService } from './formacobro.service';

describe('FormacobroService', () => {
  let service: FormacobroService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FormacobroService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
