import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Clientes } from '../modelos/clientes';
import { environment } from 'src/environments/environment';

const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/clientes`;

@Injectable({
   providedIn: 'root'
})

export class ClientesService {

   constructor(private http: HttpClient) { }

   //Busca Clientes por Nombre ó Identificación
   getByNombreIdentifi(nombreIdentifi: String) {
      return this.http.get<Clientes[]>(`${baseUrl}?nombreIdentifi=${nombreIdentifi}`);
   }

   //Valida Cliente por Identificación
   valIdentificacion(identificacion: string): Observable<boolean> {
      return this.http.get<boolean>(`${baseUrl}/valIdentificacion?identificacion=${identificacion}`);
   }

   //Valida Cliente por Nombre
   valNombre(nombre: string): Observable<boolean> {
      return this.http.get<boolean>(`${baseUrl}/valNombre?nombre=${nombre}`);
   }

   //Busca Clientes por Identificación
   getByIdentificacion(identificacion: String) {
      return this.http.get<Clientes[]>(`${baseUrl}?identificacion=${identificacion}`);
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
      return this.http.get<Clientes>(`${baseUrl}/${idcliente}`);
   }

   updateCliente(clientes: Clientes): Observable<Object> {
      return this.http.put(`${baseUrl}/${clientes.idcliente}`, clientes);
   }

}
