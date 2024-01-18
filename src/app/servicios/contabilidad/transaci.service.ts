import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { Transaci } from 'src/app/modelos/contabilidad/transaci.model';
import { environment } from 'src/environments/environment';

const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/transaci`;

@Injectable({
   providedIn: 'root',
})

export class TransaciService {

   constructor(private http: HttpClient) { }

   getControlesBancos(idcuenta: number, mes: number) {
      return this.http.get(`${baseUrl}/ctrlBncs?idcuenta=${idcuenta}&mes=${mes}`);
   }

   //Cuentas (Transacciones) de un Asiento
   getTransaci(idasiento: number) {
      return this.http.get<Transaci[]>(`${baseUrl}/asiento?idasiento=${idasiento}`);
   }

   //Verifica si una Cuenta tiene Transacciones
   tieneTransaci(codcue: string): Observable<boolean> {
      return this.http.get<boolean>(`${baseUrl}/tieneTransaci?codcue=${codcue}`);
   }

   //Verifica si un Asiento tiene Transacciones
   porIdasiento(idasiento: number): Observable<boolean> {
      return this.http.get<boolean>(`${baseUrl}/porIdasiento?idasiento=${idasiento}`);
   }

   updateTransaci(transaci: Transaci) {
      return this.http.put(`${baseUrl}/updtransaci/${transaci.idtransa}`, transaci);
   }

   getByCodcue(codcue: String): Observable<any> {
      return this.http.get<Transaci>(`${baseUrl}?codcue=${codcue}`);
   }

   getFecha(desdeFecha: Date, hastaFecha: Date): Observable<Transaci[]> {
      return this.http.get<Transaci[]>(`${baseUrl}?desdeFecha=${desdeFecha}&hastaFecha=${hastaFecha}`);
   }

   //OJO: Prece que no se usa
   saveTransaci(transaci: any) {
      return this.http.post(`${baseUrl}`, transaci);
   }

   saveTransa(transaci: Transaci): Observable<Object> {
      return this.http.post(`${baseUrl}`, transaci);
   }

   //Save con retorno del idtransa generado (no se usa porque debe devolver el registro completo para colocar en benxtran)
   saveTransaIdOld(transaci: Transaci): Observable<any> {
      return this.http.post(`${baseUrl}`, transaci).pipe(
        map((response: any) => {
          const id = response.idtransa;
          return id;
        })
      );
    }
    

   getByIdTransaci(idtransa: number) {
      return this.http.get<Transaci[]>(`${baseUrl}/${idtransa}`);
   }

   getById(idtransa: number) {
      return this.http.get<Transaci>(baseUrl + "/" + idtransa);
   }

   updateTransaci1(idtransa: number, transaci: Transaci): Observable<Object> {
      return this.http.put(`${baseUrl}/${idtransa}`, transaci);
   }

   deleteTransaci(idtransa: number) {
      return this.http.delete(`${baseUrl}/${idtransa}`);
   }
}
