import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Ubicacionm } from '../modelos/ubicacionm.model';
import { environment } from 'src/environments/environment';

const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/ubicacionm`;

@Injectable({
  providedIn: 'root'
})

export class UbicacionmService {
  
  constructor(private http: HttpClient) { }
  
  getAll(): Observable<Ubicacionm[]> {
    return this.http.get<Ubicacionm[]>(baseUrl);
  }

  getById(idubicacionm: number){
    return this.http.get<Ubicacionm>(baseUrl+"/"+idubicacionm);
  }

  getById2(id: number): Observable<Ubicacionm>{
    return this.http.get<Ubicacionm>(`${baseUrl}/${id}`);
  }

  nuevo(ubicacionm: Ubicacionm):Observable<Object>{
    return this.http.post(`${baseUrl}`, ubicacionm);
  }
  
  delete(idubicacionm: number): Observable<Object>{
    return this.http.delete(`${baseUrl}/${idubicacionm}`);
  }


  findByNombre(nombre: any): Observable<Ubicacionm[]> {
    return this.http.get<Ubicacionm[]>(`${baseUrl}?nombre=${nombre}`);
  }

  update(id: number, ubicacionm: Ubicacionm): Observable<Object>{
    return this.http.put(`${baseUrl}/${id}`, ubicacionm);
  }
  
}
