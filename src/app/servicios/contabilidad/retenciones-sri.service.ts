import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
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

  private extraerPdfBase64(payload: any): string {
    if (typeof payload?.pdfBase64 === 'string' && payload.pdfBase64.trim()) {
      return payload.pdfBase64.trim();
    }

    const attachments = payload?.attachments || payload?.adjuntos || [];
    const pdfAttachment = attachments.find((item: any) => {
      const type = String(item?.contentType || item?.mimeType || '').toLowerCase();
      const name = String(item?.fileName || item?.filename || '').toLowerCase();
      return type.includes('pdf') || name.endsWith('.pdf');
    });

    return String(
      pdfAttachment?.base64Data ||
      pdfAttachment?.dataBase64 ||
      pdfAttachment?.contentBase64 ||
      ''
    ).trim();
  }

  private extraerXmlAutorizado(payload: any): string {
    if (typeof payload?.xmlAutorizado === 'string' && payload.xmlAutorizado.trim()) {
      return payload.xmlAutorizado.trim();
    }

    if (typeof payload?.xmlAutorizadoBase64 === 'string' && payload.xmlAutorizadoBase64.trim()) {
      return atob(payload.xmlAutorizadoBase64.trim());
    }

    const comprobante =
      payload?.autorizacion?.autorizaciones?.autorizacion?.[0]?.comprobante ||
      payload?.autorizaciones?.[0]?.comprobante ||
      '';

    if (typeof comprobante === 'string' && comprobante.trim()) {
      return comprobante.trim();
    }

    const attachments = payload?.attachments || payload?.adjuntos || [];
    const xmlAttachment = attachments.find((item: any) => {
      const type = String(item?.contentType || item?.mimeType || '').toLowerCase();
      const name = String(item?.fileName || item?.filename || '').toLowerCase();
      return type.includes('xml') || name.endsWith('.xml');
    });

    const xmlBase64 = String(
      xmlAttachment?.base64Data ||
      xmlAttachment?.dataBase64 ||
      xmlAttachment?.contentBase64 ||
      ''
    ).trim();

    return xmlBase64 ? atob(xmlBase64) : '';
  }

  private base64ToBlob(base64: string, mimeType: string): Blob {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new Blob([bytes], { type: mimeType });
  }

  streamRetenciones(): EventSource {
    return new EventSource(`${this.documentosErpUrl}/stream`);
  }

  generarPdf(claveAcceso: string): Observable<Blob> {
    return this.obtenerAutorizacion(claveAcceso).pipe(
      map((payload) => {
        const pdfBase64 = this.extraerPdfBase64(payload);
        if (!pdfBase64) {
          throw new Error('La API no devolvio el PDF autorizado de la retencion.');
        }
        return this.base64ToBlob(pdfBase64, 'application/pdf');
      })
    );
  }

  generarPdfPorId(idretencion: number): Observable<Blob> {
    return this.http.get(`${this.documentosErpUrl}/pdf?idretencion=${encodeURIComponent(String(idretencion))}`, {
      responseType: 'blob',
    });
  }

  descargarXml(claveAcceso: string): Observable<string> {
    return this.obtenerAutorizacion(claveAcceso).pipe(
      map((payload) => {
        const xml = this.extraerXmlAutorizado(payload);
        if (!xml) {
          throw new Error('La API no devolvio el XML autorizado de la retencion.');
        }
        return xml;
      })
    );
  }

  descargarXmlSinFirmarPorId(idretencion: number): Observable<string> {
    return this.http.get(`${this.documentosErpUrl}/xml?idretencion=${encodeURIComponent(String(idretencion))}`, {
      responseType: 'text',
    });
  }

  procesar(
    claveAcceso: string,
    destinatario?: string,
    asunto?: string,
    mensaje?: string,
    wait: boolean = false,
    attempts: number = 10,
    sleepMillis: number = 3000
  ): Observable<any> {
    return this.obtenerAutorizacion(claveAcceso);
  }

  reenviarCorreo(
    claveAcceso: string,
    destinatario?: string,
    asunto?: string,
    mensaje?: string,
    wait: boolean = false,
    attempts: number = 10,
    sleepMillis: number = 3000
  ): Observable<any> {
    return this.obtenerAutorizacion(claveAcceso);
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
