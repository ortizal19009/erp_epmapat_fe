import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListarNovedadesComponent } from './listar-novedades.component';

describe('ListarNovedadesComponent', () => {
  let component: ListarNovedadesComponent;
  let fixture: ComponentFixture<ListarNovedadesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ListarNovedadesComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListarNovedadesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
