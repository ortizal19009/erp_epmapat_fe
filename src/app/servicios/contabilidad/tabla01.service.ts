import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Tabla01 } from 'src/app/modelos/contabilidad/tabla01.model';
import { environment } from 'src/environments/environment';

const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/tabla01`;

@Injectable({
   providedIn: 'root',
})

export class Tabla01Service {

   constructor(private http: HttpClient) { }

   getListaTabla01(): Observable<Tabla01[]> {
      return this.http.get<Tabla01[]>(baseUrl);
   }

   saveCertiPresu(tabla01: any) {
      return this.http.post(`${baseUrl}`, tabla01);
   }

   getById(idtabla01: number) {
      return this.http.get<Tabla01>(baseUrl + "/" + idtabla01);
   }

   updateCerti(idtabla01: number, tabla01: Tabla01): Observable<Object> {
      return this.http.put(`${baseUrl}/${idtabla01}`, tabla01);
   }

   deleteTabla01(idtabla01: number) {
      return this.http.delete(`${baseUrl}/${idtabla01}`);
   }

}