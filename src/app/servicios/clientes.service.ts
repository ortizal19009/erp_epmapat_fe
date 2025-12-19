import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom, Observable } from 'rxjs';
import { Clientes } from '../modelos/clientes';
import { environment } from 'src/environments/environment';

const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/clientes`;

@Injectable({
  providedIn: 'root',
})
export class ClientesService {
  constructor(private http: HttpClient) {}

  //Busca Clientes por Nombre ó Identificación
  getByNombreIdentifi(nombreIdentifi: String) {
    return this.http.get<Clientes[]>(
      `${baseUrl}?nombreIdentifi=${nombreIdentifi}`
    );
  }

  //Valida Cliente por Identificación
  valIdentificacion(identificacion: string): Observable<boolean> {
    return this.http.get<boolean>(
      `${baseUrl}/valIdentificacion?identificacion=${identificacion}`
    );
  }

  //Valida Cliente por Nombre
  valNombre(nombre: string): Observable<boolean> {
    return this.http.get<boolean>(`${baseUrl}/valNombre?nombre=${nombre}`);
  }

  //Busca Clientes por Identificación
  getByIdentificacion(identificacion: String) {
    return this.http.get<Clientes[]>(
      `${baseUrl}?identificacion=${identificacion}`
    );
  }

  //Busca Clientes por Nombre
  getByNombre(nombre: String) {
    return this.http.get<Clientes[]>(`${baseUrl}?nombre=${nombre}`);
  }

  // getByDato(dato: String){
  //   return this.http.get<Clientes>(`${baseUrl}?consulta=${dato}`);
  // }

  getListaClientes(): Observable<Clientes[]> {
    return this.http.get<Clientes[]>(`${baseUrl}`);
  }

  getUsedClientes(idcliente: number) {
    return this.http.get<Clientes[]>(`${baseUrl}?idused=${idcliente}`);
  }

  saveClientes(clientes: Clientes): Observable<Object> {
    return this.http.post(`${baseUrl}`, clientes);
  }

  deleteCliente(idcliente: number): Observable<Object> {
    return this.http.delete(`${baseUrl}/${idcliente}`);
  }

  getListaById(idcliente: number) {
    return this.http.get<any>(`${baseUrl}/one?idcliente=${idcliente}`);
  }

  updateCliente(clientes: Clientes): Observable<Object> {
    return this.http.put(`${baseUrl}/${clientes.idcliente}`, clientes);
  }
  getTotalClientes() {
    return this.http.get(`${baseUrl}/total`);
  }
  getCVOfClientes(fecha: any) {
    return this.http.get(`${baseUrl}/reportes/carteravencida?fecha=${fecha}`);
  }
  async asynGetCVOfClientes(fecha: any) {
    return await firstValueFrom(
      this.http.get(`${baseUrl}/reportes/carteravencida?fecha=${fecha}`)
    );
  }
  async CVOfClientes(fecha: any, name: string, page: number, size: number) {
    return await firstValueFrom(
      this.http.get(
        `${baseUrl}/cartera/clientes?fecha=${fecha}&name=${name}&page=${page}&size=${size}`
      )
    );
  }
  // Actualizar SOLO usuario y contraseña
  actualizarCredenciales(
    idcliente: number,
    username: string,
    password: string
  ) {
    const body = { username, password };
    return this.http.put<void>(`${baseUrl}/${idcliente}/credenciales`, body);
  }
  obtenerDuplicados(page: number, size: number, q?: string) {
    const params: any = { page, size };
    if (q) params.q = q; // solo si lo implementas en backend
    return this.http.get<any>(`${baseUrl}/duplicados`, { params });
  }
  obtenerDuplicadosAgrupados(page: number, size: number, q?: string) {
    const params: any = { page, size };
    if (q) params.q = q; // solo si lo implementas en backend
    return this.http.get<any>(`${baseUrl}/duplicados-agrupado`, { params });
  }
  mergeClientes(payload: {
    masterId: number;
    duplicateIds: number[];
  }): Observable<void> {
    return this.http.post<void>(`${baseUrl}/merge`, payload);
  }
}
