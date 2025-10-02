import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmiactualComponent } from './emiactual.component';

describe('EmiactualComponent', () => {
  let component: EmiactualComponent;
  let fixture: ComponentFixture<EmiactualComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EmiactualComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmiactualComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
