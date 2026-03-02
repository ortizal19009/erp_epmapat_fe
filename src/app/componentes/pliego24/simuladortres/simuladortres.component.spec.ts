import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SimuladortresComponent } from './simuladortres.component';

describe('SimuladortresComponent', () => {
  let component: SimuladortresComponent;
  let fixture: ComponentFixture<SimuladortresComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SimuladortresComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SimuladortresComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
