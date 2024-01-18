import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Usoitems } from '../modelos/usoitems.model';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/usoitems`;

@Injectable({
   providedIn: 'root'
})

export class UsoitemsService {

   constructor(private http: HttpClient) { }

   getAll(): Observable<Usoitems[]> {
      return this.http.get<Usoitems[]>(baseUrl);
   }

   getByIdmodulo(idmodulo: number) {
      return this.http.get<Usoitems>(`${baseUrl}/modulo/${idmodulo}`)
   }

   getUsoitemById(idusoitems: number) {
      return this.http.get<Usoitems>(`${baseUrl}/${idusoitems}`);
   }

   //Validar por Módulo y nombre
   getByNombre(idmodulo: number, descripcion: String): Observable<any> {
      return this.http.get<Usoitems>(`${baseUrl}?idmodulo=${idmodulo}&descripcion=${descripcion}`);
   }

   saveUso(uso: Usoitems): Observable<Object> {
      return this.http.post(baseUrl, uso);
   }

   updateUso(idusoitems: number, uso: Usoitems): Observable<Object> {
      return this.http.put(baseUrl + "/" + idusoitems, uso);
   }

   deleteUsoitem(idusoitems: number): Observable<Object> {
      return this.http.delete(`${baseUrl}/${idusoitems}`);
   }

}
