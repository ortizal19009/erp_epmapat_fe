import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModiBenextranComponent } from './modi-benextran.component';

describe('ModiBenextranComponent', () => {
  let component: ModiBenextranComponent;
  let fixture: ComponentFixture<ModiBenextranComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ModiBenextranComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModiBenextranComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
