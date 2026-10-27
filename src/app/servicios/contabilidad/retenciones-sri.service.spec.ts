import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RetencionesSriService } from './retenciones-sri.service';
import { environment } from 'src/environments/environment';

describe('RetencionesSriService: contrato del servidor', () => {
  let service: RetencionesSriService;
  let http: HttpTestingController;
  const base = environment.RETENCIONES_SRI_API_URL;
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(RetencionesSriService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('valida XML enviando el texto y application/xml', () => {
    service.validarXml('<comprobanteRetencion/>').subscribe(r => expect(r.valid).toBeTrue());
    const req = http.expectOne(base + '/validar');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toBe('<comprobanteRetencion/>');
    expect(req.request.headers.get('Content-Type')).toBe('application/xml');
    req.flush({ valid: true, errors: [], warnings: [] });
  });

  it('procesa el XML sin parametros de correo o polling ajenos al controlador', () => {
    service.procesarXml('<comprobanteRetencion/>').subscribe(r => expect(r.estado).toBe('AUTORIZADO'));
    const req = http.expectOne(base);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toBe('<comprobanteRetencion/>');
    expect(req.request.headers.get('Content-Type')).toBe('application/xml');
    req.flush({ estado: 'AUTORIZADO', numeroAutorizacion: '123' });
  });

  it('conserva una respuesta 202 como pendiente', () => {
    service.procesarXml('<comprobanteRetencion/>').subscribe(r => expect(r.estado).toBe('PENDIENTE_AUTORIZACION'));
    http.expectOne(base).flush({ estado: 'PENDIENTE_AUTORIZACION' }, { status: 202, statusText: 'Accepted' });
  });

  it('consulta la autorizacion mediante GET sin reenviar el comprobante', () => {
    const clave = '1'.repeat(49);
    service.obtenerAutorizacion(clave).subscribe(r => expect(r.autorizado).toBeFalse());
    const req = http.expectOne(base + '/' + clave + '/autorizacion');
    expect(req.request.method).toBe('GET');
    req.flush({ autorizado: false, mensaje: 'Pendiente', numeroAutorizacion: '' });
  });
  it('procesa por ID en el ERP para persistir autorizacion y enviar adjuntos', () => {
    service.procesarPorId(17).subscribe();
    const req = http.expectOne(environment.API_URL + '/api/sri/retenciones/procesar?idretencion=17');
    expect(req.request.method).toBe('POST');
    req.flush({ estado: 'AUTORIZADA', emailEnviado: false });
  });

  it('consulta por ID para sincronizar el XML sin volver a emitir', () => {
    service.consultarPorId(17).subscribe();
    const req = http.expectOne(environment.API_URL + '/api/sri/retenciones/consultar?idretencion=17');
    expect(req.request.method).toBe('POST');
    req.flush({ estado: 'AUTORIZADA' });
  });

  it('recupera el XML por clave desde sri-files y extrae el campo JSON', () => {
    const clave = '2210202607046002881000120010010000069577596000015';
    const xml = '<autorizacion>Retenci\u00f3n</autorizacion>';
    service.descargarXmlAutorizado(clave).subscribe(r => expect(r).toBe(xml));
    const req = http.expectOne(base.replace(/\/retenciones$/, '/autorizacion') + '/' + clave + '/xml');
    expect(req.request.method).toBe('GET');
    expect(req.request.responseType).toBe('json');
    req.flush({ estado: 'AUTORIZADO', xmlAutorizado: xml });
  });

  it('informa la consulta pendiente y no devuelve un XML vacio', () => {
    const clave = '1'.repeat(49);
    service.descargarXmlAutorizado(clave).subscribe({
      next: () => fail('No debe descargar un XML vacio'),
      error: error => {
        expect(error.message).toContain('Consulta pendiente');
        expect(error.message).toContain('ref-123');
      },
    });
    http.expectOne(base.replace(/\/retenciones$/, '/autorizacion') + '/' + clave + '/xml')
      .flush({ estado: 'PENDIENTE_CONSULTA', xmlAutorizado: '', mensaje: 'Consulta pendiente', requestId: 'ref-123' },
        { status: 202, statusText: 'Accepted' });
  });

  it('rechaza un ID usado en lugar de una clave sin llamar al servicio', () => {
    service.descargarXmlAutorizado('156').subscribe({
      next: () => fail('No debe consultar por ID'),
      error: error => expect(error.message).toContain('49 digitos'),
    });
  });
});
