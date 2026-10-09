import { getRetencionSriErrorDetail } from './retenciones-sri-error';

describe('Diagnóstico de errores de retenciones SRI', () => {
  const fallback = 'No se pudo procesar la retención';

  it('muestra todos los errores de validación y su referencia', () => {
    const detail = getRetencionSriErrorDetail({ status: 400, error: {
      estado: 'VALIDACION_PREVIA_FALLIDA', errores: ['Clave inválida', 'Falta periodoFiscal'], requestId: 'ref-validacion'
    } }, fallback);
    expect(detail).toContain('Clave inválida');
    expect(detail).toContain('Falta periodoFiscal');
    expect(detail).toContain('Referencia: ref-validacion');
    expect(detail).not.toContain('conexión');
  });

  it('conserva el rechazo de firma o SRI y su detalle', () => {
    const detail = getRetencionSriErrorDetail({ status: 400, error: {
      error: 'Error firmando comprobante', detalle: 'Certificado no disponible'
    } }, fallback);
    expect(detail).toContain('Error firmando comprobante');
    expect(detail).toContain('Certificado no disponible');
  });

  it('interpreta cuerpos JSON devueltos como texto', () => {
    expect(getRetencionSriErrorDetail({ status: 400, error: JSON.stringify({ errores: ['XML inválido'] }) }, fallback))
      .toBe('XML inválido');
  });

  it('distingue ausencia de respuesta de un error HTTP', () => {
    expect(getRetencionSriErrorDetail({ status: 0 }, fallback)).toContain('No se pudo obtener una respuesta');
    expect(getRetencionSriErrorDetail({ status: 400, message: 'Http failure response' }, fallback)).toBe(fallback);
  });

  it('distingue indisponibilidad de un servicio dependiente sin afirmar fallo de correo', () => {
    const detail = getRetencionSriErrorDetail({ status: 503 }, fallback);
    expect(detail).toContain('servicios dependientes');
    expect(detail).not.toContain('correo');
  });

  it('admite errors y objetos de mensaje sin duplicarlos', () => {
    expect(getRetencionSriErrorDetail({ status: 400, error: {
      errors: [{ mensaje: 'RUC inválido' }, { message: 'RUC inválido' }]
    } }, fallback)).toBe('RUC inválido');
  });

  it('usa la referencia de cabecera si falta en el cuerpo', () => {
    const detail = getRetencionSriErrorDetail({ status: 500, headers: { get: () => 'ref-cabecera' } }, fallback);
    expect(detail).toContain('Referencia: ref-cabecera');
  });

  it('omite páginas HTML y mantiene mensajes de errores locales', () => {
    expect(getRetencionSriErrorDetail({ status: 502, error: '<html>Error de proxy</html>' }, fallback))
      .not.toContain('<html>');
    expect(getRetencionSriErrorDetail(new Error('XML no disponible'), fallback)).toBe('XML no disponible');
  });
});
