import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RepoxopcionComponent } from './repoxopcion.component';

describe('RepoxopcionComponent', () => {
  let component: RepoxopcionComponent;
  let fixture: ComponentFixture<RepoxopcionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RepoxopcionComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RepoxopcionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
