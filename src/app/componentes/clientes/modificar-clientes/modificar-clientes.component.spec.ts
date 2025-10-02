import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModificarClientesComponent } from './modificar-clientes.component';

describe('ModificarClientesComponent', () => {
  let component: ModificarClientesComponent;
  let fixture: ComponentFixture<ModificarClientesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ModificarClientesComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ModificarClientesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
