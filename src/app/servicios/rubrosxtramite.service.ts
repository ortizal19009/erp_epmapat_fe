import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Rubrosxtramite } from '../modelos/rubrosxtramite';
import { environment } from 'src/environments/environment';

const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/rubrosxtramite`;

@Injectable({
  providedIn: 'root'
})

export class RubrosxtramiteService {
  
  constructor(private http:HttpClient) { }
  
  public getRubrosByTramite(idtramite: number){
    return this.http.get<Rubrosxtramite[]>(`${baseUrl}/tramite/${idtramite}`)
  }

  public saveRubrosxTramie(rubxtram: Rubrosxtramite):Observable<Object>{
    return this.http.post(`${baseUrl}`, rubxtram);
  }

}

