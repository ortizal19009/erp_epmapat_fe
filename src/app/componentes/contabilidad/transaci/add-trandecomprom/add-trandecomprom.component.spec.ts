import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddTrandecompromComponent } from './add-trandecomprom.component';

describe('AddTrandecompromComponent', () => {
  let component: AddTrandecompromComponent;
  let fixture: ComponentFixture<AddTrandecompromComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddTrandecompromComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddTrandecompromComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
