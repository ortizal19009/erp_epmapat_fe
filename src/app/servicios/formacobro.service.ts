import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Formacobro } from '../modelos/formacobro.model';
import { environment } from 'src/environments/environment';
import { HttpClient } from '@angular/common/http';

const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/formacobro`;

@Injectable({
  providedIn: 'root'
})

export class FormacobroService {

  constructor(private http: HttpClient) { }

  getAll(): Observable<Formacobro[]> {
    return this.http.get<Formacobro[]>(`${baseUrl}`);
  }

}
