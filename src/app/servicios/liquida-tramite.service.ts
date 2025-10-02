import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { LiquidaTramite } from '../modelos/liquida-tramite';
import { environment } from 'src/environments/environment';

const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/liquidatramite`;

@Injectable({
  providedIn: 'root'
})

export class LiquidaTramiteService {
  
  constructor(private http:HttpClient) { }

  getListaLiquidaTramite():Observable<LiquidaTramite[]>{
    return this.http.get<LiquidaTramite[]>(`${baseUrl}`);
  }

  saveLiquidaTramite(liquidaTramite: LiquidaTramite):Observable<Object>{
    return this.http.post(`${baseUrl}`,liquidaTramite);
  }

  getLiquidaTramiteByIdTramite(idtramite: number){
    return this.http.get<LiquidaTramite>(`${baseUrl}/idtramite/${idtramite}`)
  }

}
