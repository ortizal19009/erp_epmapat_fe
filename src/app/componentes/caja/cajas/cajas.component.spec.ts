import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListarCajaComponent } from './cajas.component';

describe('ListarCajaComponent', () => {
  let component: ListarCajaComponent;
  let fixture: ComponentFixture<ListarCajaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ListarCajaComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ListarCajaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
