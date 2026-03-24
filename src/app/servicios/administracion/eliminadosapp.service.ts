import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Eliminadosapp } from 'src/app/modelos/administracion/eliminadosapp.model';
import { environment } from 'src/environments/environment';
const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/eliminadosapp`;
@Injectable({
  providedIn: 'root'
})
export class EliminadosappService {

  constructor(private http: HttpClient) { }

  save(eliminado: Eliminadosapp): Observable<Eliminadosapp> {
    return this.http.post<Eliminadosapp>(baseUrl, eliminado);
  }

}
