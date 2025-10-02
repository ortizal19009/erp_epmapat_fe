import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, firstValueFrom } from 'rxjs';
import { Airxrete } from 'src/app/modelos/contabilidad/airxrete.model';
import { environment } from 'src/environments/environment';

const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/airxrete`;

@Injectable({
   providedIn: 'root'
})

export class AirxreteService {

   constructor(private http: HttpClient) { }

   getByIdrete(idrete: number): Observable<Airxrete[]> {
      return this.http.get<Airxrete[]>(`${baseUrl}/retencion?idrete=${idrete}`);
   }

   //AIR por Retención async
   async getByIdreteAsync(idrete: number): Promise<any[]> {
      const resp = await firstValueFrom(this.http.get<any[]>(`${baseUrl}/retencion?idrete=${idrete}`));
      return resp;
   }

   // saveAirxrete(airxrete: Airxrete): Observable<Object> {
   //    return this.http.post(`${baseUrl}`, airxrete);
   // }
   saveAirxrete(airxrete: any): Observable<Object> {
      return this.http.post(`${baseUrl}`, airxrete);
      // Simula una respuesta exitosa
   //  return of({ mensaje: "Simulación de guardado exitoso", data: airxrete });
   }

}
