import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/th-actions`;

@Injectable({
  providedIn: 'root',
})
export class ThActionsService {
  constructor(private http: HttpClient) {}

  getByPersonal(idpersonal: number) {
    return this.http.get(`${baseUrl}/persona/${idpersonal}`);
  }

  save(action: any) {
    return this.http.post(`${baseUrl}`, action);
  }

  getById(id: number) {
    return this.http.get(`${baseUrl}/${id}`);
  }
}
