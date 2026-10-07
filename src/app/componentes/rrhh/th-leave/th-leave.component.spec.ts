import { of, Subject, throwError } from 'rxjs';
import { ThLeaveComponent } from './th-leave.component';
import { ThLeaveReconciliation, ThLeaveInbox, ThLeaveInboxRequest, ThLeaveHistory } from 'src/app/servicios/rrhh/th-leave.service';

describe('ThLeaveComponent', () => {
  let component: ThLeaveComponent;
  let service: any;

  beforeEach(() => {
    service = jasmine.createSpyObj('ThLeaveService', [
      'getPermissions', 'getBalancesByPersonal', 'getRequestsByPersonal',
      'ajustarSaldo', 'abrirLibro', 'createBalance', 'createRequest', 'aprobar', 'rechazar', 'cancelar', 'revertir', 'getMovementsByPersonal',
      'verificarConciliacion', 'exportarConciliacion', 'getBandeja', 'getHistorial', 'cambiarEstadoSaldo', 'historialEstadoSaldo', 'exportarBandeja', 'getCalendario', 'exportarLibro'
    ]);
    service.getBalancesByPersonal.and.returnValue(of([]));
    service.getRequestsByPersonal.and.returnValue(of([]));
    service.getMovementsByPersonal.and.returnValue(of([]));
    service.getBandeja.and.returnValue(of({ contenido: [], pagina: 0, tamano: 20, total_elementos: 0, total_paginas: 0 }));
    component = new ThLeaveComponent(service, {} as any, {} as any, {} as any);
    component.idpersonal = 7;
    component.permissionsReady = true;
    component.canWrite = true;
    component.requestModel.fechainicio = '2026-10-10';
    component.requestModel.fechafin = '2026-10-12';
  });

  const report: ThLeaveReconciliation = { idpersonal: 7, generado_en: '2026-10-06T10:00:00', ejercicios: [] };

  it('exports the selected annual book with read access and releases the URL', () => {
    component.canWrite = false; component.movementYear = 2026;
    const response = new Subject<Blob>(); service.exportarLibro.and.returnValue(response);
    spyOn(URL, 'createObjectURL').and.returnValue('blob:book'); spyOn(URL, 'revokeObjectURL');
    spyOn(HTMLAnchorElement.prototype, 'click');
    component.exportarLibro(); component.exportarLibro();
    expect(service.exportarLibro).toHaveBeenCalledOnceWith(7, 2026);
    response.next(new Blob(['csv'])); response.complete();
    expect(HTMLAnchorElement.prototype.click).toHaveBeenCalledTimes(1);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:book'); expect(component.movementExporting).toBeFalse();
  });

  it('requires a selected year and discards book downloads when data is refreshed', () => {
    component.exportarLibro(); expect(service.exportarLibro).not.toHaveBeenCalled();
    component.movementYear = 2026;
    const response = new Subject<Blob>(); service.exportarLibro.and.returnValue(response);
    spyOn(URL, 'createObjectURL'); component.exportarLibro(); component.cargar();
    response.next(new Blob(['csv'])); response.complete();
    expect(URL.createObjectURL).not.toHaveBeenCalled(); expect(component.movementExporting).toBeFalse();
  });

  it('shows book blob errors and discards responses after changing the year', async () => {
    component.movementYear = 2026;
    service.exportarLibro.and.returnValue(throwError(() => ({ status: 400,
      error: new Blob([JSON.stringify({ message: 'Año inválido' })]) })));
    component.exportarLibro(); await new Promise(resolve => setTimeout(resolve, 20));
    expect(component.error).toBe('Año inválido'); expect(component.movementExporting).toBeFalse();
    const response = new Subject<Blob>(); service.exportarLibro.and.returnValue(response);
    spyOn(URL, 'createObjectURL'); component.exportarLibro(); component.movementYear = 2027; component.cambiarFiltroMovimientos();
    response.next(new Blob(['csv'])); response.complete(); expect(URL.createObjectURL).not.toHaveBeenCalled();
  });

  it('loads a leap month with read access and intersects requests with each day inclusively', () => {
    component.canWrite = false; component.calendarDate = '2028-02-15'; component.calendarPersonal = 7;
    const row = { ...inboxRow(), estado: 'APROBADA', fechainicio: '2028-01-31', fechafin: '2028-02-02' };
    service.getCalendario.and.returnValue(of({ contenido: [row], pagina: 0, tamano: 100, total_elementos: 1, total_paginas: 1 }));
    component.toggleCalendario();
    expect(service.getCalendario).toHaveBeenCalledWith('TODAS', 7, '2028-02-01', '2028-02-29', 0);
    expect(component.calendarDays.length).toBe(29);
    expect(component.calendarDays[0].solicitudes.length).toBe(1);
    expect(component.calendarDays[1].solicitudes.length).toBe(1);
    expect(component.calendarDays[2].solicitudes.length).toBe(0);
  });

  it('uses Monday through Sunday for a week crossing December and January', () => {
    component.calendarDate = '2027-01-01'; component.calendarMode = 'SEMANA'; component.calendarVisible = true;
    service.getCalendario.and.returnValue(of({ contenido: [], pagina: 0, tamano: 100, total_elementos: 0, total_paginas: 0 }));
    component.cargarCalendario();
    expect(service.getCalendario).toHaveBeenCalledWith('TODAS', 0, '2026-12-28', '2027-01-03', 0);
    expect(component.calendarDays.length).toBe(7); expect(component.calendarDays[0].semana).toBe('Lunes');
  });

  it('rejects invalid calendar dates and a week outside supported years', () => {
    component.calendarVisible = true; component.calendarDate = '2026-02-30'; component.cargarCalendario();
    component.calendarDate = ''; component.cargarCalendario();
    component.calendarDate = '9999-12-31'; component.calendarMode = 'SEMANA'; component.cargarCalendario();
    expect(service.getCalendario).not.toHaveBeenCalled(); expect(component.calendarError).toContain('1900');
  });

  it('blocks duplicate calendar queries and discards responses after filter changes or closing', () => {
    component.calendarVisible = true;
    const response = new Subject<ThLeaveInbox>(); service.getCalendario.and.returnValue(response);
    component.cargarCalendario(); component.cargarCalendario(); expect(service.getCalendario).toHaveBeenCalledTimes(1);
    component.invalidarCalendario(); response.next({ contenido: [inboxRow()], pagina: 0, tamano: 100, total_elementos: 1, total_paginas: 1 });
    response.complete(); expect(component.calendar).toBeNull(); expect(component.calendarLoading).toBeFalse();
    service.getCalendario.and.returnValue(of({ contenido: [], pagina: 0, tamano: 100, total_elementos: 0, total_paginas: 0 }));
    component.cargarCalendario(); component.toggleCalendario(); expect(component.calendar).toBeNull();
  });

  it('keeps calendar pagination explicit and allows retry after an error', () => {
    component.calendarVisible = true; component.calendarDate = '2026-10-06'; component.calendarType = 'PERMISO';
    service.getCalendario.and.returnValue(throwError(() => ({ status: 403 })));
    component.cargarCalendario(); expect(component.calendarError).toContain('permiso'); expect(component.calendarLoading).toBeFalse();
    service.getCalendario.and.returnValue(of({ contenido: [inboxRow()], pagina: 1, tamano: 100, total_elementos: 101, total_paginas: 2 }));
    component.cargarCalendario(1);
    expect(service.getCalendario).toHaveBeenCalledWith('PERMISO', 0, '2026-10-01', '2026-10-31', 1);
    expect(component.calendar?.total_elementos).toBe(101); expect(component.calendarError).toBe('');
  });

  it('invalidates calendar data after a successful mutation', () => {
    component.calendarVisible = true;
    component.calendar = { contenido: [inboxRow()], pagina: 0, tamano: 100, total_elementos: 1, total_paginas: 1 };
    spyOn(window, 'confirm').and.returnValue(true); spyOn(window, 'prompt').and.returnValue('Motivo');
    service.cambiarEstadoSaldo.and.returnValue(of({}));
    component.cambiarEstadoSaldo({ idbalance: 3, anio: 2026, estado: true, version: 0 });
    expect(component.calendar).toBeNull(); expect(component.calendarDays).toEqual([]);
  });

  it('exports the filtered page with read access, blocks duplicates and releases the download URL', () => {
    component.canWrite = false; component.inboxVisible = true;
    component.inbox = { contenido: [inboxRow()], pagina: 2, tamano: 10, total_elementos: 23, total_paginas: 3 };
    const response = new Subject<Blob>(); service.exportarBandeja.and.returnValue(response);
    spyOn(URL, 'createObjectURL').and.returnValue('blob:test'); spyOn(URL, 'revokeObjectURL');
    spyOn(HTMLAnchorElement.prototype, 'click');
    component.exportarBandeja(); component.exportarBandeja();
    expect(service.exportarBandeja).toHaveBeenCalledOnceWith(component.inboxFilter, 2, 10);
    response.next(new Blob(['csv'])); response.complete();
    expect(HTMLAnchorElement.prototype.click).toHaveBeenCalledTimes(1);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:test'); expect(component.inboxExporting).toBeFalse();
  });

  it('discards a CSV response after filters change and prevents export without loaded results', () => {
    component.exportarBandeja(); expect(service.exportarBandeja).not.toHaveBeenCalled();
    component.inboxVisible = true;
    component.inbox = { contenido: [inboxRow()], pagina: 0, tamano: 20, total_elementos: 1, total_paginas: 1 };
    const response = new Subject<Blob>(); service.exportarBandeja.and.returnValue(response);
    spyOn(URL, 'createObjectURL'); component.exportarBandeja(); component.invalidarBandeja();
    response.next(new Blob(['csv'])); response.complete();
    expect(URL.createObjectURL).not.toHaveBeenCalled(); expect(component.inboxExporting).toBeFalse();
  });

  it('shows JSON error details returned as a blob without downloading', async () => {
    component.inboxVisible = true;
    component.inbox = { contenido: [inboxRow()], pagina: 0, tamano: 20, total_elementos: 1, total_paginas: 1 };
    service.exportarBandeja.and.returnValue(throwError(() => ({ status: 400,
      error: new Blob([JSON.stringify({ message: 'Rango inválido' })], { type: 'application/json' }) })));
    component.exportarBandeja(); await new Promise(resolve => setTimeout(resolve, 20));
    expect(component.error).toBe('Rango inválido'); expect(component.inboxExporting).toBeFalse();
  });

  it('changes balance state with the consulted version and required reason without a client actor', () => {
    spyOn(window, 'confirm').and.returnValue(true); spyOn(window, 'prompt').and.returnValue(' Revisar ');
    const response = new Subject<any>(); service.cambiarEstadoSaldo.and.returnValue(response);
    const balance = { idbalance: 3, anio: 2026, estado: true, version: 4 };
    component.cambiarEstadoSaldo(balance); component.cambiarEstadoSaldo(balance);
    expect(service.cambiarEstadoSaldo).toHaveBeenCalledTimes(1);
    expect(service.cambiarEstadoSaldo).toHaveBeenCalledWith(3, { activo: false, version: 4, motivo: 'Revisar' });
    response.next({}); response.complete(); expect(service.getBalancesByPersonal).toHaveBeenCalledWith(7);
  });

  it('rejects changes with read access, missing version or empty reason', () => {
    const balance = { idbalance: 3, anio: 2026, estado: false, version: 0 };
    component.canWrite = false; component.cambiarEstadoSaldo(balance);
    component.canWrite = true; component.cambiarEstadoSaldo({ ...balance, version: undefined });
    spyOn(window, 'confirm').and.returnValue(true); spyOn(window, 'prompt').and.returnValue(' ');
    component.cambiarEstadoSaldo(balance); expect(service.cambiarEstadoSaldo).not.toHaveBeenCalled();
  });

  it('refreshes balances after a stale-version conflict without discarding its explanation', () => {
    spyOn(window, 'confirm').and.returnValue(true); spyOn(window, 'prompt').and.returnValue('Revisar');
    service.cambiarEstadoSaldo.and.returnValue(throwError(() => ({ status: 409, error: { message: 'El saldo cambió' } })));
    component.cambiarEstadoSaldo({ idbalance: 3, anio: 2026, estado: true, version: 0 });
    expect(component.error).toBe('El saldo cambió'); expect(service.getBalancesByPersonal).toHaveBeenCalledWith(7);
  });

  it('allows read-only state history, blocks duplicate queries and discards late responses on refresh', () => {
    component.canWrite = false;
    const response = new Subject<any>(); service.historialEstadoSaldo.and.returnValue(response);
    component.verHistorialEstadoSaldo({ idbalance: 3 }); component.verHistorialEstadoSaldo({ idbalance: 3 });
    expect(service.historialEstadoSaldo).toHaveBeenCalledTimes(1);
    component.cargar(); response.next({ idbalance: 3, estado: false, eventos: [] }); response.complete();
    expect(component.balanceStateHistory).toBeNull(); expect(component.balanceStateLoading).toBeFalse();
    service.historialEstadoSaldo.and.returnValue(of({ idbalance: 3, estado: false, eventos: [] }));
    component.verHistorialEstadoSaldo({ idbalance: 3 }); expect(component.balanceStateHistory?.estado).toBeFalse();
  });

  function inboxRow(): ThLeaveInboxRequest {
    return { idrequest: 99, idpersonal: 8, nombres: 'Ana', apellidos: 'Prueba', estado: 'SOLICITADA', tipolicencia: 'PERMISO',
      fechainicio: '2026-10-10', fechafin: '2026-10-11', dias_solicitados: 2, motivo: 'Personal', feccrea: '2026-10-06',
      aprobador_id: null, fecha_aprobacion: null, observacion_aprobacion: null, resuelto_por: null,
      fecha_resolucion: null, motivo_resolucion: null };
  }

  function inboxPage(row = inboxRow()): ThLeaveInbox {
    return { contenido: [row], pagina: 0, tamano: 20, total_elementos: 1, total_paginas: 1 };
  }

  function history(idrequest = 99): ThLeaveHistory {
    return { solicitud: { ...inboxRow(), idrequest }, consultado_en: '2026-10-06T10:00:00',
      eventos: [], movimientos: [], advertencias: ['Sin evento de creación'] };
  }

  it('loads history for read-only users and uses the current server request state', () => {
    component.canWrite = false;
    const result = history(); result.solicitud.estado = 'APROBADA';
    service.getHistorial.and.returnValue(of(result));
    component.verDetalle(inboxRow());
    expect(service.getHistorial).toHaveBeenCalledWith(99); expect(component.history).toBe(result);
    expect(component.selectedRequest.estado).toBe('APROBADA'); expect(component.historyLoading).toBeFalse();
    expect(component.history!.advertencias).toEqual(['Sin evento de creación']);
    expect(component.history!.eventos).toEqual([]);
  });

  it('ignores a late history response after selecting another request', () => {
    const old = new Subject<ThLeaveHistory>(); service.getHistorial.and.returnValue(old);
    component.verDetalle(inboxRow());
    const next = history(100); service.getHistorial.and.returnValue(of(next));
    component.verDetalle({ ...inboxRow(), idrequest: 100 });
    old.next(history()); old.complete();
    expect(component.history).toBe(next); expect(component.selectedRequest.idrequest).toBe(100);
    expect(component.historyLoading).toBeFalse();
  });

  it('invalidates history when refreshing personnel data', () => {
    const response = new Subject<ThLeaveHistory>(); service.getHistorial.and.returnValue(response);
    component.verDetalle(inboxRow()); component.idpersonal = 8; component.cargar();
    response.next(history()); response.complete();
    expect(component.history).toBeNull(); expect(component.selectedRequest).toBeNull(); expect(component.historyLoading).toBeFalse();
  });

  it('keeps detail and allows retry after a failed history query without erasing other errors', () => {
    component.error = 'Otro mensaje';
    service.getHistorial.and.returnValue(throwError(() => ({ status: 404, error: { message: 'Solicitud no encontrada' } })));
    component.verDetalle(inboxRow());
    expect(component.historyError).toBe('Solicitud no encontrada'); expect(component.error).toBe('Otro mensaje');
    expect(component.history).toBeNull(); expect(component.selectedRequest.idrequest).toBe(99);
    service.getHistorial.and.returnValue(of(history())); component.cargarHistorial();
    expect(component.historyError).toBe(''); expect(component.history).not.toBeNull();
  });

  it('closing inbox detail discards its pending history request', () => {
    component.inboxVisible = true;
    const response = new Subject<ThLeaveHistory>(); service.getHistorial.and.returnValue(response);
    component.verDetalle(inboxRow()); component.toggleBandeja();
    response.next(history()); response.complete();
    expect(component.selectedRequest).toBeNull(); expect(component.history).toBeNull(); expect(component.historyLoading).toBeFalse();
  });

  it('blocks duplicate detail requests while loading and direct queries without access', () => {
    const response = new Subject<ThLeaveHistory>(); service.getHistorial.and.returnValue(response);
    component.verDetalle(inboxRow()); component.verDetalle(inboxRow()); component.cargarHistorial();
    expect(service.getHistorial).toHaveBeenCalledTimes(1);
    component.limpiarDetalle(); component.permissionsReady = false; component.verDetalle(inboxRow()); component.cargarHistorial();
    expect(service.getHistorial).toHaveBeenCalledTimes(1);
  });

  it('labels known history events and keeps unrecognized actions visible', () => {
    expect(component.historyAction('CREATE')).toBe('Creación');
    expect(component.historyAction('REVERSE')).toBe('Reversión');
    expect(component.historyAction('REVIEW')).toBe('REVIEW');
    expect(component.historyAction(null)).toBe('Acción sin identificar');
  });

  it('opens a read-only inbox with pending filters and prevents duplicate queries', () => {
    component.canWrite = false;
    const response = new Subject<ThLeaveInbox>(); service.getBandeja.and.returnValue(response);
    component.toggleBandeja(); component.cargarBandeja();
    expect(service.getBandeja).toHaveBeenCalledTimes(1);
    expect(service.getBandeja.calls.mostRecent().args).toEqual([
      { estado: 'SOLICITADA', tipo: 'TODAS', idpersonal: 0, desde: '', hasta: '' }, 0, 20]);
    response.next(inboxPage()); response.complete();
    expect(component.inbox?.contenido[0].idpersonal).toBe(8);
    component.resolverBandeja(component.inbox!.contenido[0], true);
    expect(service.aprobar).not.toHaveBeenCalled();
  });

  it('invalidates old inbox responses when filters change', () => {
    component.inboxVisible = true;
    const oldResponse = new Subject<ThLeaveInbox>(); service.getBandeja.and.returnValue(oldResponse);
    component.cargarBandeja(); component.inboxFilter.estado = 'APROBADA'; component.invalidarBandeja();
    service.getBandeja.and.returnValue(of({ ...inboxPage(), contenido: [] })); component.cargarBandeja();
    oldResponse.next(inboxPage()); oldResponse.complete();
    expect(component.inbox?.contenido).toEqual([]); expect(component.inboxLoading).toBeFalse();
  });

  it('resolves an inbox item from another employee and refreshes both views', () => {
    const row = inboxRow(); component.inboxVisible = true; component.inbox = inboxPage(row);
    spyOn(window, 'confirm').and.returnValue(true); spyOn(window, 'prompt').and.returnValue('Revisado');
    const response = new Subject<any>(); service.aprobar.and.returnValue(response);
    component.resolverBandeja(row, true); component.resolverBandeja(row, true);
    expect(service.aprobar).toHaveBeenCalledTimes(1); expect(service.aprobar).toHaveBeenCalledWith(99, { observacion: 'Revisado' });
    expect(window.confirm).toHaveBeenCalledWith('¿Confirma aprobar la solicitud #99 de Prueba Ana?');
    response.next({}); response.complete();
    expect(service.getBandeja).toHaveBeenCalled(); expect(service.getBalancesByPersonal).toHaveBeenCalledWith(7);
  });

  it('refreshes stale inbox decisions after a conflict and preserves its message', () => {
    const row = inboxRow(); component.inboxVisible = true; component.inbox = inboxPage(row);
    spyOn(window, 'confirm').and.returnValue(true); spyOn(window, 'prompt').and.returnValue('Revisado');
    service.aprobar.and.returnValue(throwError(() => ({ status: 409, error: { message: 'Ya resuelta' } })));
    component.resolverBandeja(row, true);
    expect(component.error).toBe('Ya resuelta'); expect(service.getBandeja).toHaveBeenCalled();
  });

  it('returns to the last available page when resolving removes its final item', () => {
    component.inboxVisible = true;
    service.getBandeja.and.returnValues(of({ contenido: [], pagina: 1, tamano: 20, total_elementos: 20, total_paginas: 1 }), of(inboxPage()));
    component.cargarBandeja(1);
    expect(service.getBandeja.calls.allArgs().map((args: any[]) => args[1])).toEqual([1, 0]);
    expect(component.inboxPage).toBe(0); expect(component.inboxLoading).toBeFalse();
  });

  it('rejects reversed date filters and blocks decisions after closing the inbox', () => {
    component.inboxVisible = true; component.inboxFilter.desde = '2026-10-12'; component.inboxFilter.hasta = '2026-10-10';
    component.cargarBandeja(); expect(service.getBandeja).not.toHaveBeenCalled();
    expect(component.error).toContain('no puede ser posterior');
    component.inbox = inboxPage(); component.toggleBandeja();
    component.resolverBandeja(inboxRow(), true); expect(service.aprobar).not.toHaveBeenCalled();
  });

  it('opens the inbox employee without changing inbox filters', () => {
    component.verEmpleadoBandeja(inboxRow());
    expect(component.idpersonal).toBe(8); expect(service.getBalancesByPersonal).toHaveBeenCalledWith(8);
    expect(component.inboxFilter.idpersonal).toBe(0);
  });

  it('allows read-only verification and passes the selected year', () => {
    component.canWrite = false; component.conciliacionYear = 2026;
    service.verificarConciliacion.and.returnValue(of(report));
    component.verificarConciliacion();
    expect(service.verificarConciliacion).toHaveBeenCalledWith(7, 2026);
    expect(component.conciliacion).toBe(report); expect(component.checking).toBeFalse();
  });

  it('ignores a report arriving after a personnel refresh', () => {
    const response = new Subject<ThLeaveReconciliation>();
    service.verificarConciliacion.and.returnValue(response);
    component.verificarConciliacion(); component.verificarConciliacion();
    expect(service.verificarConciliacion).toHaveBeenCalledTimes(1);
    component.idpersonal = 8; component.cargar();
    response.next(report); response.complete();
    expect(component.conciliacion).toBeNull(); expect(component.checking).toBeFalse();
  });

  it('invalidates a previous report when the exercise filter changes', () => {
    component.conciliacion = report; component.conciliacionYear = 2025;
    component.cambiarEjercicioConciliacion(); component.exportarConciliacion();
    expect(component.conciliacion).toBeNull(); expect(service.exportarConciliacion).not.toHaveBeenCalled();
  });

  it('exports a read-only report as a blob and releases the download URL', () => {
    component.canWrite = false; component.conciliacion = report;
    const blob = new Blob(['Personal;Saldo'], { type: 'text/csv' });
    service.exportarConciliacion.and.returnValue(of(blob));
    spyOn(URL, 'createObjectURL').and.returnValue('blob:rrhh');
    spyOn(URL, 'revokeObjectURL');
    const link = document.createElement('a'); spyOn(link, 'click');
    spyOn(document, 'createElement').and.returnValue(link);
    component.exportarConciliacion();
    expect(service.exportarConciliacion).toHaveBeenCalledWith(7, undefined);
    expect(URL.createObjectURL).toHaveBeenCalledWith(blob);
    expect(link.download).toBe('conciliacion-rrhh-7.csv'); expect(link.click).toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:rrhh'); expect(component.exporting).toBeFalse();
  });

  it('does not download an export arriving after the report is invalidated', () => {
    component.conciliacion = report;
    const response = new Subject<Blob>(); service.exportarConciliacion.and.returnValue(response);
    spyOn(URL, 'createObjectURL');
    component.exportarConciliacion(); component.cambiarEjercicioConciliacion();
    response.next(new Blob(['CSV'])); response.complete();
    expect(URL.createObjectURL).not.toHaveBeenCalled(); expect(component.exporting).toBeFalse();
  });

  it('reads JSON error messages returned as blobs for a failed export', async () => {
    component.conciliacion = report;
    service.exportarConciliacion.and.returnValue(throwError(() => ({ status: 400,
      error: new Blob([JSON.stringify({ message: 'Ejercicio inválido' })], { type: 'application/json' }) })));
    component.exportarConciliacion();
    await new Promise(resolve => setTimeout(resolve, 20));
    expect(component.error).toBe('Ejercicio inválido'); expect(component.exporting).toBeFalse();
  });

  it('clears failed verification and skips queries before access is available', () => {
    component.permissionsReady = false; component.verificarConciliacion();
    expect(service.verificarConciliacion).not.toHaveBeenCalled();
    component.permissionsReady = true;
    service.verificarConciliacion.and.returnValue(throwError(() => ({ status: 403 })));
    component.verificarConciliacion();
    expect(component.conciliacion).toBeNull(); expect(component.checking).toBeFalse();
    expect(component.error).toContain('No tiene permiso');
  });

  it('retains the adjustment key after an uncertain response and blocks duplicate pending clicks', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    component.balances = [{ idbalance: 3, anio: 2026, dias_disponibles: 5, estado: true }];
    component.ajuste = { idbalance: 3, dias: -1, motivo: ' Corrección ' };
    const response = new Subject<any>(); service.ajustarSaldo.and.returnValue(response);
    component.guardarAjuste(); component.guardarAjuste();
    expect(service.ajustarSaldo).toHaveBeenCalledTimes(1);
    const original = service.ajustarSaldo.calls.mostRecent().args[1];
    response.error({ status: 500 });
    service.ajustarSaldo.and.returnValue(throwError(() => ({ status: 500 })));
    component.guardarAjuste();
    expect(service.ajustarSaldo.calls.mostRecent().args[1].clave).toBe(original.clave);
    expect(original.motivo).toBe('Corrección');
    expect(original.usuario).toBeUndefined();
  });

  it('rejects adjustments exceeding available balance, lacking reason or read access', () => {
    component.balances = [{ idbalance: 3, dias_disponibles: 1 }];
    component.ajuste = { idbalance: 3, dias: -2, motivo: 'Corrección' }; component.guardarAjuste();
    component.ajuste.dias = 1; component.ajuste.motivo = ' '; component.guardarAjuste();
    component.canWrite = false; component.ajuste.motivo = 'Corrección'; component.guardarAjuste();
    component.abrirLibro(component.balances[0]);
    expect(service.ajustarSaldo).not.toHaveBeenCalled(); expect(service.abrirLibro).not.toHaveBeenCalled();
  });

  it('creates with business fields only and prevents duplicate clicks while pending', () => {
    const response = new Subject<any>();
    service.createRequest.and.returnValue(response);
    component.requestModel.estado = 'APROBADA';
    component.requestModel.usucrea = 1;
    component.crearRequest();
    component.crearRequest();
    expect(service.createRequest).toHaveBeenCalledTimes(1);
    const payload = service.createRequest.calls.mostRecent().args[0];
    expect(payload.idpersonal_personal.idpersonal).toBe(7);
    expect(payload.estado).toBeUndefined();
    expect(payload.usucrea).toBeUndefined();
    expect(payload.dias_solicitados).toBeUndefined();
    expect(component.saving).toBeTrue();
    response.next({}); response.complete();
    expect(component.saving).toBeFalse();
    expect(component.requestModel.fechainicio).toBe('');
  });

  it('read-only access cannot create or approve even via direct calls', () => {
    component.canWrite = false;
    component.crearRequest(); component.crearBalance(); component.aprobar(9);
    expect(service.createRequest).not.toHaveBeenCalled();
    expect(service.createBalance).not.toHaveBeenCalled();
    expect(service.aprobar).not.toHaveBeenCalled();
  });

  it('rejects reversed dates and cross-year vacations', () => {
    component.requestModel.fechafin = '2026-10-09';
    expect(component.canSubmitRequest).toBeFalse();
    component.crearRequest();
    component.requestModel.fechafin = '2027-01-02';
    expect(component.crossYearVacation).toBeTrue();
    component.crearRequest();
    expect(service.createRequest).not.toHaveBeenCalled();
  });

  it('sends approval without a client supplied actor', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    spyOn(window, 'prompt').and.returnValue('Revisado');
    component.requests = [{ idrequest: 9, estado: 'SOLICITADA' }];
    component.aprobadorId = 99;
    service.aprobar.and.returnValue(of({}));
    component.aprobar(9);
    expect(service.aprobar).toHaveBeenCalledWith(9, { observacion: 'Revisado' });
  });

  it('cancelling observation prompt does not resolve a request', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    spyOn(window, 'prompt').and.returnValue(null);
    component.requests = [{ idrequest: 9, estado: 'SOLICITADA' }];
    component.aprobar(9);
    expect(service.aprobar).not.toHaveBeenCalled();
  });

  it('does not preload stale available days when creating a balance', () => {
    service.createBalance.and.returnValue(of({}));
    component.balanceModel.dias_asignados = 20;
    component.balanceModel.dias_disponibles = 15;
    component.crearBalance();
    expect(service.createBalance.calls.mostRecent().args[0].dias_disponibles).toBeUndefined();
  });

  it('keeps current employee data when an earlier load completes late', () => {
    const oldBalances = new Subject<any>();
    const oldRequests = new Subject<any>();
    service.getBalancesByPersonal.and.returnValue(oldBalances);
    service.getRequestsByPersonal.and.returnValue(oldRequests);
    component.cargar();
    component.idpersonal = 8;
    service.getBalancesByPersonal.and.returnValue(of([{ anio: 2026, dias_disponibles: 20 }]));
    service.getRequestsByPersonal.and.returnValue(of([{ idrequest: 20 }]));
    component.cargar();
    oldBalances.next([{ dias_disponibles: 1 }]); oldBalances.complete();
    oldRequests.next([{ idrequest: 1 }]); oldRequests.complete();
    expect(component.requests[0].idrequest).toBe(20);
    expect(component.balances[0].dias_disponibles).toBe(20);
    expect(component.loading).toBeFalse();
  });

  it('clears data when deselecting an employee', () => {
    component.requests = [{ idrequest: 9 }];
    component.balances = [{}]; component.selectedRequest = {};
    component.idpersonal = 0;
    component.cargar();
    expect(component.requests).toEqual([]);
    expect(component.balances).toEqual([]);
    expect(component.selectedRequest).toBeNull();
  });

  it('surfaces backend validation errors and releases pending state', () => {
    service.createRequest.and.returnValue(throwError(() => ({ status: 400, error: { message: 'Fechas inválidas' } })));
    component.crearRequest();
    expect(component.error).toBe('Fechas inválidas');
    expect(component.saving).toBeFalse();
  });

  it('cancels pending requests with a trimmed reason and no client actor', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    spyOn(window, 'prompt').and.returnValue('  Cambio de fechas  ');
    component.requests = [{ idrequest: 9, estado: 'SOLICITADA' }];
    service.cancelar.and.returnValue(of({}));
    component.cancelar(9);
    expect(service.cancelar).toHaveBeenCalledWith(9, { motivo: 'Cambio de fechas' });
    expect(service.getMovementsByPersonal).toHaveBeenCalledWith(7);
  });

  it('reverses approved requests once while an operation is pending', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    spyOn(window, 'prompt').and.returnValue('Corregir aprobación');
    component.requests = [{ idrequest: 9, estado: 'APROBADA', tipolicencia: 'VACACION' }];
    const pending = new Subject<any>();
    service.revertir.and.returnValue(pending);
    component.revertir(9); component.revertir(9);
    expect(service.revertir).toHaveBeenCalledTimes(1);
    expect(service.revertir).toHaveBeenCalledWith(9, { motivo: 'Corregir aprobación' });
    pending.next({}); pending.complete();
  });

  it('requires a reason before cancelling or reversing', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    spyOn(window, 'prompt').and.returnValue(' ');
    component.requests = [{ idrequest: 9, estado: 'APROBADA' }];
    component.revertir(9);
    expect(service.revertir).not.toHaveBeenCalled();
    expect(component.error).toContain('motivo');
  });

  it('blocks withdrawal actions for read-only users and terminal states', () => {
    component.requests = [{ idrequest: 9, estado: 'APROBADA' }];
    component.canWrite = false;
    component.revertir(9); component.cancelar(9);
    component.canWrite = true;
    component.requests[0].estado = 'REVERTIDA';
    component.revertir(9); component.cancelar(9);
    expect(service.revertir).not.toHaveBeenCalled();
    expect(service.cancelar).not.toHaveBeenCalled();
  });

  it('filters movement history by year and clears it on employee change', () => {
    component.movements = [{ idmovement: 2, anio: 2026 }, { idmovement: 1, anio: 2025 }] as any;
    component.movementYear = 2025;
    expect(component.movementYears).toEqual([2026, 2025]);
    expect(component.filteredMovements[0].idmovement).toBe(1);
    component.idpersonal = 0; component.cargar();
    expect(component.movements).toEqual([]);
    expect(component.movementYear).toBe(0);
  });

  it('keeps an unreversible historical approval visible when backend reports a conflict', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    spyOn(window, 'prompt').and.returnValue('Revisar');
    const approved = { idrequest: 9, estado: 'APROBADA' };
    component.requests = [approved];
    service.getRequestsByPersonal.and.returnValue(of([approved]));
    service.revertir.and.returnValue(throwError(() => ({ status: 409,
      error: { message: 'La aprobación no tiene consumo registrado; requiere conciliación histórica' } })));
    component.revertir(9);
    expect(component.error).toContain('conciliación histórica');
    expect(component.requests[0].estado).toBe('APROBADA');
    expect(component.saving).toBeFalse();
  });
});
