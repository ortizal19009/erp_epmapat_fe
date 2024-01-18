import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddPreciosxcatComponent } from './add-preciosxcat.component';

describe('AddPreciosxcatComponent', () => {
  let component: AddPreciosxcatComponent;
  let fixture: ComponentFixture<AddPreciosxcatComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddPreciosxcatComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddPreciosxcatComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
