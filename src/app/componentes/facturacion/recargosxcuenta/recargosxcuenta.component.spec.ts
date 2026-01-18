import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecargosxcuentaComponent } from './recargosxcuenta.component';

describe('RecargosxcuentaComponent', () => {
  let component: RecargosxcuentaComponent;
  let fixture: ComponentFixture<RecargosxcuentaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RecargosxcuentaComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RecargosxcuentaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
