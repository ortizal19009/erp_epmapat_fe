import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NtcreditoComponent } from './ntcredito.component';

describe('NtcreditoComponent', () => {
  let component: NtcreditoComponent;
  let fixture: ComponentFixture<NtcreditoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NtcreditoComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NtcreditoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
