import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PersoneriaJuridica } from '../modelos/personeria-juridica';
import { environment } from 'src/environments/environment';

const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/personeriajuridica`;

@Injectable({
  providedIn: 'root'
})

export class PersoneriaJuridicaService {

  constructor(private http:HttpClient) {  }

  getListaPersoneriaJuridica():Observable<PersoneriaJuridica[]>{
    return this.http.get<PersoneriaJuridica[]>(`${baseUrl}`);
  }

}
