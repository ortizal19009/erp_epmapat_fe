import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/detcargo`;
@Injectable({
  providedIn: 'root'
})
export class DetcargoService {

  constructor(private http: HttpClient) { }
  getAllDetCargos() {
    return this.http.get(`${baseUrl}`);
  }
  saveDetCargo(detcargo: any) {
    return this.http.post(`${baseUrl}`, detcargo);
  }
}
