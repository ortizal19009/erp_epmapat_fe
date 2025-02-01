import { TestBed } from '@angular/core/testing';

import { RemisionService } from './remision.service';

describe('RemisionService', () => {
  let service: RemisionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RemisionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
