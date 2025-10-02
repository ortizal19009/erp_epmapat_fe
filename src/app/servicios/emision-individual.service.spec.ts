import { TestBed } from '@angular/core/testing';

import { EmisionIndividualService } from './emision-individual.service';

describe('EmisionIndividualService', () => {
  let service: EmisionIndividualService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EmisionIndividualService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
