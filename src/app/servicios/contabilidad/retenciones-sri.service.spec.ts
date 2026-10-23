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
});
