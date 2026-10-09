/** Conserva el diagnóstico del servicio sin confundir un rechazo HTTP con falta de conexión. */
export function getRetencionSriErrorDetail(error: any, fallback: string): string {
  let body = error?.error;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      // Algunos servidores devuelven texto en lugar de JSON.
    }
  }

  const messages: string[] = [];
  const collect = (value: any): void => {
    if (Array.isArray(value)) {
      value.forEach(collect);
    } else if (typeof value === 'string' && value.trim() && !value.trim().startsWith('<')) {
      const message = value.trim();
      if (!messages.includes(message)) messages.push(message);
    } else if (value && typeof value === 'object') {
      collect(value.detalle);
      collect(value.mensaje);
      collect(value.message);
      collect(value.error);
    }
  };

  collect(body?.errores);
  collect(body?.errors);
  collect(body?.detalle);
  collect(body?.mensaje);
  collect(body?.message);
  collect(body?.error);
  if (typeof body === 'string') collect(body);

  let detail = messages.join('\n');
  if (!detail) {
    if (error?.status === 0) {
      detail = 'No se pudo obtener una respuesta del servicio. Revise la conexión y la configuración CORS.';
    } else if ([502, 503, 504].includes(error?.status)) {
      detail = 'El servicio no pudo completar la operación. Verifique la disponibilidad de sus servicios dependientes.';
    } else if (body?.estado === 'VALIDACION_PREVIA_FALLIDA') {
      detail = 'El servicio rechazó el XML en la validación previa.';
    } else {
      detail = typeof error?.status !== 'number' && typeof error?.message === 'string'
        ? error.message
        : fallback;
    }
  }

  const requestId = body?.requestId || error?.headers?.get?.('X-Request-Id');
  return typeof requestId === 'string' && requestId.trim()
    ? `${detail}\nReferencia: ${requestId.trim()}`
    : detail;
}
