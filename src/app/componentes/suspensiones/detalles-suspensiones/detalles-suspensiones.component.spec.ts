import { of } from 'rxjs';
import { DetallesSuspensionesComponent } from './detalles-suspensiones.component';

describe('Detalles de suspensiones y habilitaciones', () => {
  let component: DetallesSuspensionesComponent;
  let relaciones: any, registros: any, abonados: any, router: any;
  let anteriorId: string | null, anteriorCuenta: string | null;
  beforeEach(() => {
    anteriorId = sessionStorage.getItem('idsuspensionToInfo');
    anteriorCuenta = sessionStorage.getItem('idabonadoToFactura');
    sessionStorage.setItem('idsuspensionToInfo', '10');
    relaciones = { getByIdsuspension: jasmine.createSpy().and.returnValue(of([])) };
    registros = { retirarMedidores: jasmine.createSpy().and.returnValue(of({numero: 6})), getById: jasmine.createSpy().and.returnValue(of({ idsuspension: 10, numero: 5, tipo: 2 })) };
    abonados = { getById: jasmine.createSpy(), updateAbonadoAuditoria: jasmine.createSpy().and.returnValue(of({})) };
    router = { navigate: jasmine.createSpy() };
    component = new DetallesSuspensionesComponent(relaciones, router, abonados, { idusuario: 7 } as any, registros);
  });
  afterEach(() => {
    component.ngOnDestroy();
    if (anteriorId === null) sessionStorage.removeItem('idsuspensionToInfo'); else sessionStorage.setItem('idsuspensionToInfo', anteriorId);
    if (anteriorCuenta === null) sessionStorage.removeItem('idabonadoToFactura'); else sessionStorage.setItem('idabonadoToFactura', anteriorCuenta);
  });

  it('muestra todas las cuentas vinculadas aunque ahora esten habilitadas y no consulta una por una', () => {
    relaciones.getByIdsuspension.and.returnValue(of([
      { idabonado_abonados: { idabonado: 1, estado: 1 } },
      { idabonado_abonados: { idabonado: 2, estado: 2 } },
      { idabonado_abonados: { idabonado: 3, estado: 3 } }
    ]));
    component.listarAboxSusp();
    expect(component.totalCuentas).toBe(3);
    expect(component.cuentasFiltradas.length).toBe(3);
    expect(abonados.getById).not.toHaveBeenCalled();
    component.filtroEstado = '1';
    expect(component.cuentasFiltradas[0].idabonado_abonados.idabonado).toBe(1);
  });

  it('conserva la cabecera de registros sin cuentas y vuelve al listado de habilitaciones', () => {
    registros.getById.and.returnValue(of({ idsuspension: 10, numero: 5, tipo: 1 }));
    component.listarAboxSusp();
    expect(component.detalleSuspension.numero).toBe(5);
    expect(component.totalCuentas).toBe(0);
    expect(component.esHabilitacion).toBeTrue();
    component.regresar();
    expect(router.navigate).toHaveBeenCalledWith(['habilitaciones']);
  });

  it('abre el detalle de la cuenta seleccionada', () => {
    component.abrirCuenta(123);
    expect(sessionStorage.getItem('idabonadoToFactura')).toBe('123');
    expect(router.navigate).toHaveBeenCalledWith(['detalles-abonado']);
  });

  it('el retiro solo afecta cuentas suspendidas seleccionadas y no muta otras filas', () => {
    relaciones.getByIdsuspension.and.returnValue(of([
      { idabonado_abonados: { idabonado: 1, estado: 1 } },
      { idabonado_abonados: { idabonado: 2, estado: 2 } },
      { idabonado_abonados: { idabonado: 3, estado: 3 } }
    ]));
    component.listarAboxSusp();
    component.seleccionar(1, true); component.seleccionar(2, true); component.seleccionar(3, true);
    component.retirarMedidor();
    expect(registros.retirarMedidores).toHaveBeenCalledWith(10, [2], 7);
    expect(component.ultimoRetiro.numero).toBe(6);
    expect(abonados.updateAbonadoAuditoria).not.toHaveBeenCalled();
    expect(component.cuentas[1].idabonado_abonados.estado).toBe(2);
  });
});
