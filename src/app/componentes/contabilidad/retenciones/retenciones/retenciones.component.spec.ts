import { of } from 'rxjs';
﻿import { RetencionesComponent } from './retenciones.component';

describe('RetencionesComponent: estados del controlador de retenciones', () => {
  let component: RetencionesComponent;
  beforeEach(() => {
    component = Object.create(RetencionesComponent.prototype);
    component.estadosSri = [{ idretencion: 1, estado: 'PENDIENTE' }];
    (component as any).resultadosSri = new Map();
  });
  it('reconoce AUTORIZADO y muestra el resultado reciente sobre el registro anterior', () => {
    const retencion = { idrete: 1 };
    (component as any).aplicarResultadoSriRetencion(retencion, {
      estado: 'AUTORIZADO', numeroAutorizacion: '123', claveAcceso: '1'.repeat(49),
    });
    expect(component.estadoSri(retencion)).toBe('AUTORIZADA');
    expect((retencion as any).numautoriza_e).toBe('123');
    expect((retencion as any).fecautoriza).toBeUndefined();
  });
  it('no interpreta NO_AUTORIZADO como autorizacion exitosa', () => {
    expect((component as any).normalizarEstadoSri('NO_AUTORIZADO')).toBe('NO_AUTORIZADO');
    expect((component as any).normalizarEstadoSri('PENDIENTE_AUTORIZACION')).toBe('PENDIENTE_AUTORIZACION');
  });
  it('procesa en el ERP por ID y permite generar el RIDE con los metadatos devueltos', async () => {
    const retencion = { idrete: 1 };
    component.accionEnCursoId = null;
    (component as any).authService = { swal: jasmine.createSpy('swal') };
    (component as any).sriRetencionesService = {
      procesarPorId: jasmine.createSpy('procesarPorId').and.returnValue(of({
        estado: 'ENVIADA', numeroAutorizacion: '123', fechaAutorizacion: '2026-10-27', emailEnviado: true,
      })),
    };
    spyOn(component, 'cargarEstadosSri').and.resolveTo();
    await component.procesarSri(retencion);
    expect((component as any).sriRetencionesService.procesarPorId).toHaveBeenCalledWith(1);
    expect(component.puedeGenerarPdf(retencion)).toBeTrue();
    expect(component.accionEnCursoId).toBeNull();
  });

  it('muestra el rechazo SRI como error y no anuncia autorizacion', async () => {
    component.accionEnCursoId = null;
    const swal = jasmine.createSpy('swal');
    (component as any).authService = { swal };
    (component as any).sriRetencionesService = {
      procesarPorId: () => of({ estado: 'NO_AUTORIZADO', detalle: 'Rechazo SRI' }),
    };
    spyOn(component, 'cargarEstadosSri').and.resolveTo();
    await component.procesarSri({ idrete: 1 });
    expect(swal).toHaveBeenCalledWith('error', 'Rechazo SRI');
    expect(swal).not.toHaveBeenCalledWith('success', jasmine.any(String));
  });
  it('consulta la clave guardada en la retencion aunque el registro electronico tenga clave vacia', () => {
    const clave = '2708202607046002881000120010010000069377396000011';
    component.estadosSri = [{ idretencion: 156, claveacceso: '' }];
    expect(component.getClaveAccesoRetencion({ idrete: 156, claveacceso: clave })).toBe(clave);
  });

  it('no inventa una clave para recuperar un documento autorizado', () => {
    expect(component.getClaveAccesoRetencion({ idrete: 156 })).toBe('');
  });
});
