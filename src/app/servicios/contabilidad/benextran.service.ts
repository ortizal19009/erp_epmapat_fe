import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Benextran } from 'src/app/modelos/contabilidad/benextran.model';
import { environment } from 'src/environments/environment';

const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/benextran`;

@Injectable({
   providedIn: 'root'
})

export class BenextranService {

   constructor(private http: HttpClient) { }

   getACFP(hasta: Date, nomben: String, tiptran: number, codcue: String): Observable<Benextran[]> {
      return this.http.get<Benextran[]>(`${baseUrl}/acfp?hasta=${hasta}&nomben=${nomben}&tiptran=${tiptran}&codcue=${codcue}`);
   }

   saveBenextran(x: Benextran): Observable<Object> {
      return this.http.post(`${baseUrl}`, x);
   }

}
