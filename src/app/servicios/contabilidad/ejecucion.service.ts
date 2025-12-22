import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Ejecucion } from 'src/app/modelos/contabilidad/ejecucion.model';
import { environment } from 'src/environments/environment';

const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/ejecucion`;

@Injectable({
   providedIn: 'root'
})

export class EjecucionService {

   constructor(private http: HttpClient) { }

   getListaEjecucion(): Observable<Ejecucion[]> {
      return this.http.get<Ejecucion[]>(baseUrl);
   }

   getByIdrefo(idrefo: number): Observable<any> {
      return this.http.get<Ejecucion>(`${baseUrl}?idrefo=${idrefo}`);
   }

   getCodparFecha(codpar: String, desdeFecha: Date, hastaFecha: Date): Observable<Ejecucion[]> {
      return this.http.get<Ejecucion[]>(`${baseUrl}?codpar=${codpar}&desdeFecha=${desdeFecha}&hastaFecha=${hastaFecha}`);
   }

   getById(idejecu: number) {
      return this.http.get<Ejecucion>(baseUrl + "/" + idejecu);
   }

   //Verifica si una partida tiene movimientos (ejecución)
   tieneEjecucion(codpar: string): Observable<boolean> {
      return this.http.get<boolean>(`${baseUrl}/tieneEjecucion?codpar=${codpar}`);
   }

   // Actualizar codpar
   actualizarCodpar(idpresupue: number, nuevoCodpar: string): Observable<Ejecucion[]> {
      return this.http.patch<Ejecucion[]>(`${baseUrl}/${idpresupue}?nuevoCodpar=${nuevoCodpar}`, null);
   }

   saveEjecucion(ejecucion: Ejecucion): Observable<Object> {
      return this.http.post(baseUrl, ejecucion);
   }

   deleteEjecucion(idejecu: number): Observable<Object> {
      return this.http.delete(`${baseUrl}/${idejecu}`);
   }

   updateEjecucion(idejecu: number, reforma: Ejecucion): Observable<Object> {
      return this.http.put(baseUrl + "/" + idejecu, reforma);
   }

}
