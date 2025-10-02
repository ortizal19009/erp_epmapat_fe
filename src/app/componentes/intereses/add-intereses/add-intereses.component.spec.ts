import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddInteresesComponent } from './add-intereses.component';

describe('AddInteresesComponent', () => {
  let component: AddInteresesComponent;
  let fixture: ComponentFixture<AddInteresesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddInteresesComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddInteresesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
