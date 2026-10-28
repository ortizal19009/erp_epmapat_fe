import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { environment } from 'src/environments/environment';
import { SuspensionesService } from './suspensiones.service';

const api = environment.API_URL;
describe('SuspensionesService: cuentas en el listado', () => {
  let service: SuspensionesService;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(SuspensionesService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('recupera las cuentas del detalle si el servidor omite la lista, conserva el orden y reutiliza la consulta', () => {
    let datos: any;
    service.getListaSuspensiones().subscribe(r => datos = r);
    http.expectOne(`${api}/suspensiones`).flush([
      { idsuspension: 2, cuentasAfectadas: [90] }, { idsuspension: 1, totalCuentas: 2 }
    ]);
    http.expectOne(`${api}/aboxsuspension/suspension/1`).flush([
      { idabonado_abonados: { idabonado: 200 } }, { idabonado_abonados: { idabonado: 100 } },
      { idabonado_abonados: { idabonado: 100 } }
    ]);
    expect(datos.map((r: any) => r.idsuspension)).toEqual([2, 1]);
    expect(datos[1].cuentasAfectadas).toEqual([100, 200]);
    service.getListaSuspensiones().subscribe();
    http.expectOne(`${api}/suspensiones`).flush([{ idsuspension: 1 }]);
    http.expectNone(`${api}/aboxsuspension/suspension/1`);
  });

  it('no hace consultas por fila cuando el backend ya entrega las cuentas', () => {
    let datos: any;
    service.getListaHabilitaciones().subscribe(r => datos = r);
    http.expectOne(`${api}/suspensiones/habilitaciones`).flush([{ idsuspension: 1, cuentasAfectadas: [123] }, { idsuspension: 2, cuentasAfectadas: [] }]);
    expect(datos[0].cuentasAfectadas).toEqual([123]);
    expect(datos[1].cuentasAfectadas).toEqual([]);
    http.expectNone(r => r.url.includes('/aboxsuspension/'));
  });

  it('no convierte un fallo de consulta en una lista de cuentas vacia', () => {
    let datos: any;
    service.getListaSuspensiones().subscribe(r => datos = r);
    http.expectOne(`${api}/suspensiones`).flush([{ idsuspension: 1, totalCuentas: 3 }]);
    http.expectOne(`${api}/aboxsuspension/suspension/1`).flush({}, { status: 500, statusText: 'Error' });
    expect(datos[0].cuentasAfectadas).toBeUndefined();
    expect(datos[0].totalCuentas).toBe(3);
  });
});
