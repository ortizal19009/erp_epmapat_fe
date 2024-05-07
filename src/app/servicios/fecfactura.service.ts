import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Fecfactura } from '../modelos/fecfactura.model';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

const apiUrl = environment.FE_API_URL;
const baseUrl = `${apiUrl}/fec_factura`;

@Injectable({
   providedIn: 'root'
})

export class FecfacturaService {

   constructor(private http: HttpClient) { }

   getLista(): Observable<Fecfactura[]> {
      return this.http.get<Fecfactura[]>(`${baseUrl}`);
   }

   //Save
   save(f: Fecfactura): Observable<Object> {
      return this.http.post(`${baseUrl}`, f);
   }

}
