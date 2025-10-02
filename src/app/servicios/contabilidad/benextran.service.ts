import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, firstValueFrom } from 'rxjs';
import { Benextran } from 'src/app/modelos/contabilidad/benextran.model';
import { environment } from 'src/environments/environment';

const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/benextran`;

@Injectable({
   providedIn: 'root'
})

export class BenextranService {

   constructor(private http: HttpClient) { }

   //Movimientos por beneficiario
   getByIdbeneDesdeHasta(idbene: number, desde: Date, hasta: Date): Observable<Benextran[]> {
      return this.http.get<Benextran[]>(`${baseUrl}/movibenefi?idbene=${idbene}&desde=${desde}&hasta=${hasta}`);
   }
   //Movimientos por beneficiario async
   async getByIdbeneDesdeHastaAsync(idbene: number, desde: Date, hasta: Date): Promise<any[]> {
      const resp = await firstValueFrom(this.http.get<any[]>( `${baseUrl}/movibenefi?idbene=${idbene}&desde=${desde}&hasta=${hasta}` ));
      return resp;
   }

   //Verifica si un Beneficiario tiene benextran
   existeByIdbene(idbene: number): Observable<boolean> {
      return this.http.get<boolean>(`${baseUrl}/existeByIdbene?idbene=${idbene}`);
   }

   getACFP(hasta: Date, nomben: String, tiptran: number, codcue: String): Observable<Benextran[]> {
      return this.http.get<Benextran[]>(`${baseUrl}/acfp?hasta=${hasta}&nomben=${nomben}&tiptran=${tiptran}&codcue=${codcue}`);
   }

   //Por idbenxtra
   getById(idbenxtra: number) {
      return this.http.get<Benextran>(baseUrl + "/" + idbenxtra);
   }

   saveBenextran(x: Benextran): Observable<Object> {
      return this.http.post(`${baseUrl}`, x);
   }

}
