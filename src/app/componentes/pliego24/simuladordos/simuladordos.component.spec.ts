import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SimuladordosComponent } from './simuladordos.component';

describe('SimuladordosComponent', () => {
  let component: SimuladordosComponent;
  let fixture: ComponentFixture<SimuladordosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SimuladordosComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SimuladordosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
