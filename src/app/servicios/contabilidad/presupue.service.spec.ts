import { TestBed } from '@angular/core/testing';

import { PresupueService } from './presupue.service';

describe('PresupueService', () => {
  let service: PresupueService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PresupueService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
