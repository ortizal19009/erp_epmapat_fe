import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportesjrComponent } from './reportesjr.component';

describe('ReportesjrComponent', () => {
  let component: ReportesjrComponent;
  let fixture: ComponentFixture<ReportesjrComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ReportesjrComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReportesjrComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
