import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddEmisionComponent } from './add-emision.component';

describe('AddEmisionComponent', () => {
  let component: AddEmisionComponent;
  let fixture: ComponentFixture<AddEmisionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddEmisionComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddEmisionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
