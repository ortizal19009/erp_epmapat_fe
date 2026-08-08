import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

const apiUrl = environment.API_URL;
const singsendUrl = ((environment as any).SINGSEND_API_URL || environment.API_URL).replace(/\/$/, '');
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
  constructor(private http: HttpClient) {}

  sendEmailNotification(datos: any) {
    console.log(datos);
    return this.http.post(`${baseUrl}/sendMail`, datos);
  }

  sendRetencion(xmlString: string): Observable<string> {
    return this.http.post(`${singsendUrl}/api/singsend/retencion/string`, xmlString, {
      headers: {
        'Content-Type': 'application/xml',
      },
      responseType: 'text',
    });
  }

  sendFacturaElectronica(xmlPlano: string): Observable<any> {
    return this.http.post(`${singsendUrl}/api/singsend/factura`, xmlPlano, {
      responseType: 'json',
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
    const url = `${singsendUrl}/api/singsend/retencion/procesar${query ? `?${query}` : ''}`;
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
      `${singsendUrl}/api/singsend/autorizacion/by-xml?${params.toString()}`,
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
      `${singsendUrl}/api/singsend/autorizacion?claveAcceso=${encodeURIComponent(claveAcceso)}&download=false&returnXml=true`,
      { responseType: 'text' }
    );
  }
}
