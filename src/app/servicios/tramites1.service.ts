import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Tramites1 } from '../modelos/tramites1';
import { environment } from 'src/environments/environment';

const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/tramites1`;

@Injectable({
  providedIn: 'root'
})

export class Tramites1Service {

  constructor(private http: HttpClient) { }

  public getListaTramites1(): Observable<Tramites1[]> {
    return this.http.get<Tramites1[]>(`${baseUrl}`);
  }

  public saveTramites1(tramite1: Tramites1): Observable<Object> {
    return this.http.post(`${baseUrl}`, tramite1);
  }

  public rubrosxtramite(idtramite: number, idrubro: number) {
    return this.http.put(`${baseUrl}/${idtramite}/${idrubro}`, null)
  }

  public getTramiteById(idtramite: number){
    return this.http.get<Tramites1>(`${baseUrl}/${idtramite}`);
  }

}
