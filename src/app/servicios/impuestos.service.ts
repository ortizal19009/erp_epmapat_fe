import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/impuestos`;
@Injectable({
  providedIn: 'root'
})
export class ImpuestosService {

  constructor(private http: HttpClient) { }
  getCurrentlyInteres() {
    return this.http.get(`${baseUrl}/currently`)
  }
}
