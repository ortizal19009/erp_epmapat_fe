import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImpInfoCajasComponent } from './imp-info-cajas.component';

describe('ImpInfoCajasComponent', () => {
  let component: ImpInfoCajasComponent;
  let fixture: ComponentFixture<ImpInfoCajasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ImpInfoCajasComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ImpInfoCajasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
