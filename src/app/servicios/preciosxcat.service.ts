import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Preciosxcat } from '../modelos/preciosxcat.model';
import { environment } from 'src/environments/environment';

const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/pliego`;

@Injectable({
  providedIn: 'root'
})

export class PreciosxcatService {

  constructor(private http:HttpClient) { }

  getListaPrecioxCat():Observable<Preciosxcat[]>{
    return this.http.get<Preciosxcat[]>(`${baseUrl}`);
  }

  savePreciosxCat(precioxcat: Preciosxcat):Observable<Object>{
    return this.http.post(`${baseUrl}`,precioxcat);
  }

  deletePrecioxCat(idprecioxcat: number): Observable<Object>{
    return this.http.delete(`${baseUrl}/${idprecioxcat}`);
  }

  getByIdprecioxcat(idprecioxcat: number){
    return this.http.get<Preciosxcat>(`${baseUrl}/${idprecioxcat}`)
  }
  
  getPrecioxCatQuery(idcategoria_categorias: number, dm3:number, hm3:number){
    return this.http.get<Preciosxcat>(`${baseUrl}?categoria=${idcategoria_categorias}&dm3=${dm3}&hm3=${hm3}`);
  }

  getConsumo(idcategoria: number, m3:number){
    return this.http.get<Preciosxcat>(`${baseUrl}/consumo?idcategoria=${idcategoria}&m3=${m3}`);
  }

}
