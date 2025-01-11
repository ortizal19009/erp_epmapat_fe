import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Ifinan } from 'src/app/modelos/contabilidad/ifinan.model';
import { environment } from 'src/environments/environment';


const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/ifinan`;

@Injectable({
  providedIn: 'root'
})
export class IfinanService {

  constructor(private http: HttpClient) { }

  //Instituciones financieras: todas ordendas por nomifinan (con sort)
  getListaIfinans(): Observable<Ifinan[]> {
    return this.http.get<Ifinan[]>(`${baseUrl}`);
    // return this.http.get<Ifinan[]>( `${baseUrl}/ifinans`); 
  }

  // getListaIfinancieras():Observable<Ifinan[]>{
  //   return this.http.get<Ifinan[]>( baseUrl );
  // }

  //Valida Nomifinan
  valNomifinan(nomifinan: string): Observable<boolean> {
    return this.http.get<boolean>(`${baseUrl}/valNomifinan?nomifinan=${nomifinan}`);
  }

  //Valida Codifinan
  valCodifinan(codifinan: string): Observable<boolean> {
    return this.http.get<boolean>(`${baseUrl}/valCodifinan?codifinan=${codifinan}`);
  }

  saveIfinancieras(finan: Ifinan): Observable<Object> {
    return this.http.post(baseUrl, finan);
  }

  // deleteIfinancieras(idifinan: number): Observable<Object> {
  //   return this.http.delete('${baseUrl}/${idifinan}');
  // }

  deleteIfinan(idifinan: number): Observable<Object> {
    return this.http.delete(`${baseUrl}/${idifinan}`);
 }

  getById(idifinan: number) {
    return this.http.get<Ifinan>(baseUrl + "/" + idifinan);
  }

  // update(id: number, finan: Ifinan): Observable<Object> {
  //   return this.http.put(`${baseUrl}/${id}`, finan);
  // }

  update(id: number, ifinan: Ifinan): Observable<Object> {
    return this.http.put(baseUrl + "/" + id, ifinan);
 }

  getIfinanByDescripcion(descripcion: String) {
    return this.http.get<Ifinan[]>('${baseUrl}?nomifinan=${nomifinan}');
  }

  // updateIfinanciera(ifinan: Ifinan): Observable<Object> {
  //   return this.http.put('${baseUrl}/${ifinan.idifinan}', ifinan);
  // }

}
