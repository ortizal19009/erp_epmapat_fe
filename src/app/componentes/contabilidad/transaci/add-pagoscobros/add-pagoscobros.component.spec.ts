import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddPagoscobrosComponent } from './add-pagoscobros.component';

describe('AddPagoscobrosComponent', () => {
  let component: AddPagoscobrosComponent;
  let fixture: ComponentFixture<AddPagoscobrosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddPagoscobrosComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddPagoscobrosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
