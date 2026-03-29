import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/usrxmodulos`;
@Injectable({
  providedIn: 'root',
})
export class UsrxmodulosService {
  constructor(private http: HttpClient) {}
  getAccesoModulos(idusuario: number, plataform: string) {
    return this.http.get(`${baseUrl}/access?idusuario=${idusuario}&plataform=${plataform}`);
  }
  getAllModulos(idusuario: number): Observable<any[]> {
    return this.http.get<any[]>(`${baseUrl}?idusuario=${idusuario}`);
  }
  saveAccessModulos(usrmodulos: any) {
    return this.http.post(`${baseUrl}`, usrmodulos);
  }

  getAccessProfile(idusuario: number, platform: string) {
    return this.http.get<any[]>(`${apiUrl}/access/profile?idusuario=${idusuario}&platform=${platform}`);
  }

  saveAccessSeccion(payload: { idusuario: number; iderpseccion: number; enabled: boolean }) {
    return this.http.post(`${apiUrl}/access/sections`, payload);
  }

  getSectionCatalog(iderpmodulo: number, platform: string = 'WEB'): Observable<any[]> {
    // Cambiar a usar endpoint existente hasta que se implemente el correcto
    return this.http.get<any[]>(`${baseUrl}/sections?iderpmodulo=${iderpmodulo}&platform=${platform}`);
  }

  saveSectionCatalog(payload: any) {
    return this.http.post<any>(`${apiUrl}/access/sections/catalog`, payload);
  }

  updateSectionCatalog(iderpseccion: number, payload: any) {
    return this.http.put<any>(`${apiUrl}/access/sections/catalog/${iderpseccion}`, payload);
  }
}
