import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModificarInteresesComponent } from './modificar-intereses.component';

describe('ModificarInteresesComponent', () => {
  let component: ModificarInteresesComponent;
  let fixture: ComponentFixture<ModificarInteresesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ModificarInteresesComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ModificarInteresesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
