import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListarNacionalidadComponent } from './listar-nacionalidad.component';

describe('ListarNacionalidadComponent', () => {
  let component: ListarNacionalidadComponent;
  let fixture: ComponentFixture<ListarNacionalidadComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ListarNacionalidadComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ListarNacionalidadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
