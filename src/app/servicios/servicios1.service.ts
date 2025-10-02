import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Servicios1 } from '../modelos/servicios1';
import { environment } from 'src/environments/environment';

const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/servicios1`;

@Injectable({
  providedIn: 'root'
})

export class Servicios1Service {

  constructor(private http:HttpClient) { }

  getListaServicios():Observable<Servicios1[]>{
    return this.http.get<Servicios1[]>(`${baseUrl}`);
  }

  getUsedServicios(idservicio: number){
    return this.http.get<Servicios1[]>(`${baseUrl}?idused=${idservicio}`);
  }

  getListaServConsumActive(q: number):Observable<Servicios1[]>{
    return this.http.get<Servicios1[]>(`${baseUrl}?consumo=${q}`);
  }

  saveServicios(servicios: Servicios1):Observable<Object>{
    return this.http.post(`${baseUrl}`, servicios);
  }

  deleteServicios(idservicio: number): Observable<Object>{
    return this.http.delete(`${baseUrl}/${idservicio}`);
  }

  getListaById(idservicio: number){
    return this.http.get<Servicios1>(`${baseUrl}/${idservicio}`);
  }

  getByIdModulo(idmodulo: number){
    return this.http.get<Servicios1>(`${baseUrl}/modulo/${idmodulo}`)
  }

  updateServicios(servicios: Servicios1):Observable<Object>{
    return this.http.put(`${baseUrl}/${servicios.idservicio}`,servicios);
  }

}
