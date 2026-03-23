import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddReintegradaComponent } from './add-reintegrada.component';

describe('AddReintegradaComponent', () => {
  let component: AddReintegradaComponent;
  let fixture: ComponentFixture<AddReintegradaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddReintegradaComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddReintegradaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
