import { FormBuilder } from '@angular/forms';
import { of, Subject } from 'rxjs';
import { ReportesjrComponent } from './reportejr.component';

describe('Reportes JR: detalle y vista previa', () => {
  let component: ReportesjrComponent;
  let service: any;
  const reporte: any = {
    idreporte: 1, nomrep: 'RubrosCobrados', metodo: 1,
    repoxopcion: { codigo: '99001', opcion: 'Reportes JR', nombre: 'Catalogo' },
    parametros: { desde: 'java.sql.Timestamp|6|1', idusuario: 'java.lang.Integer|6|2',
      cursor: 'java.sql.ResultSet|12|3' }
  };

  beforeEach(() => {
    service = { getById: jasmine.createSpy().and.returnValue(of(reporte)),
      ejecutaReporteSQL: jasmine.createSpy().and.returnValue(new Subject<Blob>()) };
    component = new ReportesjrComponent(new FormBuilder(), {} as any, { idusuario: 7 } as any,
      {} as any, {} as any, service, {} as any, { bypassSecurityTrustResourceUrl: (url: string) => url } as any);
  });
  afterEach(() => component.ngOnDestroy());

  it('lee parametros como objeto o JSON y conserva ancho y orden', () => {
    expect(component.parametrosDe(reporte).length).toBe(3);
    const parametros = component.parametrosDe({ ...reporte, parametros: JSON.stringify(reporte.parametros) });
    expect(parametros[0].nombre).toBe('desde');
    expect(parametros[0].ancho).toBe(6);
    expect(parametros[2].editable).toBeFalse();
  });

  it('filtra por el codigo y la opcion anidados y restaura un resultado vacio', () => {
    component.reportesjr = [reporte];
    component.filtrar('99001'); expect(component.repojrFiltrados.length).toBe(1);
    component.filtrar('Reportes JR'); expect(component.repojrFiltrados.length).toBe(1);
    component.filtrar('sin coincidencia'); expect(component.repojrFiltrados.length).toBe(0);
    component.filtrar(''); expect(component.repojrFiltrados.length).toBe(1);
  });

  it('recarga el detalle y genera PDF con fecha SQL sin enviar parametros internos', () => {
    component.visualizar({ idreporte: 1 });
    expect(service.getById).toHaveBeenCalledWith(1);
    expect(component.reporteVisualizado?.repoxopcion?.codigo).toBe('99001');
    component.formVistaPrevia.patchValue({ desde: '2026-11-05T08:30' });
    component.generarVistaPrevia();
    expect(service.ejecutaReporteSQL).toHaveBeenCalledWith({ reportName: 'RubrosCobrados', extension: 'pdf',
      parameters: [ { name: 'desde', type: 'java.sql.Timestamp', value: '2026-11-05 08:30:00' },
        { name: 'idusuario', type: 'java.lang.Integer', value: 7 } ] });
  });

  it('revoca el PDF y cancela la carga al cerrar', () => {
    const respuesta = new Subject<Blob>();
    service.ejecutaReporteSQL.and.returnValue(respuesta);
    spyOn(URL, 'createObjectURL').and.returnValue('blob:reporte-prueba');
    const revocar = spyOn(URL, 'revokeObjectURL');
    component.visualizar(reporte);
    component.generarVistaPrevia();
    respuesta.next(new Blob(['pdf']));
    expect(component.pdfSeguro).toBeTruthy();
    component.cerrarVisualizacion();
    expect(revocar).toHaveBeenCalledWith('blob:reporte-prueba');
    expect(respuesta.observers.length).toBe(0);
    expect(component.pdfSeguro).toBeNull();
  });
});
