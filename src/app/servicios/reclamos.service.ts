import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Reclamos } from '../modelos/reclamos';
import { environment } from 'src/environments/environment';

const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/reclamos`;

@Injectable({
  providedIn: 'root'
})

export class ReclamosService {
  
  constructor(private http:HttpClient) { }

  getListaReclamos():Observable<Reclamos[]>{
    return this.http.get<Reclamos[]>(`${baseUrl}`);
  }

  saveReclamos(reclamos: Reclamos):Observable<Object>{
    return this.http.post(`${baseUrl}`,reclamos);
  }
  
  deleteReclamos(idreclamo: number): Observable<Object>{
    return this.http.delete(`${baseUrl}/${idreclamo}`);
  }

  getListaById(idreclamo: number){
    return this.http.get<Reclamos>(`${baseUrl}/${idreclamo}`);
  }

  updateReclamos(reclamos: Reclamos):Observable<Object>{
    return this.http.put(`${baseUrl}/${reclamos.idreclamo}`,reclamos);
  }

}
