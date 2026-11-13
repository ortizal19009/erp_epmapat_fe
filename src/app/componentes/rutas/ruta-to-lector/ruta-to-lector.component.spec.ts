import { of, throwError } from 'rxjs';
import { RutaToLectorComponent } from './ruta-to-lector.component';

describe('RutaToLectorComponent: reportes completos', () => {
  let componente: RutaToLectorComponent;
  let rutasService: any;
  let asignacionesService: any;
  let lecturasService: any;
  const ruta1 = { idruta: 1, codigo: '01', descripcion: 'Centro' };
  const ruta2 = { idruta: 2, codigo: '02', descripcion: 'Sin asignacion' };
  const asignaciones = [{ idusuario_usuarios: { idusuario: 10, nomusu: 'Lector A' }, rutas: [ruta1, ruta1] }];

  beforeEach(() => {
    rutasService = { getByIdEmision: jasmine.createSpy().and.returnValue(of([
      { idrutaxemision: 101, idruta_rutas: ruta1 }, { idrutaxemision: 102, idruta_rutas: ruta2 }
    ])) };
    asignacionesService = { findByEmision: jasmine.createSpy().and.returnValue(of(asignaciones)) };
    lecturasService = { getByIdEmision: jasmine.createSpy() };
    componente = new RutaToLectorComponent({} as any, {} as any, {} as any,
      asignacionesService, lecturasService, rutasService, {} as any, {} as any);
    componente.emisionSelected = { idemision: 252, emision: '2610' };
  });

  it('incluye las rutas sin lector y no repite las asignadas mas de una vez', async () => {
    const reporte = await (componente as any).construirReporteGeneralAsignaciones();
    expect(reporte.totalRutas).toBe(2);
    expect(reporte.detalles.map((x: any) => x.totalRutas)).toEqual([1, 1]);
    expect(reporte.detalles[1].lector).toBe('Sin lector asignado');
    expect(reporte.detalles[1].rutas[0].idruta).toBe(2);
  });

  it('conserva el catalogo aunque no haya asignaciones', async () => {
    asignacionesService.findByEmision.and.returnValue(of([]));
    const reporte = await (componente as any).construirReporteGeneralAsignaciones();
    expect(reporte.totalRutas).toBe(2);
    expect(reporte.detalles[0].totalRutas).toBe(2);
  });

  it('obtiene todas las lecturas de la emision, incluidas rutas sin lector y lecturas sin ruta', async () => {
    const lecturas = [
      { idlectura: 1, idabonado_abonados: { idabonado: 1 }, idrutaxemision_rutasxemision: { idruta_rutas: ruta1 },
        fotoPath: 'LECTURAS/1.jpg', fechalectura: '2026-10-14T00:00:00-05:00', readingCapturedAt: '2026-10-14T17:25:05.443Z' },
      { idlectura: 2, idabonado_abonados: { idabonado: 2 }, idrutaxemision_rutasxemision: { idruta_rutas: ruta2 }, fotoPath: '   ', fechalectura: '2026-10-14' },
      { idlectura: 3, idabonado_abonados: { idabonado: 3 } }
    ];
    lecturasService.getByIdEmision.and.returnValue(of(lecturas));
    const reporte = await (componente as any).construirReporteLecturasGenerales();
    expect(lecturasService.getByIdEmision).toHaveBeenCalledOnceWith(252);
    expect(reporte.detalles.length).toBe(3);
    const fila = reporte.detalles.find((x: any) => x.cuenta === 1);
    expect(fila.foto).toBe('S\u00ed');
    expect(fila.hora).toBe('12:25:05');
    const sinLector = reporte.detalles.find((x: any) => x.cuenta === 2);
    expect(sinLector.lector).toBe('Sin lector asignado');
    expect(sinLector.foto).toBe('No');
    expect(sinLector.hora).toBe('Sin registro');
    expect(sinLector.fecha).toBe('14/10/2026');
  });

  it('no inventa la hora de fechas antiguas o ausentes y admite capturas a medianoche', () => {
    const parsear = (fecha: any, captura?: any) => (componente as any).parseFechaLectura(fecha, captura);
    expect(parsear('2026-10-14T00:00:00-05:00').hora).toBe('Sin registro');
    expect(parsear(null).hora).toBe('Sin registro');
    expect(parsear(null, '2026-10-14T00:00:00-05:00').hora).toBe('00:00:00');
    expect(parsear('2026-10-14T14:35:02-05:00', 'invalida').hora).toBe('14:35:02');
  });

  it('no devuelve un reporte parcial si falla la consulta de lecturas', async () => {
    lecturasService.getByIdEmision.and.returnValue(throwError(() => new Error('Sin conexion')));
    await expectAsync((componente as any).construirReporteLecturasGenerales()).toBeRejected();
  });

  it('alinea las columnas de ruta, foto y hora del Excel con sus datos', async () => {
    const descargar = spyOn<any>(componente, 'descargarWorkbook').and.resolveTo();
    spyOn<any>(componente, 'swal');
    await (componente as any).generarExcelLecturasGenerales({ emision: '2610', fechaGeneracion: new Date(), detalles: [{
      rutaCodigo: '02', rutaDescripcion: 'Sin asignacion', cuenta: 2, foto: 'No', hora: 'Sin registro', fecha: '14/10/2026'
    }] });
    const hoja = (descargar.calls.mostRecent().args[0] as any).worksheets[0];
    expect(hoja.getRow(5).cellCount).toBe(20);
    expect(hoja.getCell('A6').value).toBe('02');
    expect(hoja.getCell('S5').value).toBe('Foto');
    expect(hoja.getCell('S6').value).toBe('No');
    expect(hoja.getCell('T5').value).toBe('Hora de toma');
    expect(hoja.getCell('T6').value).toBe('Sin registro');
  });
});
