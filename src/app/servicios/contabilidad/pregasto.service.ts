import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { Presupue } from 'src/app/modelos/contabilidad/presupue.model';
import { environment } from 'src/environments/environment';

const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/pregastos`;

@Injectable({
   providedIn: 'root'
})

export class PregastoService {

   constructor(private http: HttpClient) { }

   //Busca por Tipo, Código o Nombre
   getByTipoCodigoyNombre(tippar: number, codpar: String, nompar: String) {
      return this.http.get<Presupue[]>(`${baseUrl}?tippar=${tippar}&codpar=${codpar}&nompar=${nompar}`);
   }

   getPartgasto(codpar: String, nompar: String) {
      return this.http.get<Presupue[]>(`${baseUrl}?codpar=${codpar}&nompar=${nompar}`);
   }

   getListaPresupue(): Observable<Presupue[]> {
      return this.http.get<Presupue[]>(baseUrl);
   }

   //Validar codpar
   getByCodigo(codpar: String) {
      return this.http.get<Presupue[]>(`${baseUrl}/valcodpar?codpar=${codpar}`);
   }

   getByNombreG(nompar: String): Observable<any> {
      return this.http.get<Presupue[]>(`${baseUrl}?nompar=${nompar}`);
   }

   //Cuenta por Actividad
   countByEstrfunc(idestrfunc: number) {
      return this.http.get<Number>(`${baseUrl}/count?idestrfunc=${idestrfunc}`);
   }

   //Partidas por Actividad
   getByActividad(idestrfunc: number) {
      return this.http.get<Presupue[]>(`${baseUrl}/actividad?idestrfunc=${idestrfunc}`);
   }

   getById(idpresupue: number) {
      return this.http.get<Presupue>(baseUrl + "/" + idpresupue);
   }

   savePregasto(pregas: Presupue): Observable<Object> {
      return this.http.post(baseUrl, pregas);
   }

   updatePregasto(idpresupue: number, Presupue: Presupue): Observable<Object> {
      // return this.http.put(`${baseUrl}/${idpresupue}`, Presupue);
      return this.http.put(baseUrl + "/" + idpresupue, Presupue);
   }

   deletePregasto(idpresupue: number): Observable<Object> {
      return this.http.delete(`${baseUrl}/${idpresupue}`);
   }

}
