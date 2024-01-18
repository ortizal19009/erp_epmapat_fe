import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Novedad } from '../modelos/novedad.model'
import { environment } from 'src/environments/environment';

const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/novedades`;

@Injectable({
  providedIn: 'root'
})

export class NovedadesService {

  constructor(private http: HttpClient) { }

  getAll(): Observable<Novedad[]> {
    return this.http.get<Novedad[]>(baseUrl);
  }

  get(id: any): Observable<Novedad> {
    return this.http.get<Novedad>(`${baseUrl}/${id}`);
  }

  saveNovedad(nov: Novedad):Observable<Object>{
    return this.http.post(baseUrl, nov);
  }

  update(id: any, data: any): Observable<any> {
    return this.http.put(`${baseUrl}/${id}`, data);
  }

  delete(id: any): Observable<any> {
    return this.http.delete(`${baseUrl}/${id}`);
  }
  //Busca por Descripcion
  findByDescripcion(descripcion: string) {
    return this.http.get<Novedad[]>(`${baseUrl}?descripcion=${descripcion}`);
 }

}
