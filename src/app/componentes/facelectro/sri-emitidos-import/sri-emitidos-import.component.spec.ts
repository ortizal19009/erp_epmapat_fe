import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SriEmitidosImportComponent } from './sri-emitidos-import.component';

describe('SriEmitidosImportComponent', () => {
  let component: SriEmitidosImportComponent;
  let fixture: ComponentFixture<SriEmitidosImportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SriEmitidosImportComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SriEmitidosImportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
