import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Repoxopcion } from 'src/app/modelos/administracion/repoxopcion.model';
import { environment } from 'src/environments/environment';

const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/repoxopcion`;

@Injectable({
   providedIn: 'root'
})

export class RepoxopcionService {

   constructor(private http: HttpClient) { }

   // Busca repoxopcion
   buscaRepoxopcion(codigo: string, opcion: string, nombre: string): Observable<Repoxopcion[]> {
      return this.http.get<Repoxopcion[]>(`${baseUrl}/busca?codigo=${codigo}&opcion=${opcion}&nombre=${nombre}`);
   }

   // Datalist de Repoxopcion por código
   datalist(codigo: string): Observable<Repoxopcion[]> {
      return this.http.get<Repoxopcion[]>(`${baseUrl}/datalist?codigo=${codigo}`);
   }

   // Busca los repoxopcion de un codigo
   porCodigo(codigo: string): Observable<Repoxopcion[]> {
      return this.http.get<Repoxopcion[]>(`${baseUrl}/codigo?codigo=${codigo}`);
   }

   //Valida codigo
   valCodigo(codigo: string): Observable<boolean> {
      return this.http.get<boolean>(`${baseUrl}/valcodigo/${encodeURIComponent(codigo)}`);
   }

   //Valida nombre
   valNombre(nombre: string): Observable<boolean> {
      return this.http.get<boolean>(`${baseUrl}/valnombre/${encodeURIComponent(nombre)}`);
   }

   //Guarda nuevo
   saveRepoxopcion(repoxopcion: Repoxopcion): Observable<Repoxopcion> {
      return this.http.post<Repoxopcion>(baseUrl, repoxopcion);
   }

   //Actualiza
   updateRepoxopcion(idrepoxopcion: number, repoxopcion: Repoxopcion): Observable<Repoxopcion> {
      return this.http.put<Repoxopcion>(baseUrl + "/" + idrepoxopcion, repoxopcion);
   }

   //Elimina
   deleteRepoxopcion(idrepoxopcion: number) {
      return this.http.delete(`${baseUrl}/${idrepoxopcion}`);
   }

}
