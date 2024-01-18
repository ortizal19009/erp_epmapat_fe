import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Estrfunc } from 'src/app/modelos/contabilidad/estrfunc.model';
import { environment } from 'src/environments/environment';

const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/estrfunc`;

@Injectable({
   providedIn: 'root'
})

export class EstrfuncService {

   constructor(private http: HttpClient) { }

   getListaEstrfunc(): Observable<Estrfunc[]> {
      return this.http.get<Estrfunc[]>(baseUrl);
   }

   getByDescripcion(descripcion: String) {
      return this.http.get<Estrfunc[]>(`${baseUrl}?descripcion=${descripcion}`);
   }

   getByDato(dato: String) {
      return this.http.get<Estrfunc>(`${baseUrl}?consulta=${dato}`);
   }

   //Actividad por Codigo o Nombre (un solo campo)
   getCodigoNombre(codigoNombre: String): Observable<any> {
      return this.http.get<Estrfunc[]>(`${baseUrl}/codigoNombre?codigoNombre=${codigoNombre}`);
   }

   //Validar por Código
   getByCodigo(codigo: String): Observable<any> {
      return this.http.get<Estrfunc>(`${baseUrl}?codigo=${codigo}`);
   }

   //Validar por Nombre
   getByNombre(nombre: String): Observable<any> {
      return this.http.get<Estrfunc>(`${baseUrl}?nombre=${nombre}`);
   }

   saveEstrfunc(estrfunc: Estrfunc): Observable<Object> {
      return this.http.post(baseUrl, estrfunc);
   }

   getById(idestrfunc: number) {
      return this.http.get<Estrfunc>(baseUrl + "/" + idestrfunc);
   }

   deleteEstrfunc(idestrfunc: number): Observable<Object> {
      return this.http.delete(`${baseUrl}/${idestrfunc}`);
   }

   updateEstrfun(id: number, estrfunc: Estrfunc): Observable<Object> {
      return this.http.put(baseUrl + "/" + id, estrfunc);
   }

}
