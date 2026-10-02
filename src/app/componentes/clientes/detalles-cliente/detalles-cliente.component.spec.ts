import { CommonModule } from '@angular/common';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AutorizaService } from 'src/app/compartida/autoriza.service';
import { PerfilAccesoService } from 'src/app/servicios/administracion/perfil-acceso.service';
import { AbonadosService } from 'src/app/servicios/abonados.service';
import { ClientesService } from 'src/app/servicios/clientes.service';
import { FacelectroService } from 'src/app/servicios/facelectro.service';
import { FacturaService } from 'src/app/servicios/factura.service';
import { TramitesService } from 'src/app/servicios/ctramites.service';
import { DetallesClienteComponent } from './detalles-cliente.component';

describe('DetallesClienteComponent permissions', () => {
  let component: DetallesClienteComponent;
  let fixture: ComponentFixture<DetallesClienteComponent>;
  let profile: PerfilAccesoService;
  let auth: { idusuario: number };
  let router: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    auth = { idusuario: 2 };
    profile = new PerfilAccesoService(auth as AutorizaService, {} as any, {} as any, {} as any);
    router = jasmine.createSpyObj('Router', ['navigate']);
    await TestBed.configureTestingModule({
      imports: [CommonModule],
      declarations: [DetallesClienteComponent],
      providers: [
        { provide: AutorizaService, useValue: auth },
        { provide: PerfilAccesoService, useValue: profile },
        { provide: Router, useValue: router },
        ...[ClientesService, FacturaService, FacelectroService, AbonadosService, TramitesService]
          .map(provide => ({ provide, useValue: {} })),
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(DetallesClienteComponent);
    component = fixture.componentInstance;
    spyOn(component, 'obtenerDatosCliente');
  });

  function buttons(): string {
    fixture.detectChanges();
    return fixture.nativeElement.textContent;
  }

  it('shows all actions for the system administrator without window records', () => {
    auth.idusuario = 1;
    expect(buttons()).toContain('Modificar');
    expect(buttons()).toContain('Eliminar');
  });

  [0, 1, 2, 3].forEach(level => {
    it(`uses the clientes permission at level ${level}`, () => {
      (profile as any).windowPermissions.set('clientes', level);
      const text = buttons();
      expect(text.includes('Modificar')).toBe(level >= 2);
      expect(text.includes('Eliminar')).toBe(level >= 3);
    });
  });

  it('prevents navigation to editing without permission', () => {
    component.modificarCliente(12);
    expect(router.navigate).not.toHaveBeenCalled();
  });
});
