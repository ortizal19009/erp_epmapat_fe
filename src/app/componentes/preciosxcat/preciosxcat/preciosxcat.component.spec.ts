import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PreciosxcatComponent } from './preciosxcat.component';

describe('PreciosxcatComponent', () => {
  let component: PreciosxcatComponent;
  let fixture: ComponentFixture<PreciosxcatComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PreciosxcatComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PreciosxcatComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
