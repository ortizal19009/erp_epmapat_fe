import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Ptoemision } from '../modelos/ptoemision';
import { environment } from 'src/environments/environment';

const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/ptoemision`;

@Injectable({
  providedIn: 'root'
})

export class PtoemisionService {

  constructor(private http:HttpClient) { }

  public getListaPtoEmision():Observable<Ptoemision[]>{
    return this.http.get<Ptoemision[]>(`${baseUrl}`);    
  }

  getUsedPtoEmision(idptoemision: number){
    return this.http.get<Ptoemision[]>(`${baseUrl}?idused=${idptoemision}`);
  }

  savePtoEmision(ptoemision:Ptoemision):Observable<Object>{
    return this.http.post(`${baseUrl}`,ptoemision);
  }

  deletePtoEmision(idptoemision: number):Observable<Object>{
    return this.http.delete(`${baseUrl}/${idptoemision}`)
  }

  getPtoemisionById(idptoemision: number){
    return this.http.get<Ptoemision>(`${baseUrl}/${idptoemision}`);
  }

  updatePtoEmision(ptoemision: Ptoemision):Observable<Object>{
    return this.http.put(`${baseUrl}/${ptoemision.idptoemision}`,ptoemision);
  }

}
