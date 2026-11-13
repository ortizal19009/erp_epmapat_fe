import { Subject, throwError } from 'rxjs';
import { DetallesAbonadoComponent } from './detalles-abonado.component';

describe('Notificacion de deuda: conciliacion de totales', () => {
  let c: any, documento: any;
  const rubros = [69.80, 32.72, 27.54, .30, .35, 7.22, .50].map((valor, i) => ({
    cantidad: 1, valorunitario: valor, estado: 1, idrubro_rubros: { idrubro: 1001 + i, descripcion: `Rubro ${i}` }
  }));
  beforeEach(() => {
    documento = null;
    c = Object.create(DetallesAbonadoComponent.prototype);
    Object.assign(c, {
      s_loading: { showLoading: jasmine.createSpy(), hideLoading: jasmine.createSpy() },
      s_pdf: { header() {}, setfooter(doc: any) { documento = doc; } },
      rubxfacService: { getByIdfacturaAsync: jasmine.createSpy().and.resolveTo(rubros) },
      datosImprimir: { idabonado: 12589, idcliente_clientes: {}, idruta_rutas: {}, idcategoria_categorias: {},
        facturas: [{ idfactura: 3066204, modulo: 'EMISION' }] },
      _abonado: [{ idabonado: 12589 }], swEmail: true, dataURI: 'anterior',
    });
    spyOn(c, 'getFechaEmision').and.resolveTo('2026-09-01');
    spyOn(c, 'swal');
  });
  it('espera el interes y muestra el mismo total en las dos tablas', async () => {
    let resolver!: (valor: number) => void;
    spyOn(c, 'cInteres').and.returnValue(new Promise<number>(resolve => resolver = resolve));
    const pendiente = c.impNotificacion();
    await Promise.resolve(); expect(documento).toBeNull();
    resolver(1.06); await pendiente;
    const pdf = documento.output();
    expect(pdf.match(/\(139\.49\)/g)?.length).toBe(3);
    expect(pdf).toContain('(138.43)');
    expect(c.rubrostotal).toBe(138.43);
    expect(c.dataURI).not.toBe('anterior');
  });
  it('incluye otros modulos, omite rubros inactivos y no duplica planillas', async () => {
    spyOn(c, 'cInteres').and.resolveTo(0);
    c.datosImprimir.facturas.push({ idfactura: 99, modulo: 'OTROS' }, { idfactura: 99, modulo: 'OTROS' });
    c.rubxfacService.getByIdfacturaAsync.and.callFake(async (id: number) => id === 99 ? [
      { cantidad: 2, valorunitario: 6.17, estado: 1, idrubro_rubros: { idrubro: 7, descripcion: 'Otro' } },
      { cantidad: 1, valorunitario: 500, estado: 0, idrubro_rubros: { idrubro: 8 } },
    ] : rubros);
    await c.impNotificacion();
    expect(c.rubrostotal).toBe(150.77);
    expect(documento.output().match(/\(150\.77\)/g)?.length).toBe(4);
    expect(c.rubxfacService.getByIdfacturaAsync).toHaveBeenCalledTimes(2);
  });
  it('no deja un PDF anterior disponible ni el indicador activo si falla una consulta', async () => {
    spyOn(c, 'cInteres').and.rejectWith(new Error('Sin conexion'));
    await expectAsync(c.impNotificacion()).toBeRejected();
    expect(documento).toBeNull(); expect(c.dataURI).toBe('');
    expect(c.reportePdfUrl).toBeNull();
  });
  it('abre siempre el selector y libera el PDF anterior sin consultar datos', () => {
    c.reportePdfUrl = 'blob:anterior'; c.pdfView = false;
    c.reporteCargando = true; c.reporteError = 'Error anterior';
    const liberar = spyOn(URL, 'revokeObjectURL');
    c.abrirImprimir();
    expect(c.pdfView).toBeTrue(); expect(c.reporteCargando).toBeFalse();
    expect(c.reporteError).toBe(''); expect(c.reportePdfUrl).toBeNull();
    expect(liberar).toHaveBeenCalledWith('blob:anterior');
    expect(c.rubxfacService.getByIdfacturaAsync).not.toHaveBeenCalled();
  });

  it('asigna el PDF al visor propio aunque haya otro iframe llamado pdfViewer', () => {
    c.reportePdfUrl = 'blob:reporte';
    const frame = { src: '' };
    c.visorReporte = { nativeElement: frame };
    expect(frame.src).toBe('blob:reporte');
  });

  it('procesa hasta cuatro planillas simultaneas y mantiene los totales', async () => {
    c.datosImprimir.facturas = Array.from({ length: 9 }, (_, i) => ({ idfactura: i + 1, modulo: 'EMISION' }));
    let activas = 0, maximo = 0;
    c.rubxfacService.getByIdfacturaAsync.and.callFake(async () => {
      activas++; maximo = Math.max(maximo, activas);
      await new Promise(resolve => setTimeout(resolve, 5));
      activas--; return rubros;
    });
    spyOn(c, 'cInteres').and.resolveTo(0);
    await c.impNotificacion();
    expect(maximo).toBe(4);
    expect(c.reporteProcesadas).toBe(9);
    expect(c.rubrostotal).toBe(1245.87);
  });

  it('muestra error recuperable si falla la consulta inicial', async () => {
    c.reporteRequest = 0;
    c.facService = { getSinCobrar: () => throwError(() => new Error('Sin conexion')) };
    await c.setOptImprimir.call(Object.assign(c, { opt: '0' }));
    expect(c.reporteCargando).toBeFalse();
    expect(c.reporteError).toContain('No se pudo cargar');
    expect(c.reportePdfUrl).toBeNull();
  });

  it('ignora una consulta anterior cuando se cierra y se vuelve a abrir el modal', async () => {
    const pendiente = new Subject<any[]>();
    c.reporteRequest = 0; c.facService = { getSinCobrar: () => pendiente };
    const generar = spyOn(c, 'impNotificacion').and.resolveTo();
    const solicitud = c.getSinCobro();
    c.abrirImprimir(); pendiente.next([{ idfactura: 1 }]);
    await solicitud;
    expect(generar).not.toHaveBeenCalled();
    expect(c.pdfView).toBeTrue(); expect(c.reporteCargando).toBeFalse();
  });

});
