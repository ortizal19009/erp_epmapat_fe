import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/recaudaxcaja`;
@Injectable({
  providedIn: 'root'
})
export class RecaudaxcajaService {
  constructor(private http: HttpClient) { }
  getLastConexion(idcaja: number){
    return this.http.get<Recaudaxcaja>(`${baseUrl}`)

  }
}
