import { fakeAsync, tick } from '@angular/core/testing';
import { FormBuilder } from '@angular/forms';
import { of, Subject, throwError } from 'rxjs';
import Swal from 'sweetalert2';
import { ModificarClientesComponent } from './modificar-clientes.component';

describe('ModificarClientesComponent identification validation', () => {
  let component: ModificarClientesComponent;
  let api: any;
  const ruc = { codigo: '04', idtpidentifica: 1 };
  const cedula = { codigo: '05', idtpidentifica: 2 };
  const passport = { codigo: '06', idtpidentifica: 3 };

  beforeEach(() => {
    api = { valIdentificacion: jasmine.createSpy().and.returnValue(of(false)) };
    component = new ModificarClientesComponent(new FormBuilder(), api, {} as any,
      {} as any, {} as any, {} as any, { idusuario: 1 } as any,
      { rolepermission: 3 } as any);
    spyOn<any>(component, 'cargarCatalogosYCliente');
    spyOn(component, 'colocaColor');
    void component.ngOnInit();
    component.antcedula = '1710034065';
  });
  afterEach(() => component.ngOnDestroy());

  function setIdentity(type: any, value: string) {
    component.formCliente.patchValue({ idtpidentifica_tpidentifica: type, cedula: value });
  }

  it('preserves the number and revalidates immediately when the type changes', fakeAsync(() => {
    setIdentity(cedula, '1710034065');
    expect(component.f['cedula'].valid).toBeTrue();
    component.f['idtpidentifica_tpidentifica'].setValue(ruc);
    expect(component.f['cedula'].value).toBe('1710034065');
    expect(component.f['cedula'].hasError('ruc')).toBeTrue();
    component.f['idtpidentifica_tpidentifica'].setValue(cedula);
    expect(component.f['cedula'].valid).toBeTrue();
    expect(api.valIdentificacion).not.toHaveBeenCalled();
  }));

  it('checks duplicates only after the format is valid', fakeAsync(() => {
    setIdentity(ruc, '123');
    tick(300);
    expect(api.valIdentificacion).not.toHaveBeenCalled();
    api.valIdentificacion.and.returnValue(of(true));
    component.f['cedula'].setValue('1710034065001');
    expect(component.f['cedula'].pending).toBeTrue();
    tick(300);
    expect(component.f['cedula'].hasError('existe')).toBeTrue();
  }));

  it('discards an old duplicate response after changing type', fakeAsync(() => {
    const response = new Subject<boolean>();
    api.valIdentificacion.and.returnValue(response);
    setIdentity(passport, 'ABC123');
    tick(300);
    component.f['idtpidentifica_tpidentifica'].setValue(cedula);
    response.next(true);
    response.complete();
    expect(component.f['cedula'].errors).toEqual({ cedula: true });
  }));

  it('allows retry after a failed duplicate lookup', fakeAsync(() => {
    api.valIdentificacion.and.returnValue(throwError(() => new Error('offline')));
    setIdentity(passport, 'ABC123');
    tick(300);
    expect(component.f['cedula'].hasError('consultaIdentificacion')).toBeTrue();
    api.valIdentificacion.and.returnValue(of(false));
    component.reintentarIdentificacion();
    tick(300);
    expect(component.f['cedula'].valid).toBeTrue();
  }));

  it('does not open confirmation while validation is pending', fakeAsync(() => {
    const confirm = spyOn(Swal, 'fire');
    setIdentity(passport, 'ABC123');
    component.formCliente.patchValue({
      idnacionalidad_nacionalidad: 1, nombre: 'Cliente', direccion: 'Calle',
      telefono: '123', fechanacimiento: '2000-01-01', discapacitado: '0',
      porcdiscapacidad: 0, porcexonera: 0, email: 'a@example.com',
      idpjuridica_personeriajuridica: 1,
    });
    expect(component.formCliente.pending).toBeTrue();
    component.onSubmit();
    expect(confirm).not.toHaveBeenCalled();
    tick(300);
  }));
  it('opens with an active user and clears previous passwords', () => {
    component.cliente = { idcliente: 7, username: 'cliente7' } as any;
    component.formCredenciales.patchValue({ activo: false, password: 'previous', confirmPassword: 'previous' });
    component.onBuscarCliente();
    expect(component.formCredenciales.getRawValue()).toEqual({
      username: 'cliente7', password: '', confirmPassword: '', activo: true,
    });
  });

  it('sends the inactive state and clears passwords after saving', () => {
    api.actualizarCredenciales = jasmine.createSpy().and.returnValue(of(undefined));
    component.cliente = { idcliente: 7, username: 'cliente7' } as any;
    component.onBuscarCliente();
    component.formCredenciales.patchValue({ password: 'test123', confirmPassword: 'test123', activo: false });
    expect(component.formCredenciales.valid).toBeTrue();
    component.onActualizarCredenciales();
    expect(api.actualizarCredenciales).toHaveBeenCalledWith(7, 'cliente7', 'test123', false);
    expect(component.formCredenciales.get('password')?.value).toBe('');
    expect(component.loadingGuardar).toBeFalse();
    expect(component.successMsg).toBeTruthy();
  });

});
