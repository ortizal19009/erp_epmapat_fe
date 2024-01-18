import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddRutasComponent } from './add-rutas.component';

describe('AddRutasComponent', () => {
  let component: AddRutasComponent;
  let fixture: ComponentFixture<AddRutasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddRutasComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddRutasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
