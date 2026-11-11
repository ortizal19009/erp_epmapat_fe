import { fakeAsync, tick } from '@angular/core/testing';
import { FormBuilder } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { BancosComponent } from './bancos.component';

describe('Control de bancos', () => {
  let c: any, api: any;
  beforeEach(() => {
    c = Object.create(BancosComponent.prototype);
    api = { updateTransaci: jasmine.createSpy().and.returnValue(of({})) };
    Object.assign(c, { tranService: api, authService: { idusuario: 7 },
      formBancos: new FormBuilder().group({ mes: 4, idcuenta: 1 }) });
  });
  it('concilia con el mes elegido y envia solo campos de conciliacion', fakeAsync(() => {
    const t = { inttra: 10, mesconcili: 0, swconcili: 0, valor: 100 };
    c.cambioDatosCheck({ target: { checked: true, style: {} } }, t);
    const payload = api.updateTransaci.calls.mostRecent().args[0];
    expect(payload.swconcili).toBe(1); expect(payload.mesconcili).toBe(4);
    expect(payload.valor).toBeUndefined(); expect(t.valor).toBe(100); tick(1000);
  }));
  it('restaura la fila si falla el guardado', fakeAsync(() => {
    spyOn(console, 'error'); api.updateTransaci.and.returnValue(throwError(() => new Error('Sin conexion')));
    const t = { inttra: 10, mesconcili: 4, swconcili: 1 };
    const target = { checked: false, style: {} };
    c.cambioDatosCheck({ target }, t);
    expect(t.mesconcili).toBe(4); expect(t.swconcili).toBe(1); expect(target.checked).toBeTrue(); tick(1000);
  }));
  it('calcula saldos con el valor nuevo y convierte entradas de texto', () => {
    c.formConcilia = new FormBuilder().group({ baninicial: '1000', bandebitos: '100', bancreditos: '50',
      banfinal: 0, bancheaa: '20', bannc: '10', bannd: '5', banerrores: '2', bansaldo: 0,
      libfinal: '200', libdepositos: '30', libcheques: '10', liberrores: '5', libsaldo: 0 });
    c.changeBanco(); c.changeLibros();
    expect(c.formConcilia.value.banfinal).toBe(950); expect(c.formConcilia.value.bansaldo).toBe(927);
    expect(c.formConcilia.value.libsaldo).toBe(185);
  });
  it('un catalogo bancario vacio no rompe la pantalla', () => {
    c.cueService = { getBancos: () => of([]) };
    c.listarBancos(); expect(c.formBancos.value.idcuenta).toBe('');
  });  it('Aceptar guarda los campos de documento sin enviar valor o cuenta', () => {
    c.formTransaci = new FormBuilder().group({ intdoc: 1, numdoc: 'DOC-7', descri: 'Corregido' });
    c.movimientoSeleccionado = { inttra: 10, valor: 100 }; c._documentos = [{ intdoc: 1 }];
    c.guardarCambiosMovimiento();
    const payload = api.updateTransaci.calls.mostRecent().args[0];
    expect(payload.intdoc).toEqual({ intdoc: 1 }); expect(payload.numdoc).toBe('DOC-7');
    expect(payload.valor).toBeUndefined(); expect(payload.idcuenta).toBeUndefined();
    expect(c.movimientoSeleccionado.numdoc).toBe('DOC-7'); expect(c.movimientoSeleccionado.valor).toBe(100);
    expect(c.guardandoMovimiento).toBeFalse();
  });
  it('guarda la conciliacion existente sin crear otro registro para el mes', () => {
    c.conciliaban = { idconcilia: 8, idcuenta: { idcuenta: 1 }, mes: 4 };
    c.formConcilia = new FormBuilder().group({ baninicial: '100', observa: 'Revisado' });
    c.conciService = { updateConciliaBan: jasmine.createSpy().and.returnValue(of(c.conciliaban)) };
    c.guardarConciliacion();
    const cambio = c.conciService.updateConciliaBan.calls.mostRecent().args[0];
    expect(cambio.idconcilia).toBe(8); expect(cambio.idcuenta).toEqual({ idcuenta: 1 });
    expect(cambio.mes).toBe(4); expect(cambio.baninicial).toBe(100); expect(cambio.libfinal).toBeUndefined();
  });

});
