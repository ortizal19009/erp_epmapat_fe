import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Tipotramite } from '../modelos/tipotramite.model';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/tipotramite`;

@Injectable({
  providedIn: 'root'
})

export class TipoTramiteService {

  constructor(private http:HttpClient) { }
  
  getListaTipoTramite():Observable<Tipotramite[]>{
    return this.http.get<Tipotramite[]>(`${baseUrl}`);
  }
  
  saveTipoTramite(tipotramite: Tipotramite):Observable<Object>{
    return this.http.post(`${baseUrl}`,tipotramite);
  }
  
  deleteTipoTramite(idtipotramite: number): Observable<Object>{
    return this.http.delete(`${baseUrl}/${idtipotramite}`);
  }
  
  getListaById(idtipotramite: number){
    return this.http.get<Tipotramite>(`${baseUrl}/${idtipotramite}`);
  }
  
  updateTipoTramite(tipotramite: Tipotramite):Observable<Object>{
    return this.http.put(`${baseUrl}/${tipotramite.idtipotramite}`,tipotramite);
  }
  
}
