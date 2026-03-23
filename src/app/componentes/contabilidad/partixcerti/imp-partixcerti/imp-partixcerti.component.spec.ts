import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImpPartixcertiComponent } from './imp-partixcerti.component';

describe('ImpPartixcertiComponent', () => {
  let component: ImpPartixcertiComponent;
  let fixture: ComponentFixture<ImpPartixcertiComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ImpPartixcertiComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ImpPartixcertiComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
