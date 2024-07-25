import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImpClienteComponent } from './imp-cliente.component';

describe('ImpClienteComponent', () => {
  let component: ImpClienteComponent;
  let fixture: ComponentFixture<ImpClienteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ImpClienteComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ImpClienteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
