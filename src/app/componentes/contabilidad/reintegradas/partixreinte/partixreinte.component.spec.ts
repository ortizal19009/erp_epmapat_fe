import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PartixreinteComponent } from './partixreinte.component';

describe('PartixreinteComponent', () => {
  let component: PartixreinteComponent;
  let fixture: ComponentFixture<PartixreinteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PartixreinteComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PartixreinteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
