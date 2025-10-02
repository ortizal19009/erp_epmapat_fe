import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListarTipopagoComponent } from './listar-tipopago.component';

describe('ListarTipopagoComponent', () => {
  let component: ListarTipopagoComponent;
  let fixture: ComponentFixture<ListarTipopagoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ListarTipopagoComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListarTipopagoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
