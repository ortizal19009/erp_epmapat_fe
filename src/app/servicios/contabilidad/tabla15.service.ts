import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Tabla15 } from 'src/app/modelos/contabilidad/tabla15.model';
import { environment } from 'src/environments/environment';

const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/tabla15`;

@Injectable({
   providedIn: 'root',
})

export class Tabla15Service {

   constructor(private http: HttpClient) { }

   getListaTabla15(): Observable<Tabla15[]> {
    return this.http.get<Tabla15[]>(baseUrl);
  }

   saveCertiPresu(tabla15: any) {
      return this.http.post(`${baseUrl}`, tabla15);
   }

   getById(idtabla15: number) {
      return this.http.get<Tabla15>(baseUrl + "/" + idtabla15);
    }

   updateCerti(idtabla15: number, tabla15: Tabla15): Observable<Object> {
      return this.http.put(`${baseUrl}/${idtabla15}`, tabla15);
   }

   deleteTabla15(idtabla15: number) {
      return this.http.delete(`${baseUrl}/${idtabla15}`);
   }

}