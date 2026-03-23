import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReintegradasComponent } from './reintegradas.component';

describe('ReintegradasComponent', () => {
  let component: ReintegradasComponent;
  let fixture: ComponentFixture<ReintegradasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ReintegradasComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReintegradasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
