import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddSuspensionesComponent } from './add-suspensiones.component';

describe('AddSuspensionesComponent', () => {
  let component: AddSuspensionesComponent;
  let fixture: ComponentFixture<AddSuspensionesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddSuspensionesComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddSuspensionesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
