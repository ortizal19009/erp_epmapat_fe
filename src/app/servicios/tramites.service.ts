import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Tramites } from '../modelos/tramites';
import { environment } from 'src/environments/environment';

const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/tramites`;

@Injectable({
   providedIn: 'root'
})

export class TramitesService {

   constructor(private http: HttpClient) { }

   getListaTramites(): Observable<Tramites[]> {
      return this.http.get<Tramites[]>(`${baseUrl}`);
   }

   saveTramite(tramite: Tramites): Observable<Object> {
      return this.http.post(`${baseUrl}`, tramite);
   }

   deleteTramite(idtramite: number): Observable<Object> {
      return this.http.delete(`${baseUrl}/${idtramite}`);
   }

   getTramiteById(idtramite: number) {
      return this.http.get<Tramites>(`${baseUrl}/${idtramite}`);
   }

   updateTramite(tramite: Tramites): Observable<Object> {
      return this.http.put(`${baseUrl}/${tramite.idtramite}`, tramite);
   }
   //Trámites por Tipo de Trámite
   getByTpTramite(idtptramite: number) {
      return this.http.get<Tramites[]>(`${baseUrl}/tptramite/${idtptramite}`);
   }

   getByDescripcion(descripcion: String) {
      return this.http.get<Tramites[]>(`${baseUrl}/descripcion/${descripcion}`);
   }

   getByFeccrea(feccrea: String): Observable<Object> {
      return this.http.get<Tramites[]>(`${baseUrl}/feccrea/${feccrea}`);
   }
   //Trámites por Cliente
   getByIdcliente(idcliente: number) {
      return this.http.get<Tramites[]>(`${baseUrl}/idcliente/${idcliente}`);
   }

}
