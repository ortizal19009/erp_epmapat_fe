import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Presupue } from 'src/app/modelos/contabilidad/presupue.model';
import { environment } from 'src/environments/environment';

const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/presupue`;

@Injectable({
   providedIn: 'root'
})

export class PresupueService {

   constructor(private http: HttpClient) { }

   getCodpar(tippar: number, codpar: String) {
      return this.http.get<Presupue[]>(`${baseUrl}?tippar=${tippar}&codpar=${codpar}`);
   }

   getTippar(tippar: number) {
      return this.http.get<Presupue[]>(`${baseUrl}?tippar=${tippar}`);
   }

   getCodNom(tippar: number, nompar: String) {
      return this.http.get<Presupue[]>(`${baseUrl}?tippar=${tippar}&nompar=${nompar}`);
   }

   getByCodigoI(codpar: String) {
      return this.http.get<Presupue[]>(`${baseUrl}?codpar=${codpar}`);
   }

   getByNombreI(nompar: String): Observable<any> {
      return this.http.get<Presupue[]>(`${baseUrl}?nompar=${nompar}`);
   }

   // Partidas de un partida del clasificador
   getClasificador(codigo: String) {
      return this.http.get<Presupue[]>(`${baseUrl}/clasificador?codigo=${codigo}`);
   }

   getById(intpre: number) {
      return this.http.get<Presupue>(baseUrl + "/" + intpre);
   }

   getCodNomt(tippar: number, codpar: String, nompar: String) {
      return this.http.get<Presupue[]>(`${baseUrl}?tippar=${tippar}&codpar=${codpar}&nompar=${nompar}`);
   }

   getListaPresupue(): Observable<Presupue[]> {
      return this.http.get<Presupue[]>(baseUrl);
   }

   getByCodigoG(codpar: String) {
      console.log(`${baseUrl}?codpar=${codpar}`)
      return this.http.get<Presupue[]>(`${baseUrl}?codpar=${codpar}`);
   }

   getByNombreG(nompar: String): Observable<any> {
      return this.http.get<Presupue[]>(`${baseUrl}?nompar=${nompar}`);
   }

   getTotalCodpar(tippar: number, codpar: String) {
      return this.http.get<number>(`${baseUrl}/inicia?tippar=${tippar}&codpar=${codpar}`);
   }

   //
   getAllPresupue(): Observable<Presupue[]> {
      return this.http.get<Presupue[]>(`${baseUrl}`);
   }

   //Partidas por codpar para el datalist
   findByCodpar(tippar: number, codpar: string) {
      return this.http.get<Presupue[]>(`${baseUrl}/codpar?tippar=${tippar}&codpar=${codpar}`);
   }

   updatePresupue(intpre: number, presupue: Presupue): Observable<Object> {
      return this.http.put(`${baseUrl}/${presupue.intpre}`, presupue);
   }

   deletePreingreso(intpre: number): Observable<Object> {
      return this.http.delete(`${baseUrl}/${intpre}`);
   }

   updatePregasto(intpre: number, presupue: Presupue): Observable<Object> {
      return this.http.put(`${baseUrl}/${presupue.intpre}`, presupue);
   }

   deletePregasto(intpre: number): Observable<Object> {
      return this.http.delete(`${baseUrl}/${intpre}`);
   }


}
