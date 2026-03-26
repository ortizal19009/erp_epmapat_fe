import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/th-leave`;

@Injectable({
  providedIn: 'root',
})
export class ThLeaveService {
  constructor(private http: HttpClient) {}

  createBalance(payload: any) {
    return this.http.post(`${baseUrl}/balances`, payload);
  }

  getBalancesByPersonal(idpersonal: number) {
    return this.http.get(`${baseUrl}/balances/persona/${idpersonal}`);
  }

  createRequest(payload: any) {
    return this.http.post(`${baseUrl}/requests`, payload);
  }

  getRequestsByPersonal(idpersonal: number) {
    return this.http.get(`${baseUrl}/requests/persona/${idpersonal}`);
  }

  getRequestsByEstado(estado: string) {
    return this.http.get(`${baseUrl}/requests?estado=${estado}`);
  }

  aprobar(idrequest: number, payload: any) {
    return this.http.post(`${baseUrl}/requests/${idrequest}/aprobar`, payload);
  }

  rechazar(idrequest: number, payload: any) {
    return this.http.post(`${baseUrl}/requests/${idrequest}/rechazar`, payload);
  }
}
