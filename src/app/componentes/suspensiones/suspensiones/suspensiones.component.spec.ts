import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SuspensionesComponent } from './suspensiones.component';

describe('SuspensionesComponent', () => {
  let component: SuspensionesComponent;
  let fixture: ComponentFixture<SuspensionesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SuspensionesComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SuspensionesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
