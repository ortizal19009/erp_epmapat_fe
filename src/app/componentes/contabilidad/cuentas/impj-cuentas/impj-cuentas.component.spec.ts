import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImpjCuentasComponent } from './impj-cuentas.component';

describe('ImpjCuentasComponent', () => {
  let component: ImpjCuentasComponent;
  let fixture: ComponentFixture<ImpjCuentasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ImpjCuentasComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ImpjCuentasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
