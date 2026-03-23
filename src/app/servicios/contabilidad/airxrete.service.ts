import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { FormArray } from '@angular/forms';
import { Observable, firstValueFrom, forkJoin, map, of, switchMap } from 'rxjs';
import { AirxreteLoteDTO } from 'src/app/componentes/contabilidad/retenciones/add-retencion/add-retencion.component';
import { Airxrete } from 'src/app/modelos/contabilidad/airxrete.model';
import { environment } from 'src/environments/environment';

const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/airxrete`;

@Injectable({
   providedIn: 'root'
})

export class AirxreteService {

   constructor(private http: HttpClient) { }

   // AIR por Retencion
   getByIdrete(idrete: number): Observable<Airxrete[]> {
      return this.http.get<Airxrete[]>(`${baseUrl}/retencion?idrete=${idrete}`);
   }

   //AIR por Retención async
   async getByIdreteAsync(idrete: number): Promise<any[]> {
      const resp = await firstValueFrom(this.http.get<any[]>(`${baseUrl}/retencion?idrete=${idrete}`));
      return resp;
   }

   // No se usa (nunca se guarda individualmente)
   saveAirxrete(airxrete: any): Observable<Object> {
      return this.http.post(`${baseUrl}`, airxrete);
   }

   // POST para nuevos por lote (ya viene convertido a DTO)
   saveBatch(payload: AirxreteLoteDTO[]): Observable<Airxrete[]> {
      return this.http.post<Airxrete[]>(`${baseUrl}/batch`, payload);
   }
   // POST para nuevos por lote Normaliza aqui mismo
   saveAirxreteLoteBatch(airsFormArray: FormArray, idrete: number): Observable<any> {
      const payload = this.mapToAirxreteLotePayload(airsFormArray, idrete);
      return this.saveBatch(payload);
   }

   // POST para nuevos por lote ingresadas en modificacion 
   saveBatchModi(payload: AirxreteLoteDTO[]): Observable<Airxrete[]> {
      return this.http.post<Airxrete[]>(`${baseUrl}/batch`, payload);
   }

   // PUT individual para modificadas
   updateAirxrete(idairxrete: number, fila: any): Observable<any> {
      const payload = this.normalizarFila(fila);
      // console.log('payload: ', payload)
      return this.http.put<any>(`${baseUrl}/${idairxrete}`, payload);
   }

   // Maneja: Nuevas → batch, modificadas → una a una
   saveNewAndUpdateModified(nuevas: Airxrete[], modificadas: Airxrete[]): Observable<any> {
      const llamadas: Observable<any>[] = [];
      // 1. Nuevas → batch (si hay: normaliza y envia )
      if (nuevas.length > 0) {
         llamadas.push(
            of(nuevas).pipe(
               map(filas => filas.map(fila => this.normalizarFila(fila))),
               switchMap(nuevasNorm => this.saveBatchModi(nuevasNorm))
            )
         );
      }
      // 2. Modificadas → una a una
      modificadas.forEach(fila => { llamadas.push(this.updateAirxrete(fila.idairxrete, fila)); });
      // Si no hay nada que guardar, devuelve un observable vacío
      if (llamadas.length === 0) { return of(null); }
      // Ejecutar todo en paralelo
      return forkJoin(llamadas);
   }

   // Convierte las filas del FormArray en payload
   mapToAirxreteLotePayload(airsFormArray: FormArray, idrete: number): AirxreteLoteDTO[] {
      return airsFormArray.controls.map(ctrl => {
         const v = ctrl.value;
         return {
            baseimpair0: v.baseimpair0 ?? 0,
            baseimpair12: v.baseimpair12 ?? 0,
            baseimpairno: v.baseimpairno ?? 0,
            baseimpair: v.baseimpair,
            valretair: v.valretair,
            idrete: { idrete },
            idtabla10: { idtabla10: v.idtabla10 }
         };
      });
   }

   // Normaliza claves foráneas para que Spring las acepte
   private normalizarFila(fila: any) {
      return {
         ...fila,
         idtabla10: { idtabla10: fila.idtabla10 },
         idrete: { idrete: fila.idrete }
      };
   }

   deleteAirxrete(idairxrete: number) {
      return this.http.delete(`${baseUrl}/${idairxrete}`);
   }

}


