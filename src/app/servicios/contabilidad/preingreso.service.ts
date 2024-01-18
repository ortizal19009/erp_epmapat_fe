import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { Presupue } from 'src/app/modelos/contabilidad/presupue.model';
import { environment } from 'src/environments/environment';

const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/preingresos`;

@Injectable({
   providedIn: 'root'
})

export class PreingresoService {

   constructor(private http: HttpClient) { }

   getParingreso(codpar: String, nompar: String) {
      let buscanompar = nompar.toLowerCase();
      return this.http.get<Presupue[]>(`${baseUrl}/paringreso?codpar=${codpar}&nompar=${buscanompar}`);
   }

   //Busca por Código o Nombre
   getByCodigoNombre(codigoNombre: String) {
      return this.http.get<Presupue[]>(`${baseUrl}/codigoNombre?codigoNombre=${codigoNombre}`);
   }

   getByCodigoI(codpar: String) {
      return this.http.get<Presupue[]>(`${baseUrl}?codpar=${codpar}`);
   }
   //Creo que no se usa?
   getByNombreI(nompar: String): Observable<any> {
      return this.http.get<Presupue[]>(`${baseUrl}?nompar=${nompar}`);
   }

   getById(idpresupue: number) {
      return this.http.get<Presupue>(baseUrl + "/" + idpresupue);
   }

   savePreingreso(preingresos: Presupue): Observable<Object> {
      return this.http.post(baseUrl, preingresos);
   }

   updatePreingreso(idpresupue: number, preingresos: Presupue): Observable<Object> {
      return this.http.put(`${baseUrl}/${preingresos.idpresupue}`, preingresos);
   }

   deletePreingreso(idpresupue: number): Observable<Object> {
      return this.http.delete(`${baseUrl}/${idpresupue}`);
   }

}
