import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';

import { MainHeaderComponent } from './main-header.component';
import { MainFooterComponent } from '../main-footer/main-footer.component';
import { AutorizaService } from '../compartida/autoriza.service';
import { UsuarioService } from '../servicios/administracion/usuario.service';
import { ErpmodulosService } from '../servicios/administracion/erpmodulos.service';

describe('MainHeaderComponent', () => {
  let component: MainHeaderComponent;
  let fixture: ComponentFixture<MainHeaderComponent>;

  const mainFooterMock = {
    fondo: jasmine.createSpy('fondo'),
  };

  const authServiceMock = {
    colorenabled: true,
    nomodulo: '',
    moduActual: 1,
    sessionlog: false,
    enabled: [false, false, false, false, false, false, false],
    valsession: jasmine.createSpy('valsession'),
    enabModulos: jasmine.createSpy('enabModulos'),
    selecModulo: jasmine.createSpy('selecModulo'),
  };

  const usuarioServiceMock = {
    getByIdusuario: jasmine.createSpy('getByIdusuario').and.returnValue(
      of({ fdesde: '', fhasta: '', otrapestania: false })
    ),
    updateUsuario: jasmine.createSpy('updateUsuario').and.returnValue(of({})),
  };

  const erpmodulosServiceMock = {
    findByPlatform: jasmine.createSpy('findByPlatform').and.returnValue(
      Promise.resolve([{ descripcion: 'Comercialización', enabled: true, iderpmodulo: 1 }])
    ),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MainHeaderComponent],
      imports: [CommonModule, ReactiveFormsModule, RouterTestingModule],
      providers: [
        { provide: MainFooterComponent, useValue: mainFooterMock },
        { provide: AutorizaService, useValue: authServiceMock },
        { provide: UsuarioService, useValue: usuarioServiceMock },
        { provide: ErpmodulosService, useValue: erpmodulosServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MainHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
