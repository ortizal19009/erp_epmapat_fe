import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, Observable } from 'rxjs';
import { Ejecucio } from 'src/app/modelos/contabilidad/ejecucio.model';
import { environment } from 'src/environments/environment';

const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/ejecucio`;

@Injectable({
   providedIn: 'root'
})

export class EjecucionService {

   constructor(private http: HttpClient) { }

   getListaEjecucion(): Observable<Ejecucio[]> {
      return this.http.get<Ejecucio[]>(baseUrl);
   }

   getByIdrefo(idrefo: number): Observable<any> {
      return this.http.get<Ejecucio>(`${baseUrl}?idrefo=${idrefo}`);
   }

   //Auxiliar presupuestario
   getCodparFecha(codpar: String, desdeFecha: Date, hastaFecha: Date): Observable<Ejecucio[]> {
      return this.http.get<Ejecucio[]>(`${baseUrl}?codpar=${codpar}&desdeFecha=${desdeFecha}&hastaFecha=${hastaFecha}`);
   }
   //Auxiliar presupuestario Async
   async getCodparFechaAsync(codpar: String, desdeFecha: Date, hastaFecha: Date): Promise<any[]> {
      const response = await firstValueFrom(this.http.get<any[]>(`${baseUrl}?codpar=${codpar}&desdeFecha=${desdeFecha}&hastaFecha=${hastaFecha}`));
      return response;
   }

   getById(idejecu: number) {
      return this.http.get<Ejecucio>(baseUrl + "/" + idejecu);
   }

   //Verifica si una partida tiene movimientos (ejecucio)
   tieneEjecucio(codpar: string): Observable<boolean> {
      return this.http.get<boolean>(`${baseUrl}/tieneEjecucio?codpar=${codpar}`);
   }

   //Cuenta por intpre
   countByIntpre(intpre: number) {
      return this.http.get<number>(`${baseUrl}/countByIntpre?intpre=${intpre}`);
   }

   //Partidas de un trámite
   getByIdtrami(idtrami: number): Observable<any> {
      return this.http.get<Ejecucio[]>(`${baseUrl}/partixtrami?idtrami=${idtrami}`);
   }

   //Modificado (reformas) de una partida (desde/hasta)
   getTotalModi(codpar: String, desdeFecha: Date, hastaFecha: Date) {
      return this.http.get<number>(`${baseUrl}/modi?codpar=${codpar}&desdeFecha=${desdeFecha}&hastaFecha=${hastaFecha}`);
   }

   //Devengado de una partida (desde/hasta)
   getTotalDeven(codpar: String, desdeFecha: Date, hastaFecha: Date) {
      return this.http.get<number>(`${baseUrl}/deven?codpar=${codpar}&desdeFecha=${desdeFecha}&hastaFecha=${hastaFecha}`);
   }

   //Cobrado o Pagado de una partida (desde/hasta)
   getTotalCobpagado(codpar: String, desdeFecha: Date, hastaFecha: Date) {
      return this.http.get<number>(`${baseUrl}/cobpagado?codpar=${codpar}&desdeFecha=${desdeFecha}&hastaFecha=${hastaFecha}`);
   }

   // Actualizar codpar
   actualizarCodpar(intpre: number, nuevoCodpar: string): Observable<Ejecucio[]> {
      return this.http.patch<Ejecucio[]>(`${baseUrl}/${intpre}?nuevoCodpar=${nuevoCodpar}`, null);
   }

   saveEjecucion(ejecucion: Ejecucio): Observable<Object> {
      return this.http.post(baseUrl, ejecucion);
   }

   deleteEjecucion(idejecu: number): Observable<Object> {
      return this.http.delete(`${baseUrl}/${idejecu}`);
   }

   updateEjecucion(idejecu: number, reforma: Ejecucio): Observable<Object> {
      return this.http.put(baseUrl + "/" + idejecu, reforma);
   }

   getByCodPar(codpar: string, periodo: number) {
      let date: Date = new Date();
      let year = date.getFullYear();
      let d_fec = `${year}-01-01`;
      const fecha = new Date(`${year}-${+periodo! + 1}-01`);
      const fechaAnterior = fecha.setDate(fecha.getDate() - 1);
      let fec = new Date(fechaAnterior);
      let day = fec.toDateString().split(' ').slice(2, 3);
      let h_fec = `${fec.getFullYear()}-${periodo}-${day}`;
      return this.http.get<Ejecucio[]>(
         `${baseUrl}/partida/${codpar}/${d_fec}/${h_fec}`
      );
   }

}
