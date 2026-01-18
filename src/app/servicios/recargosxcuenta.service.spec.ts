import { TestBed } from '@angular/core/testing';

import { RecargosxcuentaService } from './recargosxcuenta.service';

describe('RecargosxcuentaService', () => {
  let service: RecargosxcuentaService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RecargosxcuentaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
