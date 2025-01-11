import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Tabla5_concep } from 'src/app/modelos/contabilidad/tabla5_concep.model';
import { environment } from 'src/environments/environment';

const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/tabla5_concep`;

@Injectable({
   providedIn: 'root',
})

export class Tabla5_concepService {

   constructor(private http: HttpClient) { }

   getTabla5c_bie(): Observable<Tabla5_concep[]> {
      return this.http.get<Tabla5_concep[]>(baseUrl + "/bienes");
   }

   getTabla5c_ser(): Observable<Tabla5_concep[]> {
      return this.http.get<Tabla5_concep[]>(baseUrl + "/servicios");
   }

   getTabla5c_100(): Observable<Tabla5_concep[]> {
      return this.http.get<Tabla5_concep[]>(baseUrl + "/cien");
   }


   saveTabla5c(tabla5Concep: any) {
      return this.http.post(`${baseUrl}`, tabla5Concep);
   }

   getById(idtabla5c: number) {
      return this.http.get<Tabla5_concep>(baseUrl + "/" + idtabla5c);
   }

   getByIdtabla5c(idtabla5c: number) {
      return this.http.get<Tabla5_concep[]>(`${baseUrl}/${idtabla5c}`);
   }


   updateTabla5c(idtabla5c: number, tabla5Concep: Tabla5_concep): Observable<Object> {
      return this.http.put(`${baseUrl}/${idtabla5c}`, tabla5Concep);
   }

   deleteTabla5_concep(idtabla5c: number) {
      return this.http.delete(`${baseUrl}/${idtabla5c}`);
   }

}