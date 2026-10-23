import { RetencionesComponent } from './retenciones.component';

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
});
