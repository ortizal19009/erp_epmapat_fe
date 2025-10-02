import { TestBed } from '@angular/core/testing';

import { CatalogoitemService } from './catalogoitem.service';

describe('CatalogoitemsService', () => {
  let service: CatalogoitemService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CatalogoitemService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
