import { FormBuilder } from '@angular/forms';
import Swal from 'sweetalert2';
import { ImpEmisionesComponent } from './imp-emisiones.component';
describe('ImpEmisiones report access', () => {
  let component: ImpEmisionesComponent;
  let loading: any;
  let jasper: any;
  beforeEach(() => {
    loading = { showLoading: jasmine.createSpy(), hideLoading: jasmine.createSpy() };
    jasper = { getReporte: jasmine.createSpy().and.callFake(() => Promise.reject({ status: 403 })) };
    component = new ImpEmisionesComponent(new FormBuilder(), {} as any, {} as any, {} as any,
      {} as any, {} as any, loading, {} as any, jasper, { idusuario: 11 } as any);
    component.formImprimir = new FormBuilder().group({ reporte: 12, emision: 3, d_emi: '2026-10-01', h_emi: '2026-10-31' });
    spyOn(Swal, 'fire').and.returnValue(Promise.resolve({} as any));
  });
  it('uses the current reader and shows access errors', async () => {
    await component.imprimir();
    expect(jasper.getReporte.calls.mostRecent().args[0].parameters.idusuario).toBe(11);
    expect(loading.hideLoading).toHaveBeenCalled();
    expect(Swal.fire).toHaveBeenCalledWith(jasmine.objectContaining({ text: 'No tiene permiso para consultar este reporte de emisiones.' }));
  });
  it('dispatches the initial numeric selection', async () => {
    component.formImprimir.patchValue({ reporte: 0 }); spyOn(component, 'buscarEmisiones');
    await component.imprimir(); expect(component.buscarEmisiones).toHaveBeenCalled();
  });
  it('shows failed data queries instead of leaving a silent blank PDF', async () => {
    component.formImprimir.patchValue({ reporte: '5' });
    spyOn(component, 'impValoresEmisiones').and.returnValue(Promise.reject({ status: 500, error: { message: 'Consulta fallida' } }));
    await component.imprimir();
    expect(Swal.fire).toHaveBeenCalledWith(jasmine.objectContaining({ text: 'Consulta fallida' }));
  });
  const methods: [number, string][] = [
    [0, 'buscarEmisiones'], [1, 'getByIdEmisiones'], [2, 'getEmisionIndividualByIdEmision'],
    [3, 'impEmisionInicial'], [4, 'impEmisionFinal'], [5, 'impValoresEmisiones'],
    [6, 'impConsumoXCategoria'], [7, 'impRefacturacionxEmision'], [8, 'impRefacturacionxFecha'],
    [9, 'impRefEmisionRubros'], [10, 'impRefFechaRubros'], [11, 'getReporte'], [14, 'generarPreemision']
  ];
  methods.forEach(([report, method]) => it(`dispatches report ${report} for user 11 without an administrator check`, async () => {
    component.formImprimir.patchValue({ reporte: String(report) });
    const handler = spyOn(component as any, method).and.returnValue(Promise.resolve());
    await component.imprimir(); expect(handler).toHaveBeenCalledTimes(1);
  }));
  [12, 13].forEach(report => it(`submits Jasper report ${report} with user 11`, async () => {
    component.formImprimir.patchValue({ reporte: String(report) });
    await component.imprimir();
    const payload = jasper.getReporte.calls.mostRecent().args[0];
    expect(payload.parameters.idusuario).toBe(11);
    expect(payload.reportName).toBe(report === 12 ? 'Refacturaciones' : 'RefacturacionesRubros');
  }));

});
