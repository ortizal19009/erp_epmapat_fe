import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Fec_retenciones } from 'src/app/modelos/contabilidad/fec_retenciones.model';

@Injectable({
  providedIn: 'root',
})
export class RetencionesSriService {
  private readonly baseUrl = `${environment.API_URL}/api/sri/retenciones`;

  constructor(private http: HttpClient) {}

  generarPdf(idretencion: number): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/pdf?idretencion=${idretencion}`, {
      responseType: 'blob',
    });
  }

  listar(estado?: string): Observable<Fec_retenciones[]> {
    const params = estado && estado.trim() ? `?estado=${encodeURIComponent(estado.trim())}` : '';
    return this.http.get<Fec_retenciones[]>(`${this.baseUrl}${params}`);
  }

  descargarXml(idretencion: number): Observable<string> {
    return this.http.get(`${this.baseUrl}/xml?idretencion=${idretencion}`, {
      responseType: 'text',
    });
  }

  procesar(
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
    return this.http.post(`${this.baseUrl}/procesar?${params.toString()}`, {});
  }

  reenviarCorreo(
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
    return this.http.post(`${this.baseUrl}/email?${params.toString()}`, {});
  }
}
