import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, firstValueFrom, tap } from 'rxjs';
import { Ventanas } from 'src/app/modelos/administracion/ventanas.model';
import { environment } from 'src/environments/environment';

const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/ventanas`;

@Injectable({
   providedIn: 'root'
})

export class VentanasService {

   constructor(private http: HttpClient) { }

   // getByIdusuarioyNombre(idusuario: number, nombre: String) {
   //   return this.http.get<Ventanas>(`${this.Url}?idusuario=${idusuario}&nombre=${nombre}`);
   // }
   async getByIdusuarioyNombre(idusuario: number, nombre: String): Promise<Ventanas> {
      const observable = this.http.get<Ventanas>(`${baseUrl}?idusuario=${idusuario}&nombre=${nombre}`);
      return await firstValueFrom(observable);
   }

   // saveVentana(ventana: Ventanas): Observable<Object> {
   //    return this.http.post(this.Url, ventana);
   // }
   async saveVentana(ventana: Ventanas): Promise<Object> {
      const observable = this.http.post(baseUrl, ventana);
      return await firstValueFrom(observable);
   }

   updateVentana(idventana: number, ventana: Ventanas): Observable<Object> {
      return this.http.put(baseUrl + "/" + idventana, ventana);
   }

}
