import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AnulacionesBajasComponent } from './anulaciones-bajas.component';

describe('AnulacionesBajasComponent', () => {
  let component: AnulacionesBajasComponent;
  let fixture: ComponentFixture<AnulacionesBajasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AnulacionesBajasComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AnulacionesBajasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
