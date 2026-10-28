import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of, from, map, mergeMap, toArray, catchError, shareReplay, throwError } from 'rxjs';
import { Suspensiones } from '../modelos/suspensiones';
import { environment } from 'src/environments/environment';

const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/suspensiones`;

@Injectable({
   providedIn: 'root'
})

export class SuspensionesService {

   constructor(private http: HttpClient) { }

   retirarMedidores(id: number, cuentas: number[], idusuario: number, observacion = ''): Observable<any> {
      return this.http.post<any>(`${baseUrl}/${id}/retiros`, { cuentas, idusuario, observacion });
   }

   private cuentasCache = new Map<number, Observable<number[]>>();

   private cuentasDelDetalle(id: number): Observable<number[]> {
      const guardadas = this.cuentasCache.get(id);
      if (guardadas) return guardadas;
      const consulta = this.http.get<any[]>(`${apiUrl}/aboxsuspension/suspension/${id}`).pipe(
         map(relaciones => [...new Set((relaciones || []).map(item => Number(
            typeof item.idabonado_abonados === 'number' ? item.idabonado_abonados : item.idabonado_abonados?.idabonado
         )).filter(cuenta => Number.isFinite(cuenta) && cuenta > 0))].sort((a, b) => a - b)),
         catchError(error => { this.cuentasCache.delete(id); return throwError(() => error); }),
         shareReplay({ bufferSize: 1, refCount: true })
      );
      this.cuentasCache.set(id, consulta);
      return consulta;
   }

   private completarCuentas(registros: Suspensiones[]): Observable<Suspensiones[]> {
      if (!registros?.length) return of([]);
      return from(registros.map((registro, index) => ({ registro, index }))).pipe(
         mergeMap(({ registro, index }) => {
            if (Array.isArray(registro.cuentasAfectadas)) return of({ registro, index });
            return this.cuentasDelDetalle(registro.idsuspension).pipe(
               map(cuentas => ({ registro: { ...registro, cuentasAfectadas: cuentas, totalCuentas: cuentas.length }, index })),
               catchError(() => of({ registro, index }))
            );
         }, 4),
         toArray(),
         map(filas => filas.sort((a, b) => a.index - b.index).map(fila => fila.registro))
      );
   }

   getById(id: number): Observable<Suspensiones> {
      return this.http.get<Suspensiones>(`${baseUrl}/${id}`);
   }

   getByFecha(desde: Date, hasta: Date) {
      return this.http.get<Suspensiones[]>(`${baseUrl}/susp/${desde}/${hasta}`).pipe(mergeMap(datos => this.completarCuentas(datos)));
   }

   getListaSuspensiones(): Observable<Suspensiones[]> {
      return this.http.get<Suspensiones[]>(`${baseUrl}`).pipe(mergeMap(datos => this.completarCuentas(datos)));
   }

   saveSuspension(suspension: Suspensiones) {
      return this.http.post(`${baseUrl}`, suspension);
   }

   getListaHabilitaciones(): Observable<Suspensiones[]> {
      return this.http.get<Suspensiones[]>(`${baseUrl}/habilitaciones`).pipe(mergeMap(datos => this.completarCuentas(datos)))
   }

   getListaHabilitacionesByFecha(desde: Date, hasta: Date): Observable<Suspensiones[]> {
      return this.http.get<Suspensiones[]>(`${baseUrl}/habbydate/${desde}/${hasta}`).pipe(mergeMap(datos => this.completarCuentas(datos)));
   }

   getUltimo() {
      return this.http.get(`${baseUrl}/ultimo`)
   }

   getUltimoPorTipo(tipo: number) {
      return this.http.get(`${baseUrl}/ultimo/portipo?tipo=${tipo}`);
   }

}
