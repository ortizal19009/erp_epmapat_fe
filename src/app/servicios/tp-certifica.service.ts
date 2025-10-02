import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { TpCertifica } from '../modelos/tp-certifica';
import { environment } from 'src/environments/environment';

const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/tpcertifica`;

@Injectable({
  providedIn: 'root'
})

export class TpCertificaService {

  constructor(private http:HttpClient) { }

  getListaTpCertifica():Observable<TpCertifica[]>{
    return this.http.get<TpCertifica[]>(`${baseUrl}`);
  }

  getUsedTpCertifica(idtpcertifica: number){
    return this.http.get<TpCertifica[]>(`${baseUrl}?idused=${idtpcertifica}`);
  }

  saveTpCertifica(tpcertifica: TpCertifica):Observable<Object>{
    return this.http.post(`${baseUrl}`,tpcertifica);
  }

  deleteTpCertifica(idtpcertifica: number): Observable<Object>{
    return this.http.delete(`${baseUrl}/${idtpcertifica}`);
  }

  getListaById(idtpcertifica: number){
    return this.http.get<TpCertifica>(`${baseUrl}/${idtpcertifica}`);
  }

  updateTpCertifica(tpcertifica: TpCertifica):Observable<Object>{
    return this.http.put(`${baseUrl}/${tpcertifica.idtpcertifica}`,tpcertifica);
  }

}
