import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Estadom } from '../modelos/estadom.model';
import { environment } from 'src/environments/environment';

const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/estadom`;

@Injectable({
  providedIn: 'root'
})

export class EstadomService {

  constructor(private http: HttpClient) { }
  
  getListEstadom(): Observable<Estadom[]> {
    return this.http.get<Estadom[]>(`${baseUrl}`);
  }

  saveEstadom(estadom: Estadom):Observable<Object>{
    return this.http.post(`${baseUrl}`, estadom);
  }
  
  deleteEstadom(idestadom: number): Observable<Object>{
    return this.http.delete(`${baseUrl}/${idestadom}`);
  }

  getListaById(idestadom: number){
    return this.http.get<Estadom>(baseUrl+"/"+idestadom);
  }

  updateEstadom(estadom: Estadom):Observable<Object>{
    return this.http.put(`${baseUrl}/${estadom.idestadom}`,estadom);
  }
}
