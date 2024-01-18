import { TestBed } from '@angular/core/testing';

import { UsoitemsService } from './usoitems.service';

describe('UsoitemsService', () => {
  let service: UsoitemsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UsoitemsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
