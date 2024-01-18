import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListarInteresesComponent } from './intereses.component';

describe('ListarInteresesComponent', () => {
  let component: ListarInteresesComponent;
  let fixture: ComponentFixture<ListarInteresesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ListarInteresesComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ListarInteresesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
