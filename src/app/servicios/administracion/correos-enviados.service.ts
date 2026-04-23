import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

export interface CorreosEnviadosRegistro {
  modulo: string;
  documentoid: number;
  documento: string;
  destinatarios: string;
  asunto: string;
  remitente: string;
  archivoadjunto: string;
  estado: string;
  detalle: string;
}

@Injectable({
  providedIn: 'root',
})
export class CorreosEnviadosService {
  private readonly baseUrl = `${environment.API_URL.replace(/\/$/, '')}/correos-enviados`;

  constructor(private http: HttpClient) {}

  registrarEnvio(payload: CorreosEnviadosRegistro) {
    return this.http.post(this.baseUrl, payload);
  }
}
