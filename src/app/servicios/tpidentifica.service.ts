import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Tpidentifica } from '../modelos/tpidentifica.model';
import { environment } from 'src/environments/environment';

const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/tpidentifica`;

@Injectable({
  providedIn: 'root'
})

export class TpidentificaService {

  constructor(private http: HttpClient) { }

  getListaTpIdentifica():Observable<Tpidentifica[]>{
    return this.http.get<Tpidentifica[]>(baseUrl);
  }

  getAll(): Observable<Tpidentifica[]> {
    return this.http.get<Tpidentifica[]>(baseUrl);
  }

  get(idTpidentifica: number){
    return this.http.get<Tpidentifica>(baseUrl+"/"+idTpidentifica);
  }

  nuevo(Tpidentifica: Tpidentifica):Observable<Object>{
    return this.http.post(`${baseUrl}`, Tpidentifica);
  }
  
  delete(idtpidentifica: number): Observable<Object>{
    return this.http.delete(`${baseUrl}/${idtpidentifica}`);
  }

  update(Tpidentifica: Tpidentifica):Observable<Object>{
    return this.http.put(`${baseUrl}/${Tpidentifica.idtpidentifica}`,Tpidentifica);
  }

  findByNombre(nombre: any): Observable<Tpidentifica[]> {
    return this.http.get<Tpidentifica[]>(`${baseUrl}?nombre=${nombre}`);
  }

}
