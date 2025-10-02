import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TpidentificasComponent } from './tpidentificas.component';

describe('TpidentificasComponent', () => {
  let component: TpidentificasComponent;
  let fixture: ComponentFixture<TpidentificasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TpidentificasComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TpidentificasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
