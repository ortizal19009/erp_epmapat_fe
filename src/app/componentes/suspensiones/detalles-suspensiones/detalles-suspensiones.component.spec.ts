import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetallesSuspensionesComponent } from './detalles-suspensiones.component';

describe('DetallesSuspensionesComponent', () => {
  let component: DetallesSuspensionesComponent;
  let fixture: ComponentFixture<DetallesSuspensionesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DetallesSuspensionesComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DetallesSuspensionesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
