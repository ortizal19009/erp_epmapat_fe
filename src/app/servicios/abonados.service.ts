import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Abonados } from '../modelos/abonados';
import { environment } from 'src/environments/environment';

const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/abonados`;

@Injectable({
   providedIn: 'root'
})

export class AbonadosService {
    
   constructor(private http: HttpClient) { }

   tmpTodos(): Observable<Abonados[]> {
      return this.http.get<Abonados[]>(`${baseUrl}/tmp`);
   }

   getListaAbonados(): Observable<Abonados[]> {
      return this.http.get<Abonados[]>(`${baseUrl}`);
   }

   saveAbonado(abonado: Abonados): Observable<Object> {
      return this.http.post(`${baseUrl}`, abonado);
   }

   deleteAbonado(idabonado: number): Observable<Object> {
      return this.http.delete(`${baseUrl}/${idabonado}`);
   }
   
   //Buscar con parametro idabonado (Ok para validar al importar lecturas)
   getByIdabonado(idabonado: number): Observable<Abonados> {
      return this.http.get<Abonados>(`${baseUrl}?idabonado=${idabonado}`);
   }

   //Buscar con abonados/idabonado
   getById(idabonado: number): Observable<Abonados> {
      return this.http.get<Abonados>(`${baseUrl}/${idabonado}`);
   }

   getListaByNombreCliente(nombre: string) {
      return this.http.get<Abonados>(`${baseUrl}/ncliente/${nombre}`);
   }

   getListaByidentIficacionCliente(identificacion: string) {
      return this.http.get<Abonados>(`${baseUrl}/icliente/${identificacion}`);
   }

   getListaByidabonado(idabonado: number) {
      return this.http.get<Abonados>(`${baseUrl}/cuenta/${idabonado}`);
   }

   updateAbonado(abonado: Abonados): Observable<Object> {
      return this.http.put(`${baseUrl}/${abonado.idabonado}`, abonado);
   }

   getAbonadoByQuery(dato: String) {
      return this.http.get<Abonados>(`${baseUrl}?consulta=${dato}`);
   }

 /*   saveSerxAbo(idabonado: number, idservicio: number): Observable<Object> {
      return this.http.put(`${baseUrl}/${idabonado}/s/${idservicio}`, null);
   } */
   //Abonados de un Cliente (Cuentas por Cliente)
   getByIdcliente(idcliente: number) {
      return this.http.get<Abonados>(`${baseUrl}?idcliente=${idcliente}`)
   }

   //Abonados por Ruta
   getByIdruta(idruta: number) {
      return this.http.get<Abonados[]>(`${baseUrl}?idruta=${idruta}`)
   }

   //Verifica si un Cliente tiene Abonados (Cuentas)
   tieneAbonados(idcliente: number): Observable<boolean> {
      return this.http.get<boolean>(`${baseUrl}/clienteTieneAbonados?idcliente=${idcliente}`);
   }

   getListaById(idabonado: number) {
      return this.http.get<Abonados>(`${baseUrl}/${idabonado}`);
   }

   getByidabonado(idabonado: number) {
      return this.http.get<Abonados[]>(`${baseUrl}/cuenta/${idabonado}`);
   }

   getByEstado(estado: number) {
      return this.http.get<Abonados>(`${baseUrl}/estado/${estado}`);
   }

   getByIdCliente(idcliente: number) {
      return this.http.get<Abonados[]>(`${baseUrl}/cliente?idcliente=${idcliente}`);
   }

   //Para reporte de campos especificos
   getCampos(): Observable<Abonados[]> {
      return this.http.get<Abonados[]>(`${baseUrl}/campos`);
   }

}
