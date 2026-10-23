import { of, throwError } from 'rxjs';
﻿import { FormBuilder } from '@angular/forms';
import { AnularConvenioComponent } from './anular-convenio.component';

describe('AnularConvenioComponent: importe de nota de crédito', () => {
  let component: AnularConvenioComponent;

  beforeEach(() => {
    component = new AnularConvenioComponent(
      {} as any, {} as any, {} as any, {} as any, {} as any,
      {} as any, {} as any, {} as any, new FormBuilder(), {} as any
    );
    component._convenio = { idconvenio: 2547 };
    component.notaCreditoForm = new FormBuilder().group({
      iddocumento_documentos: [null], refdocumento: [''], observacion: [''],
    });
    component.facNuevas = [
      { idfactura: 1, pagado: 1, selected: true, totaltarifa: '125.50' },
      { idfactura: 2, pagado: 1, selected: false, totaltarifa: 20 },
      { idfactura: 3, pagado: 0, selected: true, totaltarifa: 30 },
    ];
  });

  it('calcula antes de abrir el modal y responde a cambios de selección', () => {
    expect(component.facturasPagadas).toEqual([]);
    expect(component.totalNotaCreditoSeleccionada).toBe(125.5);
    component.facNuevas[1].selected = true;
    expect(component.totalNotaCreditoSeleccionada).toBe(145.5);
    component.facNuevas[0].selected = false;
    expect(component.totalNotaCreditoSeleccionada).toBe(20);
  });

  it('lleva el importe seleccionado al modal', () => {
    component.anularConvenio();
    expect(component.modalVisible).toBeTrue();
    expect(component.facturasPagadas.length).toBe(1);
    expect(component.facturasPagadas[0].valorNc).toBe(125.5);
    expect(component.totalValorNotaCredito).toBe(125.5);
    component.facturasPagadas[0].selected = false;
    expect(component.totalValorNotaCredito).toBe(0);
  });

  it('rechaza importes cero o inválidos antes de crear la nota', () => {
    for (const valorNc of [0, -1, NaN, Infinity]) {
      expect(() => (component as any).crearNtacreditoDesdeFactura(
        { idfactura: 1, totaltarifa: 125.5, valorNc }, null, '', ''
      )).toThrowError(/valor/);
    }
  });
  it('consulta las facturas completas antes de clasificar el pago de las cuotas', () => {
    const getById = jasmine.createSpy('getById').and.callFake((id: number) => of({
      idfactura: id, nrofactura: `FAC-${id}`, pagado: id === 1 ? 1 : 0,
      totaltarifa: id === 1 ? 125.5 : 30,
    }));
    (component as any).s_convenio = { getById: () => of({ idconvenio: 2547 }) };
    (component as any).s_cuota = { getByIdconvenio: () => of([
      { idfactura: 1 }, { idfactura: { idfactura: '2', pagado: null } },
      { idfactura: { idfactura: 1 } },
    ]) };
    (component as any).s_facxconvenios = { getFacByConvenio: () => of([]) };
    (component as any).facturaService = { getById };

    component.getDatosConvenio(2547);

    expect(getById.calls.count()).toBe(2);
    expect(component.loading).toBeFalse();
    expect(component.facNuevas.length).toBe(2);
    expect(component.esPagadaNueva(component.facNuevas[0])).toBeTrue();
    expect(component.facNuevas[0].selected).toBeTrue();
    expect(component.facNuevas[0].nrofactura).toBe('FAC-1');
    expect(component.esPagadaNueva(component.facNuevas[1])).toBeFalse();
    expect(component.facNuevas[1].selected).toBeFalse();
    expect(component.totalNotaCreditoSeleccionada).toBe(125.5);
  });

  it('muestra un error si no puede consultar el estado real de las facturas', () => {
    (component as any).s_convenio = { getById: () => of({ idconvenio: 2547 }) };
    (component as any).s_cuota = { getByIdconvenio: () => of([{ idfactura: 1 }]) };
    (component as any).s_facxconvenios = { getFacByConvenio: () => of([]) };
    (component as any).facturaService = { getById: () => throwError(() => new Error('Sin conexion')) };
    spyOn(console, 'error');
    component.getDatosConvenio(2547);
    expect(component.error).toBeTruthy();
    expect(component.loading).toBeFalse();
  });

  it('guarda el estado anulado (2) despues de generar las notas de credito', async () => {
    const updateEstado = jasmine.createSpy('updateEstado').and.returnValue(of({}));
    (component as any).s_convenio = { updateEstado };
    (component as any).s_ntacredito = { saveNtacredito: () => of({}) };
    (component as any).router = { navigate: jasmine.createSpy('navigate') };
    spyOn<any>(component, 'actualizarFacturasConvenio').and.resolveTo();
    component.notaCreditoForm.patchValue({
      iddocumento_documentos: { iddocumento: 1 },
      refdocumento: 'DOC-1', observacion: 'Anulacion de convenio',
    });
    component.facturasPagadas = [{
      idfactura: 1, selected: true, valorNc: 125.5,
      idcliente: { idcliente: 1 }, idabonado: 1,
    }];

    await component.generarNotasCredito();

    expect(updateEstado).toHaveBeenCalledWith(
      2547, 2, 0, jasmine.any(String), 'ANULACION_CONVENIO'
    );
    expect(component.modalError).toBeNull();
  });

});
