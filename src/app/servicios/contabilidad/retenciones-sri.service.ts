import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class RetencionesSriService {
  private readonly baseUrl = `${((environment as any).SINGSEND_API_URL || environment.API_URL).replace(/\/$/, '')}/api/singsend/retenciones`;
  private readonly erpBaseUrl = `${environment.API_URL.replace(/\/$/, '')}/api/sri/retenciones`;

  constructor(private http: HttpClient) {}

  generarPdf(claveAcceso: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/pdf?claveAcceso=${encodeURIComponent(claveAcceso)}`, {
      responseType: 'blob',
    });
  }

  descargarXml(claveAcceso: string): Observable<string> {
    return this.http.get(`${this.baseUrl}/xml?claveAcceso=${encodeURIComponent(claveAcceso)}`, {
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
    mensaje?: string,
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

  reenviarCorreoPorId(
    idretencion: number,
    destinatario?: string,
    asunto?: string,
    mensaje?: string,
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
