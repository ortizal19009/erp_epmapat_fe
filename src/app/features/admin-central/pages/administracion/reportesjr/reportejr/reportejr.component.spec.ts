import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportejrComponent } from './reportejr.component';

describe('ReportejrComponent', () => {
  let component: ReportejrComponent;
  let fixture: ComponentFixture<ReportejrComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ReportejrComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReportejrComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
