import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Acceso } from 'src/app/modelos/administracion/acceso.model';
import { environment } from 'src/environments/environment';

const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/acceso`;

@Injectable({
  providedIn: 'root'
})
export class AccesoService {


  constructor(private http: HttpClient) { }

  getAcceso(): Observable<Acceso[]> {
    return this.http.get<Acceso[]>(baseUrl);
  }
}
