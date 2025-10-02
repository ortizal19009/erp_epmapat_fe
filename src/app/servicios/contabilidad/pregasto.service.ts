import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom, Observable } from 'rxjs';

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
   getPregasto(tippar: number, codpar: String, nompar: String) {
      return this.http.get<Presupue[]>(`${baseUrl}?tippar=${tippar}&codpar=${codpar}&nompar=${nompar}`);
   }
   //Busca la lista de Partidas de Gastos Async
   async getPregastoAsync(tippar: number, codpar: String, nompar: String): Promise<any[]> {
      const resp = await firstValueFrom(this.http.get<any[]>(`${baseUrl}?tippar=${tippar}&codpar=${codpar}&nompar=${nompar}`));
      return resp;
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
   countByEstrfunc(intest: number) {
      return this.http.get<Number>(`${baseUrl}/count?intest=${intest}`);
   }

   //Partidas por Actividad
   getByActividad(intest: number) {
      return this.http.get<Presupue[]>(`${baseUrl}/actividad?intest=${intest}`);
   }

   getById(intpre: number) {
      return this.http.get<Presupue>(baseUrl + "/" + intpre);
   }

   savePregasto(pregas: Presupue): Observable<Object> {
      return this.http.post(baseUrl, pregas);
   }

   updatePregasto(intpre: number, Presupue: Presupue): Observable<Object> {
      return this.http.put(baseUrl + "/" + intpre, Presupue);
   }

   deletePregasto(intpre: number): Observable<Object> {
      return this.http.delete(`${baseUrl}/${intpre}`);
   }

}
