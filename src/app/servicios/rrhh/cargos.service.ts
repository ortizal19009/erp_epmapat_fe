import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/cargos`;

@Injectable({
  providedIn: 'root',
})
export class CargosService {
  constructor(private http: HttpClient) {}
  getAllCargos() {
    return this.http.get(`${baseUrl}`);
  }
  saveCargo(cargo: any) {
    return this.http.post(`${baseUrl}`, cargo);
  }
}
