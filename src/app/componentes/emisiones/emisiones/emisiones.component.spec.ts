import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmisionesComponent } from './emisiones.component';

describe('EmisionesComponent', () => {
  let component: EmisionesComponent;
  let fixture: ComponentFixture<EmisionesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EmisionesComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmisionesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
