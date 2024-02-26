import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Cajas } from '../modelos/cajas.model';
import { environment } from 'src/environments/environment';

const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/cajas`;

@Injectable({
   providedIn: 'root'
})

export class CajaService {

   constructor(private http: HttpClient) { }

   public getAll(): Observable<Cajas[]> {
      return this.http.get<Cajas[]>(`${baseUrl}`);
   }

   public getListaCaja(): Observable<Cajas[]> {
      return this.http.get<Cajas[]>(`${baseUrl}`);
   }

   getUsedCajas(idcaja: number) {
      return this.http.get<Cajas[]>(`${baseUrl}?idused=${idcaja}`);
   }

   saveCaja(caja: Cajas): Observable<Object> {
      return this.http.post(`${baseUrl}`, caja);
   }

   deleteCaja(idcaja: number): Observable<Object> {
      return this.http.delete(`${baseUrl}/${idcaja}`);
   }

   getById(idcaja: number): Observable<Cajas> {
      return this.http.get<Cajas>(`${baseUrl}/${idcaja}`);
   }
   //Actualiza modificacion
   updateCaja(caja: Cajas): Observable<Object> {
      return this.http.put(`${baseUrl}/${caja.idcaja}`, caja);
   }
   //Busca codigos (idptoemision y codigo de la caja)
   getByCodigos(idptoemision: number, codigo: String) {
      return this.http.get<Cajas[]>(`${baseUrl}?idptoemision=${idptoemision}&codigo=${codigo}`);
   }
   //Busca por Descripcion
   getByDescri(descripcion: String) {
      return this.http.get<Cajas[]>(`${baseUrl}?descripcion=${descripcion}`);
   }
   //Puntos de Emision por Establecimiento
   getByIdptoemision(idptoemision: number) {
      return this.http.get<Cajas>(`${baseUrl}?idptoemision=${idptoemision}`)
   }
   /* Entontrar cajas por usuario para abrir caja */
   getByIdUsuario(idusuario: number) {
      return this.http.get<Cajas>(`${baseUrl}/usuario/${idusuario}`);
   }
   
}
