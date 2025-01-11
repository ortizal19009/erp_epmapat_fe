import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, firstValueFrom } from 'rxjs';
import { Fec_retenciones } from 'src/app/modelos/contabilidad/fec_retenciones.model';
import { environment } from 'src/environments/environment';

const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/fec_retenciones`;

@Injectable({
   providedIn: 'root'

})

export class FecRetencionesService {

   constructor(private http: HttpClient) { }

   getLista(): Observable<Fec_retenciones[]> {
      return this.http.get<Fec_retenciones[]>(`${baseUrl}`);
   }

   //Save
   save(reg: Fec_retenciones): Observable<Object> {
      return this.http.post(`${baseUrl}`, reg);
   }
   //Save async
   async saveAsync(reg: Fec_retenciones): Promise<Object> {
      const observable = this.http.post(baseUrl, reg);
      return await firstValueFrom(observable);
   }

}
