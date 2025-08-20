import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AnularConvenioComponent } from './anular-convenio.component';

describe('AnularConvenioComponent', () => {
  let component: AnularConvenioComponent;
  let fixture: ComponentFixture<AnularConvenioComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AnularConvenioComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AnularConvenioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
