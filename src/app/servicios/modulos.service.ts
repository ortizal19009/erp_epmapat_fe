import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Modulos } from '../modelos/modulos.model';
import { environment } from 'src/environments/environment';

const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/modulos`;

@Injectable({
  providedIn: 'root'
})

export class ModulosService {

  constructor(private http:HttpClient) { }

  getListaModulos(){
    return this.http.get<Modulos[]>(`${baseUrl}`);
  }

  getTwoModulos():Observable<Modulos[]>{
    return this.http.get<Modulos[]>(`${baseUrl}/s_modulos`)
  }

  getById(idmodulo: number) {
    return this.http.get<any>(baseUrl + "/" + idmodulo);
  }

}
