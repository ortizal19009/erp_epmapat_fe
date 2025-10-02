import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddPtoemisionComponent } from './add-ptoemision.component';

describe('AddPtoemisionComponent', () => {
  let component: AddPtoemisionComponent;
  let fixture: ComponentFixture<AddPtoemisionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddPtoemisionComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddPtoemisionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
