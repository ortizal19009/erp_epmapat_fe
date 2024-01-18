import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Intereses } from '../modelos/intereses';
import { environment } from 'src/environments/environment';

const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/intereses`;

@Injectable({
   providedIn: 'root'
})

export class InteresesService {

   constructor(private http: HttpClient) { }

   getListaIntereses(): Observable<Intereses[]> {
      return this.http.get<Intereses[]>(`${baseUrl}`);
   }

   //Validar por Anio y Mes
   getByAnioMes(anio: number, mes: number): Observable<any> {
      return this.http.get<Intereses>(`${baseUrl}?anio=${anio}&mes=${mes}`);
   }

   //Busca el Último
   getUltimo(): Observable<any> {
      return this.http.get<Intereses>(`${baseUrl}/ultimo`);
   }

   saveIntereses(intereses: Intereses): Observable<Object> {
      return this.http.post(`${baseUrl}`, intereses);
   }

   deleteInteres(idinteres: number) {
      return this.http.delete(`${baseUrl}/${idinteres}`);
   }

   getListaById(idinteres: number) {
      return this.http.get<Intereses>(`${baseUrl}/${idinteres}`);
   }

   // updateIntereses(intereses: Intereses): Observable<Object> {
   //    return this.http.put(`${baseUrl}/${intereses.idinteres}`, intereses);
   // }

   updateInteres(idinteres: number, interes: Intereses): Observable<Object> {
      return this.http.put(baseUrl + "/" + idinteres, interes);
    }
}
