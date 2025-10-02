import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListarPtoemisionComponent } from './listar-ptoemision.component';

describe('ListarPtoemisionComponent', () => {
  let component: ListarPtoemisionComponent;
  let fixture: ComponentFixture<ListarPtoemisionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ListarPtoemisionComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ListarPtoemisionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
