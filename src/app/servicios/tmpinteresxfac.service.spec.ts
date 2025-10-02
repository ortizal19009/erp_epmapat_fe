import { TestBed } from '@angular/core/testing';

import { TmpinteresxfacService } from './tmpinteresxfac.service';

describe('TmpinteresxfacService', () => {
  let service: TmpinteresxfacService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TmpinteresxfacService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
