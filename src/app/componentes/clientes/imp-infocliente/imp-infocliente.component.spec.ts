import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImpInfoclienteComponent } from './imp-infocliente.component';

describe('ImpInfoclienteComponent', () => {
  let component: ImpInfoclienteComponent;
  let fixture: ComponentFixture<ImpInfoclienteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ImpInfoclienteComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ImpInfoclienteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
