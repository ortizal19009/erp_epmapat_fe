import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddNtacreditoComponent } from './add-ntacredito.component';

describe('AddNtacreditoComponent', () => {
  let component: AddNtacreditoComponent;
  let fixture: ComponentFixture<AddNtacreditoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddNtacreditoComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddNtacreditoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
