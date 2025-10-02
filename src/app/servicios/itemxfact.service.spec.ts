import { TestBed } from '@angular/core/testing';

import { ItemxfactService } from './itemxfact.service';

describe('ItemxfactService', () => {
  let service: ItemxfactService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ItemxfactService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
