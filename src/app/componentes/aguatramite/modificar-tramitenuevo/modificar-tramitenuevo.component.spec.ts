import { FormBuilder } from '@angular/forms';
import { of } from 'rxjs';
import { ModificarTramitenuevoComponent } from './modificar-tramitenuevo.component';

describe('Finalizacion de nueva acometida: cuenta vinculada', () => {
  let component: ModificarTramitenuevoComponent;
  let agua: any, abonados: any, nuevos: any;
  beforeEach(() => {
    agua = { updateAguatramite: jasmine.createSpy().and.returnValue(of({})) };
    abonados = { getById: jasmine.createSpy().and.returnValue(of({ idabonado: 123 })), saveAbonado: jasmine.createSpy() };
    nuevos = { updateTramiteNuevo: jasmine.createSpy().and.returnValue(of({})) };
    component = new ModificarTramitenuevoComponent(nuevos, null!, agua, null!, new FormBuilder(), abonados, { idusuario: 1 } as any, null!, null!);
    component.aguatramite = { idaguatramite: 55, estado: 1 } as any;
  });

  it('al completar el tramite guarda la cuenta creada, no la del vecino', async () => {
    component.formTramitenuevo = new FormBuilder().group({
      idaguatramite_aguatramite: [{ idaguatramite: 55, idcliente_clientes: { idcliente: 9 } }]
    });
    component.abonado = { idabonado: 999 };
    spyOn<any>(component, 'confirmarEnvioContrato').and.resolveTo(['prueba@example.com']);
    spyOn(component, 'guardarAbonadoAsync').and.resolveTo({ idabonado: 123 } as any);
    spyOn<any>(component, 'enviarContratoPorCorreo').and.resolveTo();
    spyOn(component, 'retornarListaTramites');
    await component.guardarTramite();
    expect(agua.updateAguatramite.calls.mostRecent().args[0].idabonado).toBe(123);
    expect(component.aguatramite.idabonado).toBe(123);
    expect(component.aguatramite.estado).toBe(3);
  });

  it('no finaliza si no se dispone de la cuenta real', async () => {
    await expectAsync(component.actualizarAguaTramiteAsync(3)).toBeRejected();
    expect(agua.updateAguatramite).not.toHaveBeenCalled();
    expect(component.aguatramite.estado).toBe(1);
  });

  it('reutiliza la cuenta creada al reintentar sin generar otra', async () => {
    component._abonado = { idabonado: 123 } as any;
    expect((await component.guardarAbonadoAsync()).idabonado).toBe(123);
    expect(abonados.saveAbonado).not.toHaveBeenCalled();
  });

  it('recupera una cuenta ya vinculada usando el endpoint de un solo abonado', async () => {
    component.aguatramite.idabonado = 123;
    expect((await component.guardarAbonadoAsync()).idabonado).toBe(123);
    expect(abonados.getById).toHaveBeenCalledWith(123);
    expect(abonados.saveAbonado).not.toHaveBeenCalled();
  });
});
