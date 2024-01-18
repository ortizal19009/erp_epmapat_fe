import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Rubroxfac } from '../modelos/rubroxfac.model';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/rubroxfac`;

@Injectable({
   providedIn: 'root'
})

export class RubroxfacService {

   constructor(private http: HttpClient) { }

   getListaRubroByFactura(idfactura: number) {
      return this.http.get<Rubroxfac[]>(`${baseUrl}?nrofactura=${idfactura}`);
   }

   getListaRubroByIdfactura(idfactura: number) {
      return this.http.get<Rubroxfac[]>(`${baseUrl}/idfactura/${idfactura}`);
   }

   getByIdfactura(idfactura: number) {
      return this.http.get<Rubroxfac[]>(`${baseUrl}?idfactura=${idfactura}`);
   }

   saveRubroxfac(rubroxFac: Rubroxfac): Observable<Object> {
      return this.http.post(`${baseUrl}`, rubroxFac);
   }

   getByIdrubro(idrubro: number) {
      return this.http.get<Rubroxfac[]>(`${baseUrl}/rubro/${idrubro}`);
   }

   saveRubroxFac(rubroxFac: Rubroxfac): Observable<Object> {
      return this.http.post(`${baseUrl}`, rubroxFac);
   }

}
