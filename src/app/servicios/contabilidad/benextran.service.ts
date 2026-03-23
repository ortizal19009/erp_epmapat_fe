import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, firstValueFrom } from 'rxjs';
import { BenextranCreateDTO, BenextranUpdateDTO } from 'src/app/dtos/contabilidad/benextran.dto';
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
      const resp = await firstValueFrom(this.http.get<any[]>(`${baseUrl}/movibenefi?idbene=${idbene}&desde=${desde}&hasta=${hasta}`));
      return resp;
   }

   //Verifica si un Beneficiario tiene benextran
   existeByIdbene(idbene: number): Observable<boolean> {
      return this.http.get<boolean>(`${baseUrl}/existeByIdbene?idbene=${idbene}`);
   }

   //Anticipos, CxC, Fondos de Terceros y CxP sin liquidar 
   getACFP(hasta: Date, nomben: String, tiptran: number, codcue: String): Observable<Benextran[]> {
      return this.http.get<Benextran[]>(`${baseUrl}/acfp?hasta=${hasta}&nomben=${nomben}&tiptran=${tiptran}&codcue=${codcue}`);
   }

   // getACFP(hasta: Date, nomben: string, tiptran: number, codcue: string): Observable<Benextran[]> {
   //    // Convertimos el Date a formato LocalDate (yyyy-MM-dd)
   //    const hastaLocalDate = new Date(hasta.getFullYear(), hasta.getMonth(), hasta.getDate()).toISOString().substring(0, 10);
   //    const params = new HttpParams().set('hasta', hastaLocalDate).set('nomben', nomben).set('tiptran', tiptran).set('codcue', codcue);
   //    return this.http.get<Benextran[]>(`${baseUrl}/acfp`, { params });
   // }

   //Por idbenxtra
   getById(idbenxtra: number) {
      return this.http.get<Benextran>(baseUrl + "/" + idbenxtra);
   }

   //Benextran de una transaci.inttra
   obtenerPorInttra(inttra: number): Observable<Benextran[]> {
      return this.http.get<Benextran[]>(`${baseUrl}/inttra/${inttra}`);
   }

   //Cuenta los Benextran por transaci.inttra
   countByInttra(inttra: number) {
      return this.http.get<number>(`${baseUrl}/count/inttra/${inttra}`);
   }

   //Nuevo
   // saveBenextran(x: Benextran): Observable<Object> {
   //    return this.http.post(`${baseUrl}`, x);
   // }
   saveBenextran(benextran: BenextranCreateDTO): Observable<Benextran> {
      return this.http.post<Benextran>(`${baseUrl}`, benextran);
   }

   // Nuevo lote de registros
   guardarLote(lista: BenextranCreateDTO[]): Observable<any> {
      return this.http.post(`${baseUrl}/registros`, lista);
   }

   //Actualizar
   // updateBenextran(idbenxtra: number, benxtra: Benextran): Observable<Object> {
   //    return this.http.put(baseUrl + "/" + idbenxtra, benxtra);
   // }
   updateBenextran(idbenxtra: number, benxtra: BenextranUpdateDTO): Observable<Benextran> {
      return this.http.put<Benextran>(baseUrl + "/" + idbenxtra, benxtra);
   }
   // delete(idparxcer: number): Observable<any> {
   //    return this.http.delete(`${baseUrl}/${idparxcer}`, { responseType: 'text' });
   // }

   // Elimina (controlando 200, 204 y 500)
   deleteBenextran(idbenxtra: number): Observable<any> {
      return this.http.delete(`${baseUrl}/${idbenxtra}`, { observe: 'response' });
   }

}
