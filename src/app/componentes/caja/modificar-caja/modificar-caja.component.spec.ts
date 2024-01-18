import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModificarCajaComponent } from './modificar-caja.component';

describe('ModificarCajaComponent', () => {
  let component: ModificarCajaComponent;
  let fixture: ComponentFixture<ModificarCajaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ModificarCajaComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ModificarCajaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
