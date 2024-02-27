import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { Recaudaxcaja } from '../modelos/recaudaxcaja.model';

const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/recaudaxcaja`;

@Injectable({
  providedIn: 'root',
})
export class RecaudaxcajaService {
  constructor(private http: HttpClient) { }

  getLastConexion(idcaja: number) {
    return this.http.get<Recaudaxcaja>(`${baseUrl}/lastconexion/${idcaja}`);
  }

  saveRecaudaxcaja(recxcaja: Recaudaxcaja) {
    return this.http.post(`${baseUrl}`, recxcaja);
  }
  updateRecaudaxcaja(recxcaja: Recaudaxcaja) {
    return this.http.put(`${baseUrl}/${recxcaja.idrecaudaxcaja}`, recxcaja);
  }
}
