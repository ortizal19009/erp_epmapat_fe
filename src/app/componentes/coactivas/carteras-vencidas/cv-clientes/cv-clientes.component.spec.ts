import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CvClientesComponent } from './cv-clientes.component';

describe('CvClientesComponent', () => {
  let component: CvClientesComponent;
  let fixture: ComponentFixture<CvClientesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CvClientesComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CvClientesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
