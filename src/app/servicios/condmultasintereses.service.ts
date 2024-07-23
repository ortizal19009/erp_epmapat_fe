import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/condmultasintereses`;
@Injectable({
  providedIn: 'root',
})
export class CondmultasinteresesService {
  constructor(private http: HttpClient) {}
  saveCondonacion(condonacion: any) {
    return this.http.post(`${baseUrl}`, condonacion);
  }
}
