import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Facxconvenio } from '../modelos/facxconvenio.model';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';

const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/facxconvenio`;

@Injectable({
   providedIn: 'root'
})

export class FacxconvenioService {

   constructor(private http: HttpClient) { }

   //Pre Facturas por idconvenio
   getFacByConvenio(idconvenio: number) {
      return this.http.get<Facxconvenio>(`${baseUrl}?idconvenio=${idconvenio}`)
   }

   saveFacByConvenio(fxc: Facxconvenio): Observable<Object> {
      return this.http.post(`${baseUrl}`, fxc);
   }

}
