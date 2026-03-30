import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddReportejrComponent } from './add-reportejr.component';

describe('AddReportejrComponent', () => {
  let component: AddReportejrComponent;
  let fixture: ComponentFixture<AddReportejrComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddReportejrComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddReportejrComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
