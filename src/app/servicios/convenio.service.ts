import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Convenios } from '../modelos/convenios.model';
import { environment } from 'src/environments/environment';

const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/convenios`;

@Injectable({
  providedIn: 'root'
})

export class ConvenioService {

  constructor(private http: HttpClient) { }

  getAll(): Observable<Convenios[]> {
    return this.http.get<Convenios[]>(baseUrl);
  }

  getConveniosQuery(dnro: number, hnro: number){
    return this.http.get<Convenios>(`${baseUrl}?dnro=${dnro}&hnro=${hnro}`);
  }

  getNroconvenio(nroconvenio: number ){
    return this.http.get<Convenios>(`${baseUrl}?nroconvenio=${nroconvenio}`);
  }

  getById(idconvenio: number): Observable<Convenios>{
    return this.http.get<Convenios>(`${baseUrl}/${idconvenio}`);
  }

  saveConvenio(conv: Convenios):Observable<Object>{
    return this.http.post(baseUrl, conv);
  }

  update(id: number, conv: Convenios): Observable<Object>{
    return this.http.put(`${baseUrl}/${id}`, conv);
  }

  deleteConvenio(idconvenio: number): Observable<Object>{
    return this.http.delete(`${baseUrl}/${idconvenio}`);
  }

}
