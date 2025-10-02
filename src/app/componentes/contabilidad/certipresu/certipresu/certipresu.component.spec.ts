import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CertipresuComponent } from './certipresu.component';

describe('CertipresuComponent', () => {
  let component: CertipresuComponent;
  let fixture: ComponentFixture<CertipresuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CertipresuComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CertipresuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
