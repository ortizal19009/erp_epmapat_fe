import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/tpcontratos`;

@Injectable({
  providedIn: 'root',
})
export class TpcontratosService {
  constructor(private http: HttpClient) {}
  getAllTpcontratos() {
    return this.http.get(`${baseUrl}`);
  }
}
