import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/contemergencia`;

@Injectable({
  providedIn: 'root'
})
export class ContemergenciaService {

  constructor(private http:HttpClient) { }
  getAllContEmergencia() {
    return this.http.get(`${baseUrl}`);
  }
}
