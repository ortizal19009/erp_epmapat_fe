import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom, Observable } from 'rxjs';

import { Presupue } from 'src/app/modelos/contabilidad/presupue.model';
import { environment } from 'src/environments/environment';

const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/preingresos`;

@Injectable({
   providedIn: 'root'
})

export class PreingresoService {

   constructor(private http: HttpClient) { }

   //Busca todas las Partidas de Ingresos 
   getPartidas() {
      let tippar = 1;
      return this.http.get<Presupue[]>(`${baseUrl}/partidas?tippar=${tippar}`);
   }

   //Busca Partidas de Ingresos 
   getParingreso(codpar: String, nompar: String) {
      let buscanompar = nompar.toLowerCase();
      return this.http.get<Presupue[]>(`${baseUrl}/paringreso?codpar=${codpar}&nompar=${buscanompar}`);
   }
   //Busca Partidas de Ingresos Async
   async getParingresoAsync(codpar: String, nompar: String): Promise<any[]> {
      const resp = await firstValueFrom(this.http.get<any[]>(`${baseUrl}/paringreso?codpar=${codpar}&nompar=${nompar}`));
      return resp;
   }

   getTippar(tippar: number) {
      return this.http.get<Presupue[]>(`${baseUrl}?tippar=${tippar}`);
   }

   //Busca por Código o Nombre
   getByCodigoNombre(codigoNombre: String) {
      return this.http.get<Presupue[]>(`${baseUrl}/codigoNombre?codigoNombre=${codigoNombre}`);
   }

   getByCodigoI(codpar: String) {
      return this.http.get<Presupue[]>(`${baseUrl}?codpar=${codpar}`);
   }
   //No se usa?
   getByNombreI(nompar: String): Observable<any> {
      return this.http.get<Presupue[]>(`${baseUrl}?nompar=${nompar}`);
   }

   getById(intpre: number) {
      return this.http.get<Presupue>(baseUrl + "/" + intpre);
   }

   savePreingreso(preingresos: Presupue): Observable<Object> {
      return this.http.post(baseUrl, preingresos);
   }

   updatePreingreso(intpre: number, preingresos: Presupue): Observable<Object> {
      return this.http.put(`${baseUrl}/${preingresos.intpre}`, preingresos);
   }

   deletePreingreso(intpre: number): Observable<Object> {
      return this.http.delete(`${baseUrl}/${intpre}`);
   }

}
