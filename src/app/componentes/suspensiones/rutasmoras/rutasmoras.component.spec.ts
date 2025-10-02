import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RutasmorasComponent } from './rutasmoras.component';

describe('RutasmorasComponent', () => {
  let component: RutasmorasComponent;
  let fixture: ComponentFixture<RutasmorasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RutasmorasComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RutasmorasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
