import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BuscarabonadoComponent } from './buscarabonado.component';

describe('BuscarabonadoComponent', () => {
  let component: BuscarabonadoComponent;
  let fixture: ComponentFixture<BuscarabonadoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BuscarabonadoComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BuscarabonadoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
