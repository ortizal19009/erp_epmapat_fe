import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Cuotas } from '../modelos/cuotas.model';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';

const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/cuotas`;

@Injectable({
   providedIn: 'root'
})

export class CuotasService {

   constructor(private http: HttpClient) { }

   //Cuotas por idconvenio
   getByIdconvenio(idconvenio: number) {
      return this.http.get<Cuotas>(`${baseUrl}?idconvenio=${idconvenio}`)
   }

   saveCuotas(cuota: Cuotas): Observable<Object> {
      return this.http.post(`${baseUrl}`, cuota);
   }

}
