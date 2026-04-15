import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModiDesdetramiteComponent } from './modi-desdetramite.component';

describe('ModiDesdetramiteComponent', () => {
  let component: ModiDesdetramiteComponent;
  let fixture: ComponentFixture<ModiDesdetramiteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ModiDesdetramiteComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModiDesdetramiteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
