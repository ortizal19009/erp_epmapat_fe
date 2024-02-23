import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Facxrecauda } from '../modelos/facxrecauda.model';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/facxrecauda`;

@Injectable({
  providedIn: 'root'
})

export class FacxrecaudaService {

  constructor( private http:HttpClient ) { }

  save(x: Facxrecauda): Observable<Object>{
    return this.http.post(`${baseUrl}`, x);
  }

}
