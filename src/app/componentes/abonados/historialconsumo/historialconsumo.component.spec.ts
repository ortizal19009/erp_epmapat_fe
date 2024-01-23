import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HistorialconsumoComponent } from './historialconsumo.component';

describe('HistorialconsumoComponent', () => {
  let component: HistorialconsumoComponent;
  let fixture: ComponentFixture<HistorialconsumoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ HistorialconsumoComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HistorialconsumoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
