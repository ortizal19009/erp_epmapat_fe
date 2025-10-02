import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModificarPreciosxcatComponent } from './modificar-preciosxcat.component';

describe('ModificarPreciosxcatComponent', () => {
  let component: ModificarPreciosxcatComponent;
  let fixture: ComponentFixture<ModificarPreciosxcatComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ModificarPreciosxcatComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ModificarPreciosxcatComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
