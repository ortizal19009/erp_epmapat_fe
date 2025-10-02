import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddNacionalidadComponent } from './add-nacionalidad.component';

describe('AddNacionalidadComponent', () => {
  let component: AddNacionalidadComponent;
  let fixture: ComponentFixture<AddNacionalidadComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddNacionalidadComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddNacionalidadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
