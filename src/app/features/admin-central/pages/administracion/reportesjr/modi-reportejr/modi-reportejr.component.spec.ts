import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModiReportejrComponent } from './modi-reportejr.component';

describe('ModiReportejrComponent', () => {
  let component: ModiReportejrComponent;
  let fixture: ComponentFixture<ModiReportejrComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ModiReportejrComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModiReportejrComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
