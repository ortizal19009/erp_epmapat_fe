import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModificarPtoemisionComponent } from './modificar-ptoemision.component';

describe('ModificarPtoemisionComponent', () => {
  let component: ModificarPtoemisionComponent;
  let fixture: ComponentFixture<ModificarPtoemisionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ModificarPtoemisionComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ModificarPtoemisionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
