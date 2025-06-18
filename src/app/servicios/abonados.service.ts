import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, firstValueFrom } from 'rxjs';
import { Abonados } from '../modelos/abonados';
import { environment } from 'src/environments/environment';

const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/abonados`;

@Injectable({
  providedIn: 'root',
})
export class AbonadosService {
  constructor(private http: HttpClient) { }

  async getById_v2(idabonado: number) {
    return this.http.get<Abonados>(`${baseUrl}/${idabonado}`);
  }

  /*   saveSerxAbo(idabonado: number, idservicio: number): Observable<Object> {
      return this.http.put(`${baseUrl}/${idabonado}/s/${idservicio}`, null);
   } */
  //Abonados de un Cliente (Cuentas por Cliente)

  //Abonados por Ruta

  getOneAbonado(idabonado: number) {
    return this.http.get<Abonados>(
      `${baseUrl}/oneabonado?idabonado=${idabonado}`
    );
  }
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

  //Un Abonado
  unAbonado(idabonado: number): Observable<Abonados> {
    return this.http.get<Abonados>(
      `${baseUrl}/unabonado?idabonado=${idabonado}`
    );
  }

  updateAbonado(abonado: any): Observable<any> {
    return this.http.put<any>(`${baseUrl}/${abonado.idabonado}`, abonado);
  }

  getAbonadoByQuery(dato: String) {
    return this.http.get<Abonados>(`${baseUrl}?consulta=${dato}`);
  }

  saveSerxAbo(idabonado: number, idservicio: number): Observable<Object> {
    return this.http.put(`${baseUrl}/${idabonado}/s/${idservicio}`, null);
  }
  //Abonados de un Cliente (Cuentas por Cliente)
  getByIdcliente(idcliente: number) {
    return this.http.get<Abonados>(`${baseUrl}?idcliente=${idcliente}`);
  }

  //Abonados por Ruta
  getByIdruta(idruta: number) {
    return this.http.get<Abonados[]>(`${baseUrl}?idruta=${idruta}`);
  }

  //Abonados por Ruta Async
  async getByIdrutaAsync(idruta: number): Promise<Abonados[]> {
    const observable = this.http.get<Abonados[]>(`${baseUrl}?idruta=${idruta}`);
    return await firstValueFrom(observable);
  }

  //Verifica si un Cliente tiene Abonados (Cuentas)
  tieneAbonados(idcliente: number): Observable<boolean> {
    return this.http.get<boolean>(
      `${baseUrl}/clienteTieneAbonados?idcliente=${idcliente}`
    );
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
    return this.http.get<Abonados[]>(
      `${baseUrl}/cliente?idcliente=${idcliente}`
    );
  }

  //Para reporte de campos especificos
  getCampos(): Observable<Abonados[]> {
    return this.http.get<Abonados[]>(`${baseUrl}/campos`);
  }
  async getDeudasCuentasByRuta(idruta: number) {
    let resp = this.http.get(`${baseUrl}/deudas?idruta=${idruta}`);
    return await firstValueFrom(resp);
  }
  getResAbonado(cuenta: number) {
    return this.http.get(`${baseUrl}/resabonado?idabonado=${cuenta}`);
  }
  getResAbonadoNombre(nombre: string) {
    return this.http.get(`${baseUrl}/resabonado/nombre?nombre=${nombre}`);
  }
  getResAbonadoIdentificacion(identificacion: string) {
    return this.http.get(`${baseUrl}/resabonado/identificacion?identificacion=${identificacion}`);
  }
  getResAbonadoCliente(idcliente: number) {
    return this.http.get(`${baseUrl}/resabonado/idcliente?idcliente=${idcliente}`);
  }
  getResAbonadoResponsable(idresponsable: number) {
    return this.http.get(`${baseUrl}/resabonado/respago?idresp=${idresponsable}`);
  }
  getCuentasByCategoria() {
    return firstValueFrom(this.http.get(`${baseUrl}/ncuentasByCategoria`));

  }
  getCuentasByEstado() {
    return firstValueFrom(this.http.get(`${baseUrl}/ncuentasByEstado`));

  }
}
