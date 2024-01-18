import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Asientos } from 'src/app/modelos/contabilidad/asientos.model';
import { environment } from 'src/environments/environment';

const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/asientos`;

@Injectable({
   providedIn: 'root'
})
export class AsientosService {

   constructor(private http: HttpClient) { }

   getAsientos(asi_com: number, desdeNum: number, hastaNum: number, desdeFecha: Date, hastaFecha: Date): Observable<Asientos[]> {
      return this.http.get<Asientos[]>(`${baseUrl}?asi_com=${asi_com}&desdeNum=${desdeNum}&hastaNum=${hastaNum}&desdeFecha=${desdeFecha}&hastaFecha=${hastaFecha}`);
   }

   getComprobantes(asi_com: number, tipcom1: number, tipcom2: number, desdeNum: number, hastaNum: number, desdeFecha: Date, hastaFecha: Date): Observable<Asientos[]> {
      return this.http.get<Asientos[]>(`${baseUrl}?asi_com=${asi_com}&tipcom1=${tipcom1}&tipcom2=${tipcom2}&desdeNum=${desdeNum}&hastaNum=${hastaNum}&desdeFecha=${desdeFecha}&hastaFecha=${hastaFecha}`);
   }

   //Siguiente asiento
   siguienteNumero(): Observable<number> {
      return this.http.get<number>(`${baseUrl}/siguiente`);
   }

   findByNumero(asiento: number): Observable<any> {
      return this.http.get<Asientos[]>(`${baseUrl}/asiento/${asiento}`);
   }

   ultimo(): Observable<Asientos> {
      return this.http.get<Asientos>(`${baseUrl}/ultimo`);
   }

   unAsiento(idasiento: number): Observable<Asientos> {
      return this.http.get<Asientos>(`${baseUrl}/asiento?idasiento=${idasiento}`);
   }

   //Ultima Fecha
   obtenerUltimaFecha(): Observable<Date> {
      return this.http.get<Date>(`${baseUrl}/ultimafecha`);
   }

   //Ultimo Comprobante
   obtenerUltimoCompro(tipcom: number): Observable<number> {
      return this.http.get<number>(`${baseUrl}/ultimocompro?tipcom=${tipcom}`);
   }

   //Valida número de Comprobante
   valCompro(tipcom: number, compro: number): Observable<boolean> {
      return this.http.get<boolean>(`${baseUrl}/valcompro?tipcom=${tipcom}&compro=${compro}`);
   }

   //Actualizar los Totales del Asiento
   updateTotdebAndTotcre(idasiento: number, totdeb: number, totcre: number): Observable<any> {
   return this.http.patch(`${baseUrl}/totales?idasiento=${idasiento}&totdeb=${totdeb}&totcre=${totcre}`, null);
   }

   saveAsiento(asientos: Asientos): Observable<Object> {
      return this.http.post(`${baseUrl}`, asientos);
   }

   getByIdAsiento(idasiento: number) {
      return this.http.get<Asientos[]>(`${baseUrl}/${idasiento}`);
   }

   getById(idasiento: number) {
      return this.http.get<Asientos>(baseUrl + "/" + idasiento);
   }

   updateAsiento(idasiento: number, asientos: Asientos): Observable<Object> {
      return this.http.put(baseUrl + "/" + idasiento, asientos);
   }

   deleteAsiento(idasiento: number) {
      return this.http.delete(`${baseUrl}/${idasiento}`);
   }

}
