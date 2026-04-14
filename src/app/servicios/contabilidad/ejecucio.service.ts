import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, Observable } from 'rxjs';
import { Ejecucio } from 'src/app/modelos/contabilidad/ejecucio.model';
import { environment } from 'src/environments/environment';
import { EjecucioCreateDTO, EjecucioUpdateDTO } from 'src/app/dtos/contabilidad/ejecucio.dto';

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

   // Una ejecucio por ID
   getById(inteje: number) {
      return this.http.get<Ejecucio>(baseUrl + "/" + inteje);
   }

   //Verifica si una partida tiene movimientos (ejecucio OJO: Y si solo tiene certificaciones ?)
   tieneEjecucio(codpar: string): Observable<boolean> {
      return this.http.get<boolean>(`${baseUrl}/tieneEjecucio?codpar=${codpar}`);
   }

   //Contar compromisos por idparxcer (para no eliminar)
   countByIdparxcer(idparxcer: number): Observable<number> {
      return this.http.get<number>(`${baseUrl}/countByIdparxcer/${idparxcer}`);
   }

   //Contar por idtrami
   countByIdtrami(idtrami: number): Observable<number> {
      return this.http.get<number>(`${baseUrl}/countByIdtrami/${idtrami}`);
   }

   //Contar por intpre
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

   // Compromisos de una partixcerti
   obtenerPorIdparxcer(idparxcer: number): Observable<Ejecucio[]> {
      return this.http.get<Ejecucio[]>(`${baseUrl}/poridparxcer/${idparxcer}`);
   }

   //Ejecución de un Asiento
   findByIdAsiento(idasiento: number): Observable<Ejecucio[]> {
      return this.http.get<Ejecucio[]>(`${baseUrl}/idasiento/${idasiento}`);
   }

   // Ejecución de una transaci.inttra
   getByInttra(inttra: number): Observable<Ejecucio | null> {
      return this.http.get<Ejecucio | null>(`${baseUrl}/inttra/${inttra}`);
   }

   // Detalle de devengados de un compromiso (Busca por: ejecucio.idprmiso)
   obtenerPorIdprmiso(idprmiso: number): Observable<Ejecucio[]> {
      return this.http.get<Ejecucio[]>(`${baseUrl}/poridprmiso/${idprmiso}`);
   }

   // Contar los devengados de un compromiso
   contarPorIdprmiso(idprmiso: number): Observable<number> {
      return this.http.get<number>(`${baseUrl}/countidprmiso/${idprmiso}`);
   }

   // Busca la última Ejecución
   ultimaFecha(): Observable<string | null> {
      return this.http.get<string | null>(`${baseUrl}/ultimafecha`);
   }
   // ultimaFecha(): Observable<Date | null> {
   //    return this.http.get<string | null>(`${baseUrl}/ultimafecha`).pipe(
   //       map(fecha => fecha ? new Date(fecha) : null)
   //    );
   // }


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

   //Compromiso pendientes
   misosPendientes(nomben: String, hasta: Date) {
      // console.log(`${baseUrl}/misosPendientes?nomben=${nomben}&hasta=${hasta}`)
      return this.http.get<Ejecucio>(`${baseUrl}/misosPendientes?nomben=${nomben}&hasta=${hasta}`);
   }

   saveEjecucion(ejecucion: Ejecucio): Observable<Object> {
      return this.http.post(baseUrl, ejecucion);
   }
   // Save usando DTO
   saveEjecu(nueva: EjecucioCreateDTO): Observable<Ejecucio> {
      return this.http.post<Ejecucio>(`${baseUrl}`, nueva);
   }

   // Actualiza solo modificados con patch
   updateEjecucio(inteje: number, dto: EjecucioUpdateDTO): Observable<Ejecucio> {
      return this.http.patch<Ejecucio>(`${baseUrl}/${inteje}`, dto);
   }

   // Actualizar codpar
   actualizarCodpar(intpre: number, nuevoCodpar: string): Observable<Ejecucio[]> {
      return this.http.patch<Ejecucio[]>(`${baseUrl}/codpar/${intpre}?nuevoCodpar=${nuevoCodpar}`, null);
   }

   //Actualizar totdeven de una ejecucio
   updateTotdeven(inteje: number, totdeven: number): Observable<any> {
      return this.http.patch(`${baseUrl}/totdeven?inteje=${inteje}&totdeven=${totdeven}`, null);
   }

   updateEjecucion(idejecu: number, reforma: Ejecucio): Observable<Object> {
      return this.http.put(baseUrl + "/" + idejecu, reforma);
   }

   deleteEjecucion(inteje: number): Observable<Object> {
      return this.http.delete(`${baseUrl}/${inteje}`);
   }

}
