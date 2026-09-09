import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, firstValueFrom } from 'rxjs';
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

   getCatalogoVentanas(): Observable<string[]> {
      return this.http.get<string[]>(`${baseUrl}/catalogo`);
   }

   getCatalogoModulosVentanas(): Observable<any[]> {
      return this.http.get<any[]>(`${baseUrl}/catalogo-modulos`);
   }

   getAuditoriaCatalogoModulosVentanas(): Observable<any> {
      return this.http.get<any>(`${baseUrl}/catalogo-modulos/auditoria`);
   }

   saveCatalogoModulosVentanas(catalogo: any[]): Observable<void> {
      return this.http.post<void>(`${baseUrl}/catalogo-modulos`, catalogo);
   }

   createCatalogoVentana(nombre: string, iderpmodulo: number): Observable<any> {
      return this.http.post<any>(`${baseUrl}/catalogo-modulos/ventana`, { nombre, iderpmodulo });
   }

   getPermisosUsuario(idusuario: number): Observable<any[]> {
      return this.http.get<any[]>(`${baseUrl}/usuario/${idusuario}`);
   }

   savePermisosUsuario(idusuario: number, permisos: Ventanas[]): Observable<Ventanas[]> {
      return this.http.post<Ventanas[]>(`${baseUrl}/usuario/${idusuario}`, permisos);
   }

}
