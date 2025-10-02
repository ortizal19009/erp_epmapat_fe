import { TestBed } from '@angular/core/testing';

import { RutasxemisionService } from './rutasxemision.service';

describe('RutasxemisionService', () => {
  let service: RutasxemisionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RutasxemisionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
