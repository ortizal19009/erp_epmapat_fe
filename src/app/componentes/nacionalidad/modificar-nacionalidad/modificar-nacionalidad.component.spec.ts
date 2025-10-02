import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModificarNacionalidadComponent } from './modificar-nacionalidad.component';

describe('ModificarNacionalidadComponent', () => {
  let component: ModificarNacionalidadComponent;
  let fixture: ComponentFixture<ModificarNacionalidadComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ModificarNacionalidadComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ModificarNacionalidadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
