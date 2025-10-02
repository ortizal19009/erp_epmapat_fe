import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddTpidentificaComponent } from './add-tpidentifica.component';

describe('AddTpidentificaComponent', () => {
  let component: AddTpidentificaComponent;
  let fixture: ComponentFixture<AddTpidentificaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddTpidentificaComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddTpidentificaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
