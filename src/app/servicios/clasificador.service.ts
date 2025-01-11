import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Clasificador } from '../modelos/clasificador.model';
import { environment } from 'src/environments/environment';

const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/clasificador`;

@Injectable({
   providedIn: 'root'
})

export class ClasificadorService {

   constructor(private http: HttpClient) { }

   getPartidas(codpar: String, nompar: String) {
      return this.http.get<Clasificador[]>(`${baseUrl}?codpar=${codpar}&nompar=${nompar}`);
   }

   getByCodpar(codpar: String) {
      return this.http.get<Clasificador>(`${baseUrl}/codpar?codpar=${codpar}`);
   }

   getByCodigo(codpar: String) {
      return this.http.get<Clasificador[]>(`${baseUrl}?codpar=${codpar}`);
   }

   getByNombre(nompar: String) {
      return this.http.get<Clasificador[]>(`${baseUrl}?nompar=${nompar}`);
   }

   //Partidas de Gasto por Codigo o Nombre (un solo campo)
   getPartidasG(codigoNombre: String): Observable<any> {
      return this.http.get<Clasificador[]>(`${baseUrl}/partidasG?codigoNombre=${codigoNombre}`);
   }

   getParingreso(codpar: String, nompar: String) {
      return this.http.get<Clasificador[]>(`${baseUrl}/paringreso?codpar=${codpar}&nompar=${nompar}`);
   }

   getPargasto(codpar: String, nompar: String) {
      return this.http.get<Clasificador[]>(`${baseUrl}?codpar=${codpar}&nompar=${nompar}`);
   }

   //Validar codpar
   valCodpar(codpar: String) {
      return this.http.get<boolean>(`${baseUrl}/valCodpar?codpar=${codpar}`);
   }

   saveClasificador(clasificador: Clasificador): Observable<Object> {
      return this.http.post(baseUrl, clasificador);
   }

   deleteClasificador(intcla: number): Observable<Object> {
      return this.http.delete(`${baseUrl}/${intcla}`);
   }

   getById(intcla: number) {
      return this.http.get<Clasificador>(baseUrl + "/" + intcla);
   }

   update(intcla: number, clasificador: Clasificador): Observable<Object> {
      return this.http.put(baseUrl + "/" + intcla, clasificador);
   }

   getByDescripcion(descripcion: String) {
      return this.http.get<Clasificador[]>(`${baseUrl}?descripcion=${descripcion}`);
   }

   updateClasificador(clasificador: Clasificador): Observable<Object> {
      return this.http.put(`${baseUrl}/${clasificador.intcla}`, clasificador);
   }

   getByDato(dato: String) {
      return this.http.get<Clasificador>(`${baseUrl}?consulta=${dato}`);
   }

}
