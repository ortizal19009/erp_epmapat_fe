import { of, throwError } from 'rxjs';
import { ImpClienteComponent } from './imp-cliente.component';
import { ClientesReporteService } from 'src/app/servicios/clientes-reporte.service';
describe('Reportes de clientes', () => {
  let componente: ImpClienteComponent, api: any, reportes: any;
  beforeEach(() => {
    api = {getReporte: jasmine.createSpy()};
    reportes = new ClientesReporteService(); spyOn(reportes,'descargar').and.returnValue(Promise.resolve());
    componente=new ImpClienteComponent(api,reportes,null!,null!,null!,null!);
  });
  it('lista todos los clientes sin limitar por rango de IDs', async () => {
    api.getReporte.and.returnValue(of([{idcliente: 50000,nombre:'Cliente'}]));
    await componente.generar();
    expect(api.getReporte).toHaveBeenCalledWith('listado');
    expect(reportes.descargar.calls.mostRecent().args[1][0].idcliente).toBe(50000);
    expect(componente.generando).toBeFalse();
  });
  it('filtra por nombre sin acentos y solo pendientes antes de exportar', async () => {
    api.getReporte.and.returnValue(of([{nombre:'Jos\u00e9',capital:20},{nombre:'Jose',capital:0},{nombre:'Maria',capital:40}]));
    componente.tipo='pendientes';componente.formato='xlsx';componente.busqueda='JOSE';componente.soloPendientes=true;
    await componente.generar();
    expect(reportes.descargar.calls.mostRecent().args.slice(0,3)).toEqual(['pendientes',[{nombre:'Jos\u00e9',capital:20}],'xlsx']);
  });
  it('no descarga un archivo vacio y permite reintentar ante errores', async () => {
    api.getReporte.and.returnValue(throwError(()=>new Error('Error')));
    await componente.generar(); expect(componente.generando).toBeFalse();expect(componente.error).toBeTruthy();
    api.getReporte.and.returnValue(of([]));await componente.generar();expect(reportes.descargar).not.toHaveBeenCalled();
  });
});
