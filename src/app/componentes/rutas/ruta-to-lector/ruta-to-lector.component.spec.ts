import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RutaToLectorComponent } from './ruta-to-lector.component';

describe('RutaToLectorComponent', () => {
  let component: RutaToLectorComponent;
  let fixture: ComponentFixture<RutaToLectorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RutaToLectorComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RutaToLectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
