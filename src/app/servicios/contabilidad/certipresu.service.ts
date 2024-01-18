import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Certipresu } from 'src/app/modelos/contabilidad/certipresu.model';
import { environment } from 'src/environments/environment';

const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/certipresu`;

@Injectable({
   providedIn: 'root',
})

export class CertipresuService {

   constructor(private http: HttpClient) { }

   getDesdeHasta(desdeNum: number, hastaNum: number, desdeFecha: Date, hastaFecha: Date): Observable<Certipresu[]> {
      return this.http.get<Certipresu[]>(`${baseUrl}?desdeNum=${desdeNum}&hastaNum=${hastaNum}&desdeFecha=${desdeFecha}&hastaFecha=${hastaFecha}`);
   }

   ultimo(): Observable<Certipresu> {
      return this.http.get<Certipresu>(`${baseUrl}/ultimo`);
   }

   //Validar por número
   getNumero(numero: number): Observable<any> {
      return this.http.get<Certipresu>(`${baseUrl}/numero/${numero}/tipo/1`);
   }

   saveCertiPresu(certipresu: any) {
      return this.http.post(`${baseUrl}`, certipresu);
   }

   getByIdCerti(idcerti: number) {
      return this.http.get<Certipresu[]>(`${baseUrl}/${idcerti}`);
   }

   getById(idcerti: number) {
      return this.http.get<Certipresu>(baseUrl + "/" + idcerti);
    }

   updateCerti(idcerti: number, certipresu: Certipresu): Observable<Object> {
      return this.http.put(`${baseUrl}/${idcerti}`, certipresu);
   }

   deleteCertipresu(idcerti: number) {
      return this.http.delete(`${baseUrl}/${idcerti}`);
   }

}
