import { Injectable } from '@angular/core';
import { firstValueFrom, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Retenciones } from 'src/app/modelos/contabilidad/retenciones.model';
import { environment } from 'src/environments/environment';

const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/retenciones`;

@Injectable({
   providedIn: 'root',
})

export class RetencionesService {

   constructor(private http: HttpClient) { }

   //Retenciones por secuencia y fecha
   getDesdeHasta(desdeSecu: string, hastaSecu: string, desdeFecha: Date, hastaFecha: Date): Observable<Retenciones[]> {
      return this.http.get<Retenciones[]>(`${baseUrl}/desdehasta?desdeSecu=${desdeSecu}&hastaSecu=${hastaSecu}&desdeFecha=${desdeFecha}&hastaFecha=${hastaFecha}`);
   }
   //Retenciones por secuencia y fecha async
   async getDesdeHastaAsync(desdeSecu: string, hastaSecu: string, desdeFecha: Date, hastaFecha: Date): Promise<any[]> {
      const resp = await firstValueFrom(this.http.get<any[]>(`${baseUrl}/desdehasta?desdeSecu=${desdeSecu}&hastaSecu=${hastaSecu}&desdeFecha=${desdeFecha}&hastaFecha=${hastaFecha}`));
      return resp;
   }

   // async getByIdreteAsync( idrete: number ): Promise<any[]> {
   //    const resp = await firstValueFrom(this.http.get<any[]>(`${baseUrl}/retencion?idrete=${idrete}`));
   //    return resp;
   // }

   getListaRetenciones(): Observable<Retenciones[]> {
      return this.http.get<Retenciones[]>(baseUrl);
   }

   getByAsiento(idasiento: number): Observable<Retenciones[]> {
      return this.http.get<Retenciones[]>(`${baseUrl}?idasiento=${idasiento}`);
   }

   ultimo(): Observable<Retenciones> {
      return this.http.get<Retenciones>(`${baseUrl}/ultimo`);
   }

   //Validar secretencion1 
   valSecretencion1(secretencion1: String): Observable<boolean> {
      return this.http.get<boolean>(`${baseUrl}/valSecretencion1?secretencion1=${secretencion1}`);
   }

   // Save
   // saveRetencion(retenciones: any) {
   //    return this.http.post(`${baseUrl}`, retenciones);
   // }
   saveRetencion(retencion: Retenciones): Observable<Object> {
      return this.http.post(`${baseUrl}`, retencion);
   }

   getByIdRete(idrete: number) {
      return this.http.get<Retenciones[]>(`${baseUrl}/${idrete}`);
   }

   getById(idrete: number) {
      return this.http.get<Retenciones>(baseUrl + "/" + idrete);
   }

   updateRetencion(idrete: number, retenciones: Retenciones): Observable<Object> {
      return this.http.put(`${baseUrl}/${idrete}`, retenciones);
   }

   deleteRetencion(idrete: number) {
      return this.http.delete(`${baseUrl}/${idrete}`);
   }

}