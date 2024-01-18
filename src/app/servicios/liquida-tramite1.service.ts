import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { LiquidaTramite1 } from '../modelos/liquida-tramite1';
import { environment } from 'src/environments/environment';

const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/liquidatramite1`;

@Injectable({
  providedIn: 'root'
})

export class LiquidaTramite1Service {

  constructor(private http:HttpClient) { }
  
  getListaLiquidaTramite1():Observable<LiquidaTramite1[]>{
    return this.http.get<LiquidaTramite1[]>(`${baseUrl}`);
  }

  saveLiquidaTramite1(liquidaTramite: LiquidaTramite1):Observable<Object>{
    return this.http.post(`${baseUrl}`,liquidaTramite);
  }

}
