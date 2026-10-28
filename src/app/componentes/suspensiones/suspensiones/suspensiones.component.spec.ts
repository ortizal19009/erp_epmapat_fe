import { FormBuilder } from '@angular/forms';
import { of, Subject } from 'rxjs';
import { SuspensionesComponent } from './suspensiones.component';
import { HabilitacionesComponent } from '../../habilitaciones/habilitaciones/habilitaciones.component';

describe('Listados de cuentas afectadas', () => {
  it('usa las cuentas vinculadas en ambos listados y permite entrar al detalle de una habilitacion', () => {
    const router = { navigate: jasmine.createSpy() };
    const registros = [{ idsuspension: 10, total: 999, cuentasAfectadas: [100, 200] }];
    const api = { getListaSuspensiones: () => of(registros), getListaHabilitaciones: () => of(registros) };
    const suspension = new SuspensionesComponent(router as any, api as any, null!, new FormBuilder(), null!, null!, null!, null!);
    const habilitacion = new HabilitacionesComponent(new FormBuilder(), router as any, api as any, null!, null!, null!, null!, null!, null!);
    suspension.listarSuspensiones(); habilitacion.listarSuspensiones();
    expect(suspension.totalCuentasVinculadas).toBe(2);
    expect(habilitacion.totalCuentasVinculadas).toBe(2);
    const id = sessionStorage.getItem('idsuspensionToInfo');
    const origen = sessionStorage.getItem('retornoSuspensionesInfo');
    try {
      habilitacion.info(registros[0]);
      expect(sessionStorage.getItem('retornoSuspensionesInfo')).toBe('habilitaciones');
      expect(router.navigate).toHaveBeenCalledWith(['info-suspension']);
    } finally {
      if (id === null) sessionStorage.removeItem('idsuspensionToInfo'); else sessionStorage.setItem('idsuspensionToInfo', id);
      if (origen === null) sessionStorage.removeItem('retornoSuspensionesInfo'); else sessionStorage.setItem('retornoSuspensionesInfo', origen);
      suspension.ngOnDestroy(); habilitacion.ngOnDestroy();
    }
  });

  it('descarta respuestas de una consulta de fechas anterior', () => {
    const anterior = new Subject<any[]>();
    const api = { getByFecha: jasmine.createSpy().and.returnValues(anterior, of([{ numero: 2, cuentasAfectadas: [20] }])) };
    const suspension = new SuspensionesComponent(null!, api as any, null!, new FormBuilder(), null!, null!, null!, null!);
    suspension.formSuspensiones = new FormBuilder().group({ desde: '2026-01-01', hasta: '2026-10-28' });
    suspension.buscarxFecha(); suspension.buscarxFecha();
    anterior.next([{ numero: 1, cuentasAfectadas: [10] }]);
    expect(suspension.suspensiones[0].numero).toBe(2);
    expect(suspension.cargandoListado).toBeFalse();
    suspension.ngOnDestroy();
  });
  it('ambos reportes usan solo las filas filtradas y el rango realmente consultado', async () => {
    const reportes = { descargar: jasmine.createSpy().and.returnValue(Promise.resolve()) };
    const api = { getByFecha: () => of([{numero: 1, observa: 'seleccionado'}, {numero: 2, observa: 'otro'}]),
      getListaHabilitacionesByFecha: () => of([{numero: 3, observa: 'seleccionado'}, {numero: 4, observa: 'otro'}]) };
    const suspension = new SuspensionesComponent(null!, api as any, null!, new FormBuilder(), null!, null!, null!, null!, reportes as any);
    const habilitacion = new HabilitacionesComponent(new FormBuilder(), null!, api as any, null!, null!, null!, null!, null!, null!, reportes as any);
    suspension.formSuspensiones = new FormBuilder().group({desde: '2026-01-01', hasta: '2026-10-28'});
    habilitacion.f_buscarxFechas = new FormBuilder().group({desde: '2026-01-01', hasta: '2026-10-28'});
    suspension.buscarxFecha(); habilitacion.buscarxFecha();
    suspension.formSuspensiones.patchValue({desde: '2026-09-01'});
    suspension.filterTerm = habilitacion.filterTerm = 'seleccionado';
    await suspension.descargarReporte('pdf'); await habilitacion.descargarReporte('xlsx');
    expect(reportes.descargar.calls.argsFor(0)).toEqual(['Suspensiones', [{numero: 1, observa: 'seleccionado'}],
      'Desde 2026-01-01 hasta 2026-10-28 | Busqueda: seleccionado', 'pdf']);
    expect(reportes.descargar.calls.argsFor(1)[1]).toEqual([{numero: 3, observa: 'seleccionado'}]);
    expect(reportes.descargar.calls.argsFor(1)[3]).toBe('xlsx');
    suspension.ngOnDestroy(); habilitacion.ngOnDestroy();
  });

});
