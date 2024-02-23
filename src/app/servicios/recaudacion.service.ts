import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { Recaudacion } from '../modelos/recaudacion.model';
import { Observable } from 'rxjs';

const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/recaudacion`;

@Injectable({
  providedIn: 'root'
})

export class RecaudacionService {

  constructor(private http:HttpClient) { }

  saveRecaudacion(x: Recaudacion): Observable<Object>{
    return this.http.post(`${baseUrl}`, x);
  }

}
