import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RemisionComponent } from './remision.component';

describe('RemisionComponent', () => {
  let component: RemisionComponent;
  let fixture: ComponentFixture<RemisionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RemisionComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RemisionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
