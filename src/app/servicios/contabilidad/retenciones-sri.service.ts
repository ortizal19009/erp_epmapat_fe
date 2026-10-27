import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map, throwError } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface RetencionProcesadaResponse {
  ok?: boolean;
  estado: string;
  requestId?: string;
  claveAcceso?: string;
  numeroAutorizacion?: string;
  fechaAutorizacion?: string;
  ambiente?: string;
  xmlAutorizado?: string;
  xmlAutorizadoBase64?: string;
  pdfBase64?: string;
  email?: string;
  emailEncolado?: boolean;
  emailEnviado?: boolean;
  emailQueueId?: string | null;
  detalle?: string;
  errores?: string[];
  warnings?: string[];
  tiempoProcesoMs?: number;
  recepcionEstado?: string;
  resultado?: any;
}

@Injectable({
  providedIn: 'root',
})
export class RetencionesSriService {
  private readonly retencionesApiUrl = environment.RETENCIONES_SRI_API_URL.replace(/\/+$/, '');
  // El ERP genera el XML desde los registros contables y ofrece PDF, correo y SSE.
  private readonly documentosErpUrl = `${environment.API_URL.replace(/\/+$/, '')}/api/sri/retenciones`;

  constructor(private http: HttpClient) { }

  obtenerAutorizacion(claveAcceso: string): Observable<{
    autorizado: boolean; mensaje: string; numeroAutorizacion: string; requestId?: string;
  }> {
    return this.http.get<{
      autorizado: boolean; mensaje: string; numeroAutorizacion: string; requestId?: string;
    }>(`${this.retencionesApiUrl}/${encodeURIComponent(claveAcceso)}/autorizacion`);
  }

  validarXml(xml: string): Observable<{
    valid: boolean; errors: string[]; warnings: string[];
    claveAcceso: string; ambiente: string; requestId?: string;
  }> {
    return this.http.post<{
      valid: boolean; errors: string[]; warnings: string[];
      claveAcceso: string; ambiente: string; requestId?: string;
    }>(`${this.retencionesApiUrl}/validar`, xml, {
      headers: { 'Content-Type': 'application/xml', Accept: 'application/json' },
    });
  }

  streamRetenciones(): EventSource {
    return new EventSource(`${this.documentosErpUrl}/stream`);
  }

  generarPdfPorId(idretencion: number): Observable<Blob> {
    return this.http.get(`${this.documentosErpUrl}/pdf?idretencion=${encodeURIComponent(String(idretencion))}`, {
      responseType: 'blob',
    });
  }

  consultarPorId(idretencion: number): Observable<RetencionProcesadaResponse> {
    return this.http.post<RetencionProcesadaResponse>(`${this.documentosErpUrl}/consultar`, {}, {
      params: { idretencion: String(idretencion) },
    });
  }

  descargarXmlAutorizado(claveAcceso: string): Observable<string> {
    const clave = String(claveAcceso || '').trim();
    if (!/^\d{49}$/.test(clave)) {
      return throwError(() => new Error('La retencion no tiene una clave de acceso valida de 49 digitos.'));
    }
    const autorizacionUrl = this.retencionesApiUrl.replace(/\/retenciones$/, '/autorizacion');
    return this.http.get<{
      xmlAutorizado?: string; estado?: string; mensaje?: string;
      detalleUltimaConsulta?: string; requestId?: string;
    }>(`${autorizacionUrl}/${encodeURIComponent(clave)}/xml`, {
      headers: { Accept: 'application/json' },
    }).pipe(
      map(respuesta => {
        const xml = respuesta?.xmlAutorizado;
        if (typeof xml === 'string' && xml.trim()) return xml;
        const detalle = [respuesta?.mensaje, respuesta?.detalleUltimaConsulta]
          .filter(Boolean).join(' ');
        throw new Error(`Clave consultada: ${clave}. ` + (detalle || 'El XML autorizado aun no esta disponible en el SRI.')
          + (respuesta?.requestId ? ` Referencia: ${respuesta.requestId}` : ''));
      })
    );
  }

  descargarXmlSinFirmarPorId(idretencion: number): Observable<string> {
    return this.http.get(`${this.documentosErpUrl}/xml?idretencion=${encodeURIComponent(String(idretencion))}`, {
      responseType: 'text',
    });
  }

  procesarPorId(
    idretencion: number,
    destinatario?: string,
    asunto?: string,
    mensaje?: string
  ): Observable<any> {
    const params = new URLSearchParams();
    params.set('idretencion', String(idretencion));
    if (destinatario && destinatario.trim()) {
      params.set('destinatario', destinatario.trim());
    }
    if (asunto && asunto.trim()) {
      params.set('asunto', asunto.trim());
    }
    if (mensaje && mensaje.trim()) {
      params.set('mensaje', mensaje.trim());
    }
    return this.http.post(`${this.documentosErpUrl}/procesar?${params.toString()}`, {});
  }

  procesarXml(xml: string | Blob): Observable<RetencionProcesadaResponse> {
    return this.http.post<RetencionProcesadaResponse>(`${this.retencionesApiUrl}`, xml, {
      headers: { 'Content-Type': 'application/xml', Accept: 'application/json' },
    });
  }

  reenviarCorreoPorId(
    idretencion: number,
    destinatario?: string,
    asunto?: string,
    mensaje?: string
  ): Observable<any> {
    const params = new URLSearchParams();
    params.set('idretencion', String(idretencion));
    if (destinatario && destinatario.trim()) {
      params.set('destinatario', destinatario.trim());
    }
    if (asunto && asunto.trim()) {
      params.set('asunto', asunto.trim());
    }
    if (mensaje && mensaje.trim()) {
      params.set('mensaje', mensaje.trim());
    }
    return this.http.post(`${this.documentosErpUrl}/email?${params.toString()}`, {});
  }
}
