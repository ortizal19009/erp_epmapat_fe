import { TestBed } from '@angular/core/testing';

import { VentanasService } from './ventanas.service';

describe('VentanasService', () => {
  let service: VentanasService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(VentanasService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
