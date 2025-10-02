import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Tipopago } from '../modelos/tipopago.model';
import { environment } from 'src/environments/environment';

const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/tipopago`;

@Injectable({
  providedIn: 'root'
})
export class TipopagoService {

  constructor(private http: HttpClient) { }

  getListTipopago(): Observable<Tipopago[]> {
    return this.http.get<Tipopago[]>(`${baseUrl}`);
  }

  saveTipopago(tipopago: Tipopago):Observable<Object>{
    return this.http.post(`${baseUrl}`,tipopago);
    
  }
  deleteTipopago(idtipopago: number): Observable<Object>{
    return this.http.delete(`${baseUrl}/${idtipopago}`);
  }
  getListaById(idtipopago: number){
    return this.http.get<Tipopago>(baseUrl+"/"+idtipopago);

  }
  updateTipopago(tipopago: Tipopago):Observable<Object>{
    return this.http.put(`${baseUrl}/${tipopago.idtipopago}`,tipopago);
  }
}
