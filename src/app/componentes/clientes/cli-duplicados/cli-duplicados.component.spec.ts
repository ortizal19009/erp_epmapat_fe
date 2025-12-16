import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CliDuplicadosComponent } from './cli-duplicados.component';

describe('CliDuplicadosComponent', () => {
  let component: CliDuplicadosComponent;
  let fixture: ComponentFixture<CliDuplicadosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CliDuplicadosComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CliDuplicadosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
