import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Aguatramite } from '../modelos/aguatramite.model';
import { environment } from 'src/environments/environment';

const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/aguatramite`;

@Injectable({
   providedIn: 'root'
})

export class AguatramiteService {

   constructor(private http: HttpClient) { }

   getByTipoTramite(idtipotramite: number, estado: number) {
      let date: Date = new Date();
      let year = date.getFullYear();
      let month = date.getMonth() + 1;
      let day = date.getDate();
      let d = `${year - 1}-${month}-${day}`;
      let h = `${year}-${month}-${day}`;
      return this.http.get<Aguatramite>(`${baseUrl}/tipotramite/${idtipotramite}/${estado}/${d}/${h}`);
   }

   getAll(): Observable<Aguatramite[]> {
      return this.http.get<Aguatramite[]>(baseUrl);
   }

   getByCliente(nombre: String) {
      return this.http.get<Aguatramite>(`${baseUrl}?nombre=${nombre}`);
   }

   getDesdeHasta(desde: number, hasta: number) {
      return this.http.get<Aguatramite>(`${baseUrl}?desde=${desde}&hasta=${hasta}`);
   }

   getById(idaguatramite: number): Observable<Aguatramite> {
      return this.http.get<Aguatramite>(`${baseUrl}/${idaguatramite}`);
   }

   saveAguaTramite(aguatramite: Aguatramite): Observable<Object> {
      return this.http.post(`${baseUrl}`, aguatramite);
   }

   delete(idaguatramite: number): Observable<Object> {
      return this.http.delete(`${baseUrl}/${idaguatramite}`);
   }

   updateAguatramite(aguatramite: Aguatramite): Observable<Object> {
      return this.http.put(`${baseUrl}/${aguatramite.idaguatramite}`, aguatramite);
   }

}
