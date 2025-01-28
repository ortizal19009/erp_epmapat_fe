import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddRemisionComponent } from './add-remision.component';

describe('AddRemisionComponent', () => {
  let component: AddRemisionComponent;
  let fixture: ComponentFixture<AddRemisionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddRemisionComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddRemisionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
