import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Unicostos } from 'src/app/modelos/contabilidad/unicostos.model';
import { environment } from 'src/environments/environment';

const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/unicostos`;

@Injectable({
  providedIn: 'root'
})

export class UnicostosService {

  constructor(private http: HttpClient) { }

  //Todas ordendas por mes (con sort)
  getAll(): Observable<Unicostos[]> {
    return this.http.get<Unicostos[]>(`${baseUrl}`);
  }

}
