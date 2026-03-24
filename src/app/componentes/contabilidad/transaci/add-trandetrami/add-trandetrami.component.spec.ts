import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddTrandetramiComponent } from './add-trandetrami.component';

describe('AddTrandetramiComponent', () => {
  let component: AddTrandetramiComponent;
  let fixture: ComponentFixture<AddTrandetramiComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddTrandetramiComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddTrandetramiComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
