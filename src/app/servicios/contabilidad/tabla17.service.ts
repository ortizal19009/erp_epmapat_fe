import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Tabla17 } from 'src/app/modelos/contabilidad/tabla17.model';
import { environment } from 'src/environments/environment';

const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/tabla17`;

@Injectable({
   providedIn: 'root',
})

export class Tabla17Service {

   constructor(private http: HttpClient) { }

   getListaTabla17(): Observable<Tabla17[]> {
      return this.http.get<Tabla17[]>(baseUrl);
   }

   getTabla17(): Observable<Tabla17[]> {
      return this.http.get<Tabla17[]>(baseUrl+"/retenciones");
   }

   saveCertiPresu(tabla17: any) {
      return this.http.post(`${baseUrl}`, tabla17);
   }

   getById(idtabla17: number) {
      return this.http.get<Tabla17>(baseUrl + "/" + idtabla17);
   }

   updateCerti(idtabla17: number, tabla17: Tabla17): Observable<Object> {
      return this.http.put(`${baseUrl}/${idtabla17}`, tabla17);
   }

   deleteTabla17(idtabla17: number) {
      return this.http.delete(`${baseUrl}/${idtabla17}`);
   }

}