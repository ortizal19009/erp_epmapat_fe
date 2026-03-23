import { Injectable } from '@angular/core';
import { firstValueFrom, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Retenciones } from 'src/app/modelos/contabilidad/retenciones.model';
import { environment } from 'src/environments/environment';
import { RetencionCreateDTO } from 'src/app/componentes/contabilidad/retenciones/add-retencion/add-retencion.component';

const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/retenciones`;

@Injectable({
   providedIn: 'root',
})

export class RetencionesService {

   private apiUrl = 'http://localhost:8026/api/comprobantes';  //URL de sri-files

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
   // valSecretencion1Old(secretencion1: number): Observable<boolean> {
   //    return this.http.get<boolean>(`${baseUrl}/valSecretencion1?secretencion1=${secretencion1}`);
   // }
   valSecretencion1(secretencion1: number): Observable<boolean> {
      return this.http.get<boolean>(`${baseUrl}/valSecretencion1/${secretencion1}`);
   }

   // Save usando DTO
   saveRetencion(nueva: RetencionCreateDTO): Observable<Retenciones> {
      return this.http.post<Retenciones>(`${baseUrl}`, nueva);
   }

   getByIdReteBad(idrete: number) {
      return this.http.get<Retenciones[]>(`${baseUrl}/${idrete}`);
   }
   getByIdRete(idrete: number): Observable<Retenciones> {
      return this.http.get<Retenciones>(`${baseUrl}/${idrete}`);
   }

   getById(idrete: number): Observable<Retenciones> {
      return this.http.get<Retenciones>(baseUrl + "/" + idrete);
   }

   // Actualiza con Parcial
   updateRetencion(idrete: number, retenciones: Partial<Retenciones>): Observable<Retenciones> {
      return this.http.put<Retenciones>(`${baseUrl}/${idrete}`, retenciones);
   }

   // deleteRetencion(idrete: number) {
   //    return this.http.delete(`${baseUrl}/${idrete}`);
   // }
   deleteRetencion(idrete: number): Observable<any> {
      return this.http.delete(`${baseUrl}/${idrete}`, { responseType: 'text' });
   }

   autorizar(idrete: number): Observable<any> {
      return this.http.delete(`${baseUrl}/${idrete}`, { responseType: 'text' });
   }

   verificar() {
      console.log(`${this.apiUrl}/verificacion`)
      return this.http.get(`${this.apiUrl}/verificacion`);
   }

}