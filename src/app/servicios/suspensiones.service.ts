import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Suspensiones } from '../modelos/suspensiones';
import { environment } from 'src/environments/environment';

const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/suspensiones`;

@Injectable({
   providedIn: 'root'
})

export class SuspensionesService {

   constructor(private http: HttpClient) { }

   getByFecha(desde: Date, hasta: Date) {
      return this.http.get(`${baseUrl}/susp/${desde}/${hasta}`);
   }

   getListaSuspensiones(): Observable<Suspensiones[]> {
      return this.http.get<Suspensiones[]>(`${baseUrl}`);
   }

   saveSuspension(suspension: Suspensiones) {
      return this.http.post(`${baseUrl}`, suspension);
   }

   getListaHabilitaciones(): Observable<Suspensiones[]> {
      return this.http.get<Suspensiones[]>(`${baseUrl}/habilitaciones`)
   }

   getListaHabilitacionesByFecha(desde: Date, hasta: Date): Observable<Suspensiones[]> {
      return this.http.get<Suspensiones[]>(`${baseUrl}/habbydate/${desde}/${hasta}`);
   }

   getUltimo() {
      return this.http.get(`${baseUrl}/ultimo`)
   }

}
