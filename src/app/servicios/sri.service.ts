import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from 'src/environments/environment';

const apiUrl = environment.API_URL;
const normalizeSriBaseUrl = (rawUrl: string): string => {
  const cleanUrl = (rawUrl || '').replace(/\/$/, '');
  if (!cleanUrl) {
    return 'http://192.168.0.33:9096';
  }

  return cleanUrl
    .replace('localhost:8080', 'localhost:9096')
    .replace('localhost:9090', 'localhost:9096')
    .replace('192.168.0.33:8080', '192.168.0.33:9096')
    .replace('192.168.0.33:9090', '192.168.0.33:9096');
};

const singsendUrl = normalizeSriBaseUrl(
  (environment as any).SINGSEND_API_URL || environment.API_URL
);
const sriApiV1Url = `${singsendUrl}/api/v1`;
const baseUrl = `${apiUrl}/api/sri`;

export interface SriAttachment {
  fileName?: string;
  filename?: string;
  contentType?: string;
  mimeType?: string;
  base64Data?: string;
  dataBase64?: string;
  contentBase64?: string;
}

export interface SriAutorizacionResponse {
  estado?: string;
  numeroAutorizacion?: string;
  fechaAutorizacion?: string;
  ambiente?: string;
  claveAcceso?: string;
  xmlAutorizado?: string;
  xmlAutorizadoBase64?: string;
  pdfBase64?: string;
  autorizaciones?: any[];
  [key: string]: any;
}

@Injectable({
  providedIn: 'root',
})
export class SriService {
  constructor(private http: HttpClient) { }

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

    return typeof comprobante === 'string' ? comprobante.trim() : '';
  }

  sendEmailNotification(datos: any) {
    console.log(datos);
    return this.http.post(`${baseUrl}/sendMail`, datos);
  }

  sendRetencion(xmlString: string): Observable<string> {
    return this.http.post(`${sriApiV1Url}/retenciones`, xmlString, {
      headers: {
        'Content-Type': 'application/xml',
      },
      responseType: 'text',
    });
  }

  sendFacturaElectronica(xmlPlano: string): Observable<any> {
    return this.http.post(`${sriApiV1Url}/facturas`, xmlPlano, {
      headers: {
        'Content-Type': 'application/xml',
      },
    });
  }

  procesarRetencionXml(
    xml: string | Blob,
    options?: {
      ambiente?: number;
      modo?: string;
      emailDestino?: string;
      attempts?: number;
      sleepMillis?: number;
    }
  ): Observable<any> {
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
    const url = `${sriApiV1Url}/retenciones${query ? `?${query}` : ''}`;
    return this.http.post(url, formData);
  }

  consultarAutorizacionPorXml(
    xml: string,
    options?: {
      wait?: boolean;
      attempts?: number;
      sleepMillis?: number;
      includeXml?: boolean;
    }
  ): Observable<SriAutorizacionResponse> {
    const params = new URLSearchParams();
    params.set('wait', String(options?.wait ?? true));
    params.set('attempts', String(options?.attempts ?? 15));
    params.set('sleepMillis', String(options?.sleepMillis ?? 4000));
    params.set('includeXml', String(options?.includeXml ?? true));

    return this.http.post<SriAutorizacionResponse>(
      `${sriApiV1Url}/autorizacion/by-xml?${params.toString()}`,
      xml,
      {
        headers: {
          'Content-Type': 'application/xml',
        },
      }
    );
  }

  descargarAutorizacionXml(claveAcceso: string): Observable<string> {
    return this.http.get(
      `${sriApiV1Url}/autorizacion/${encodeURIComponent(claveAcceso)}`
    ).pipe(
      map((payload: any) => {
        const xml = this.extraerXmlAutorizado(payload);
        if (!xml) {
          throw new Error(`No se encontro XML autorizado para la clave ${claveAcceso}.`);
        }
        return xml;
      })
    );
  }
}
