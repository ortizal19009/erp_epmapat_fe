import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StatusConveniosComponent } from './status-convenios.component';

describe('StatusConveniosComponent', () => {
  let component: StatusConveniosComponent;
  let fixture: ComponentFixture<StatusConveniosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ StatusConveniosComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StatusConveniosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
