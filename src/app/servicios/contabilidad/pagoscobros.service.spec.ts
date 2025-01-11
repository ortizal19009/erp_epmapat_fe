import { TestBed } from '@angular/core/testing';

import { PagoscobrosService } from './pagoscobros.service';

describe('PagoscobrosService', () => {
  let service: PagoscobrosService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PagoscobrosService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
