import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModificarRutasComponent } from './modificar-rutas.component';

describe('ModificarRutasComponent', () => {
  let component: ModificarRutasComponent;
  let fixture: ComponentFixture<ModificarRutasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ModificarRutasComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ModificarRutasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
