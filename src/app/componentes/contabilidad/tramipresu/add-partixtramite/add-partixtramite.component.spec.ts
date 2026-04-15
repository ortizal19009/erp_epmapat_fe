import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddPartixtramiteComponent } from './add-partixtramite.component';

describe('AddPartixtramiteComponent', () => {
  let component: AddPartixtramiteComponent;
  let fixture: ComponentFixture<AddPartixtramiteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddPartixtramiteComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddPartixtramiteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
