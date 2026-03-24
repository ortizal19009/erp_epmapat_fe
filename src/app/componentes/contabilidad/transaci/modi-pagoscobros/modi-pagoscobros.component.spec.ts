import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModiPagoscobrosComponent } from './modi-pagoscobros.component';

describe('ModiPagoscobrosComponent', () => {
  let component: ModiPagoscobrosComponent;
  let fixture: ComponentFixture<ModiPagoscobrosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ModiPagoscobrosComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModiPagoscobrosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
