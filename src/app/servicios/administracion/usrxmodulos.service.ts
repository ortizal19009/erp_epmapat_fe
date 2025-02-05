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
  getAccesoModulos(idusuario: number) {
    return this.http.get(`${baseUrl}/access?idusuario=${idusuario}`);
  }
}
