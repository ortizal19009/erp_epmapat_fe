import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CvRubrosComponent } from './cv-rubros.component';

describe('CvRubrosComponent', () => {
  let component: CvRubrosComponent;
  let fixture: ComponentFixture<CvRubrosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CvRubrosComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CvRubrosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
