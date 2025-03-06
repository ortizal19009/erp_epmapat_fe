import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NtacreditoComponent } from './ntacredito.component';

describe('NtacreditoComponent', () => {
  let component: NtacreditoComponent;
  let fixture: ComponentFixture<NtacreditoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NtacreditoComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NtacreditoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
