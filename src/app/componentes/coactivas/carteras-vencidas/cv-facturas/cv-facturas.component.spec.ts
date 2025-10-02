import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CvFacturasComponent } from './cv-facturas.component';

describe('CvFacturasComponent', () => {
  let component: CvFacturasComponent;
  let fixture: ComponentFixture<CvFacturasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CvFacturasComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CvFacturasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
