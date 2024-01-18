import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Reformas } from 'src/app/modelos/contabilidad/reformas.model';
import { environment } from 'src/environments/environment';

const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/reformas`;

@Injectable({
   providedIn: 'root'
})

export class ReformasService {

   constructor(private http: HttpClient) { }

   getListaReformas(): Observable<Reformas[]> {
      return this.http.get<Reformas[]>(baseUrl);
   }

   ultimaReforma(): Observable<Reformas> {
      return this.http.get<Reformas>(`${baseUrl}/ultima`);
   }

   // ultimo(): Observable<Emisiones> {
   //    return this.http.get<Emisiones>(`${baseUrl}/ultimo`);
   //  }

   siguienteNumero(): Observable<number> {
      return this.http.get<number>(`${baseUrl}/siguiente`);
   }

   buscaByNumfec(desde: number, hasta: number) {
      return this.http.get<Reformas>(`${baseUrl}?desde=${desde}&hasta=${hasta}`);
   }

   saveReformas(reformas: Reformas): Observable<Object> {
      return this.http.post(baseUrl, reformas);
   }

   deleteReforma(idrefo: number): Observable<Object> {
      return this.http.delete(`${baseUrl}/${idrefo}`);
   }

   getById(idrefo: number) {
      return this.http.get<Reformas>(baseUrl + "/" + idrefo);
   }

   updateReforma(idrefo: number, reforma: Reformas): Observable<Object> {
      return this.http.put(baseUrl + "/" + idrefo, reforma);
   }

}
