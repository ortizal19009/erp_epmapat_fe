import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModiReintegradaComponent } from './modi-reintegrada.component';

describe('ModiReintegradaComponent', () => {
  let component: ModiReintegradaComponent;
  let fixture: ComponentFixture<ModiReintegradaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ModiReintegradaComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModiReintegradaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
