import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListarCategoriaComponent } from './categorias.component';

describe('ListarCategoriaComponent', () => {
  let component: ListarCategoriaComponent;
  let fixture: ComponentFixture<ListarCategoriaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ListarCategoriaComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ListarCategoriaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
