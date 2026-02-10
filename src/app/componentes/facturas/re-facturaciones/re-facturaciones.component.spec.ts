import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReFacturacionesComponent } from './re-facturaciones.component';

describe('ReFacturacionesComponent', () => {
  let component: ReFacturacionesComponent;
  let fixture: ComponentFixture<ReFacturacionesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReFacturacionesComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ReFacturacionesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
