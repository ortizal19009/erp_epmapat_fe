import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface RetencionProcesadaResponse {
  ok: boolean;
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
  private readonly signSendBaseUrl = `${((environment as any).SINGSEND_API_URL || environment.API_URL).replace(/\/$/, '')}/api/singsend`;
  private readonly baseUrl = `${((environment as any).SINGSEND_API_URL || environment.API_URL).replace(/\/$/, '')}/api/singsend/retenciones`;
  private readonly erpBaseUrl = `${environment.API_URL.replace(/\/$/, '')}/api/sri/retenciones`;

  constructor(private http: HttpClient) {}

  streamRetenciones(): EventSource {
    return new EventSource(`${this.erpBaseUrl}/stream`);
  }

  generarPdf(claveAcceso: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/pdf?claveAcceso=${encodeURIComponent(claveAcceso)}`, {
      responseType: 'blob',
    });
  }

  generarPdfPorId(idretencion: number): Observable<Blob> {
    return this.http.get(`${this.erpBaseUrl}/pdf?idretencion=${encodeURIComponent(String(idretencion))}`, {
      responseType: 'blob',
    });
  }

  descargarXml(claveAcceso: string): Observable<string> {
    return this.http.get(`${this.baseUrl}/xml?claveAcceso=${encodeURIComponent(claveAcceso)}`, {
      responseType: 'text',
    });
  }

  descargarXmlSinFirmarPorId(idretencion: number): Observable<string> {
    return this.http.get(`${this.erpBaseUrl}/xml?idretencion=${encodeURIComponent(String(idretencion))}`, {
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
    const params = new URLSearchParams();
    params.set('claveAcceso', claveAcceso);
    if (destinatario && destinatario.trim()) {
      params.set('emailDestino', destinatario.trim());
    }
    params.set('wait', String(wait));
    params.set('attempts', String(attempts));
    params.set('sleepMillis', String(sleepMillis));
    if (asunto && asunto.trim()) {
      params.set('asunto', asunto.trim());
    }
    if (mensaje && mensaje.trim()) {
      params.set('mensaje', mensaje.trim());
    }
    return this.http.post(`${this.baseUrl}/mail?${params.toString()}`, {});
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
    const params = new URLSearchParams();
    params.set('claveAcceso', claveAcceso);
    if (destinatario && destinatario.trim()) {
      params.set('emailDestino', destinatario.trim());
    }
    params.set('wait', String(wait));
    params.set('attempts', String(attempts));
    params.set('sleepMillis', String(sleepMillis));
    if (asunto && asunto.trim()) {
      params.set('asunto', asunto.trim());
    }
    if (mensaje && mensaje.trim()) {
      params.set('mensaje', mensaje.trim());
    }
    return this.http.post(`${this.baseUrl}/mail?${params.toString()}`, {});
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
    return this.http.post(`${this.erpBaseUrl}/procesar?${params.toString()}`, {});
  }

  procesarXml(
    xml: string | Blob,
    options?: {
      ambiente?: number;
      modo?: string;
      emailDestino?: string;
      attempts?: number;
      sleepMillis?: number;
    }
  ): Observable<RetencionProcesadaResponse> {
    const formData = new FormData();
    const xmlBlob = typeof xml === 'string'
      ? new Blob([xml], { type: 'application/xml' })
      : xml;
    formData.append('xml', xmlBlob, 'retencion.xml');

    const params = new URLSearchParams();
    if (options?.modo?.trim()) {
      params.set('modo', options.modo.trim());
    }
    if (typeof options?.ambiente === 'number') {
      params.set('ambiente', String(options.ambiente));
    }
    if (options?.emailDestino?.trim()) {
      params.set('emailDestino', options.emailDestino.trim());
    }
    if (typeof options?.attempts === 'number') {
      params.set('attempts', String(options.attempts));
    }
    if (typeof options?.sleepMillis === 'number') {
      params.set('sleepMillis', String(options.sleepMillis));
    }

    const query = params.toString();
    const url = `${this.signSendBaseUrl}/retencion/procesar${query ? `?${query}` : ''}`;
    return this.http.post<RetencionProcesadaResponse>(url, formData);
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
    return this.http.post(`${this.erpBaseUrl}/email?${params.toString()}`, {});
  }
}
