import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddCertificacionesComponent } from './add-certificaciones.component';

describe('AddCertificacionesComponent', () => {
  let component: AddCertificacionesComponent;
  let fixture: ComponentFixture<AddCertificacionesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddCertificacionesComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddCertificacionesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
