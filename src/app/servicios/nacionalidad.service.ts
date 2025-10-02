import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Nacionalidad } from '../modelos/nacionalidad';
import { environment } from 'src/environments/environment';

const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/nacionalidades`;

@Injectable({
  providedIn: 'root'
})

export class NacionalidadService {

  constructor(private http:HttpClient) { }

  getListaNacionalidades():Observable<Nacionalidad[]>{
    return this.http.get<Nacionalidad[]>( baseUrl );
  }
  
  saveNacionalidad(nac: Nacionalidad):Observable<Object>{
    return this.http.post(baseUrl,nac);
  }

  deleteNacionalidad(idnacionalidad: number): Observable<Object>{
    return this.http.delete(`${baseUrl}/${idnacionalidad}`);
  }

  getById(idnacionalidad: number){
    return this.http.get<Nacionalidad>(baseUrl+"/"+idnacionalidad);
  }

  updateNacionalidad(nacionalidad: Nacionalidad):Observable<Object>{
    return this.http.put(`${baseUrl}/${nacionalidad.idnacionalidad}`, nacionalidad);
  }

  getNacionalidadByDescripcion(descripcion: String){
    return this.http.get<Nacionalidad[]>(`${baseUrl}?descripcion=${descripcion}`);
  }

}
