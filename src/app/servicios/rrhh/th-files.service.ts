import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/th-files`;

@Injectable({ providedIn: 'root' })
export class ThFilesService {
  constructor(private http: HttpClient) {}

  save(payload: any) {
    return this.http.post(baseUrl, payload);
  }

  byPersonal(idpersonal: number) {
    return this.http.get(`${baseUrl}/persona/${idpersonal}`);
  }
}
