import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, firstValueFrom, map, of, throwError } from 'rxjs';
import { AsientoCreateDTO } from 'src/app/componentes/contabilidad/asientos/add-asiento/add-asiento.component';
import { AsientoUpdateDTO } from 'src/app/componentes/contabilidad/asientos/modi-asiento/modi-asiento.component';
import { Asientos } from 'src/app/modelos/contabilidad/asientos.model';
import { environment } from 'src/environments/environment';

const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/asientos`;

@Injectable({
   providedIn: 'root'
})

export class AsientosService {

   constructor(private http: HttpClient) { }

   //Asientos por numero y fecha
   getAsientos(asi_com: number, desdeNum: number, hastaNum: number, desdeFecha: Date, hastaFecha: Date): Observable<Asientos[]> {
      return this.http.get<Asientos[]>(`${baseUrl}?asi_com=${asi_com}&desdeNum=${desdeNum}&hastaNum=${hastaNum}&desdeFecha=${desdeFecha}&hastaFecha=${hastaFecha}`);
   }
   //Asientos por numero y fecha Async
   async getAsientosAsync(asi_com: number, desdeNum: number, hastaNum: number, desdeFecha: Date, hastaFecha: Date): Promise<any[]> {
      const response = await firstValueFrom(this.http.get<any[]>(`${baseUrl}?asi_com=${asi_com}&desdeNum=${desdeNum}&hastaNum=${hastaNum}&desdeFecha=${desdeFecha}&hastaFecha=${hastaFecha}`));
      return response;
   }

   //Comprobantes por numero y fecha
   getComprobantes(asi_com: number, tipcom: number, desdeNum: number, hastaNum: number, desdeFecha: Date, hastaFecha: Date): Observable<Asientos[]> {
      return this.http.get<Asientos[]>(`${baseUrl}?asi_com=${asi_com}&tipcom=${tipcom}&desdeNum=${desdeNum}&hastaNum=${hastaNum}&desdeFecha=${desdeFecha}&hastaFecha=${hastaFecha}`);
   }
   //Comprobantes por numero y fecha Async
   async getComprobantesAsync(asi_com: number, tipcom: number, desdeNum: number, hastaNum: number, desdeFecha: Date, hastaFecha: Date): Promise<any[]> {
      const resp = await firstValueFrom(this.http.get<any[]>(`${baseUrl}?asi_com=${asi_com}&tipcom=${tipcom}&desdeNum=${desdeNum}&hastaNum=${hastaNum}&desdeFecha=${desdeFecha}&hastaFecha=${hastaFecha}`));
      return resp;
   }

   //Siguiente asiento
   siguienteNumero(): Observable<number> {
      return this.http.get<number>(`${baseUrl}/siguiente`);
   }

   findByNumero(asiento: number): Observable<any> {
      return this.http.get<Asientos[]>(`${baseUrl}/asiento/${asiento}`);
   }

   //Ultimo asiento
   ultimo(): Observable<Asientos> {
      return this.http.get<Asientos>(`${baseUrl}/ultimo`);
   }

   // Un asiento por id (con /asiento)
   unAsiento(idasiento: number): Observable<Asientos> {
      return this.http.get<Asientos>(`${baseUrl}/asiento?idasiento=${idasiento}`);
   }

   // Un asiento por ID
   findByIdAsiento(idasiento: number): Observable<Asientos | null> {
      return this.http.get<Asientos>(`${baseUrl}/${idasiento}`, { observe: 'response' })
         .pipe(
            map(resp => resp.status === 200 ? resp.body! : null),
            catchError(err => {
               if (err.status === 404) {
                  return of(null);
               }
               return throwError(() => err);
            })
         );
   }

   //Ultima Fecha
   obtenerUltimaFecha(): Observable<Date> {
      return this.http.get<Date>(`${baseUrl}/ultimafecha`);
   }

   // Primer Comprobante
   obtenerPrimerCompro(tipcom: number): Observable<number> {
      return this.http.get<number>(`${baseUrl}/primercompro/${tipcom}`);
   }

   //Ultimo Comprobante
   obtenerUltimoCompro(tipcom: number): Observable<number> {
      return this.http.get<number>(`${baseUrl}/ultimocompro?tipcom=${tipcom}`);
   }

   // Un asiento por número
   buscaPorNumero(asiento: number): Observable<Asientos | null> {
      return this.http.get<Asientos>(`${baseUrl}/numero/${asiento}`, { observe: 'response' })
         .pipe(
            map(resp => resp.status === 200 ? resp.body! : null)
         );
   }

   // Un asiento por Comprobante
   buscaPorComprobante(tipcom: number, compro: number): Observable<Asientos | null> {
      return this.http.get<Asientos>(`${baseUrl}/comprobante/${tipcom}/${compro}`, { observe: 'response' })
         .pipe(
            map(resp => resp.status === 200 ? resp.body! : null)
         );
   }

   //Valida número de Comprobante
   valCompro(tipcom: number, compro: number): Observable<boolean> {
      return this.http.get<boolean>(`${baseUrl}/valcompro?tipcom=${tipcom}&compro=${compro}`);
   }

   //Actualizar los Totales del Asiento
   // updateTotdebAndTotcre(idasiento: number, totdeb: number, totcre: number): Observable<any> {
   //    return this.http.patch(`${baseUrl}/totales?idasiento=${idasiento}&totdeb=${totdeb}&totcre=${totcre}`, null);
   // }

   // Save usando DTO
   saveAsiento(asiento: AsientoCreateDTO): Observable<Asientos> {
      return this.http.post<Asientos>(`${baseUrl}`, asiento);
   }

   getByIdAsiento(idasiento: number) {
      return this.http.get<Asientos[]>(`${baseUrl}/${idasiento}`);
   }

   getById(idasiento: number): Observable<Asientos> {
      return this.http.get<Asientos>(baseUrl + "/" + idasiento);
   }

   // Actualiza solo modificados
   updateAsiento(idasiento: number, dto: AsientoUpdateDTO): Observable<Asientos> {
      return this.http.put<Asientos>(`${baseUrl}/${idasiento}`, dto);
   }

   // Elimina (controlando 404)
   deleteAsiento(idasiento: number): Observable<any> {
      return this.http.delete(`${baseUrl}/${idasiento}`, { responseType: 'text' });
   }

}
