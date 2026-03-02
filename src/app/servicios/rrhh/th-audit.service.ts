import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/th-audit`;

@Injectable({ providedIn: 'root' })
export class ThAuditService {
  constructor(private http: HttpClient) {}

  byEntidad(entidad: string) {
    return this.http.get(`${baseUrl}?entidad=${entidad}`);
  }

  byEntidadRegistro(entidad: string, idregistro: number) {
    return this.http.get(`${baseUrl}?entidad=${entidad}&idregistro=${idregistro}`);
  }
}
