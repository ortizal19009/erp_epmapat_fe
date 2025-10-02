import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImpEmisionesComponent } from './imp-emisiones.component';

describe('ImpEmisionesComponent', () => {
  let component: ImpEmisionesComponent;
  let fixture: ComponentFixture<ImpEmisionesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ImpEmisionesComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ImpEmisionesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
