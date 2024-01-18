import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModificarCategoriaComponent } from './modi-categoria.component';

describe('ModificarCategoriaComponent', () => {
  let component: ModificarCategoriaComponent;
  let fixture: ComponentFixture<ModificarCategoriaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ModificarCategoriaComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ModificarCategoriaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
