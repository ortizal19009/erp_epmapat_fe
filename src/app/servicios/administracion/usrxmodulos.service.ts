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
  getAllModulos(idusuario: number, platform: string){
    return this.http.get(`${baseUrl}?idusuario=${idusuario}&platform=${platform}`);
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
}
