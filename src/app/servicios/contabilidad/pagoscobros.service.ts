import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom, Observable } from 'rxjs';
import { PagoscobrosCreateDTO, PagoscobrosUpdateDTO } from 'src/app/dtos/contabilidad/pagoscobros.dto';
import { Pagoscobros } from 'src/app/modelos/contabilidad/pagoscobros.model';
import { environment } from 'src/environments/environment';

const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/pagoscobros`;

@Injectable({
  providedIn: 'root'
})


export class PagoscobrosService {

   constructor(private http: HttpClient) { }

   //Liquidaciones de un Movimiento (benextran)
   getByIdbenxtra(idbenxtra: number): Observable<Pagoscobros[]> {
      // console.log(`${baseUrl}?idbenxtra=${idbenxtra}`)
      return this.http.get<Pagoscobros[]>(`${baseUrl}?idbenxtra=${idbenxtra}`);
   }
   //Liquidaciones de un Movimiento (benextran) async
   async getByIdbenxtraAsync(idbenxtra: number): Promise<any[]> {
      const resp = await firstValueFrom(this.http.get<any[]>(`${baseUrl}?idbenxtra=${idbenxtra}`));
      return resp;
   }

   //Pagoscobros de una transaci.inttra
   obtenerPorInttra(inttra: number): Observable<Pagoscobros[]> {
      return this.http.get<Pagoscobros[]>(`${baseUrl}/inttra/${inttra}`);
   }

   //Pagoscobros de un benextran.idbenxtra
   obtenerPorBenextran(idbenxtra: number): Observable<Pagoscobros[]> {
      return this.http.get<Pagoscobros[]>(`${baseUrl}/idbenxtra/${idbenxtra}`);
   }

   //Cuenta los Pagoscobros de una transaci.inttra
   countByInttra(inttra: number) {
      return this.http.get<number>(`${baseUrl}/count/inttra/${inttra}`);
   }

   //Guarda
   save(x: Pagoscobros): Observable<Object> {
      return this.http.post(`${baseUrl}`, x);
   }
   // Save usando DTO
   savePagocobro(nuevo: PagoscobrosCreateDTO): Observable<Pagoscobros> {
      return this.http.post<Pagoscobros>(`${baseUrl}`, nuevo);
   }

   // Update Pagoscobros usando dto
   updatePagoscobros(idpagcob: number, pagcobDTO: PagoscobrosUpdateDTO): Observable<Pagoscobros> {
      return this.http.put<Pagoscobros>(baseUrl + "/" + idpagcob, pagcobDTO);
   }

   // Elimina (controlando 200, 204 y 500)
   deletePagoscobros(idpagcob: number): Observable<any> {
      return this.http.delete(`${baseUrl}/${idpagcob}`, { observe: 'response' });
   }

}
