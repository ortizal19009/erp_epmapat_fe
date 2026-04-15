import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddPartixcertiComponent } from './add-partixcerti.component';

describe('AddPartixcertiComponent', () => {
  let component: AddPartixcertiComponent;
  let fixture: ComponentFixture<AddPartixcertiComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddPartixcertiComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddPartixcertiComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
