import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddPartixreinteComponent } from './add-partixreinte.component';

describe('AddPartixreinteComponent', () => {
  let component: AddPartixreinteComponent;
  let fixture: ComponentFixture<AddPartixreinteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddPartixreinteComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddPartixreinteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
