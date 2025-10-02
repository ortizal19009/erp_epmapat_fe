import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Tpreclamo } from '../modelos/tpreclamo.model';
import { environment } from 'src/environments/environment';

const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/tpreclamo`;

@Injectable({
  providedIn: 'root'
})

export class TpreclamoService {

  constructor(private http: HttpClient) { }
  
  getAll(): Observable<Tpreclamo[]> {
    return this.http.get<Tpreclamo[]>(baseUrl);
  }

  get(idtpidreclamo: number){
    return this.http.get<Tpreclamo>(baseUrl+"/"+idtpidreclamo);
  }

  nuevo(Tpreclamo: Tpreclamo):Observable<Object>{
    return this.http.post(`${baseUrl}`, Tpreclamo);
  }
  
  delete(idtpidreclamo: number): Observable<Object>{
    return this.http.delete(`${baseUrl}/${idtpidreclamo}`);
  }

  update(Tpreclamo: Tpreclamo):Observable<Object>{
    return this.http.put(`${baseUrl}/${Tpreclamo.idtpreclamo}`,Tpreclamo);
  }

  findByNombre(nombre: any): Observable<Tpreclamo[]> {
    return this.http.get<Tpreclamo[]>(`${baseUrl}?nombre=${nombre}`);
  }

}
