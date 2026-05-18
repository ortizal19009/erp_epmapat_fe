import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Aguatramite } from '../modelos/aguatramite.model';
import { environment } from 'src/environments/environment';

const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/aguatramite`;

@Injectable({
   providedIn: 'root'
})

export class AguatramiteService {

   constructor(private http: HttpClient) { }

   getByTipoTramite(idtipotramite: number, estado: number) {
      let date: Date = new Date();
      let year = date.getFullYear();
      let month = date.getMonth() + 1;
      let day = date.getDate();
      let d = `${year - 1}-${month}-${day}`;
      let h = `${year}-${month}-${day}`;
      return this.http.get<Aguatramite>(`${baseUrl}/tipotramite/${idtipotramite}/${estado}/${d}/${h}`);
   }

   buscarPageable(payload: {
      idtipotramite: number;
      estado?: number | null;
      cliente?: string | null;
      fechaDesde?: string | null;
      fechaHasta?: string | null;
      page?: number;
      size?: number;
   }): Observable<any> {
      let params = new HttpParams().set('idtipotramite', String(payload.idtipotramite));
      if (payload.estado != null) params = params.set('estado', String(payload.estado));
      if (payload.cliente) params = params.set('cliente', payload.cliente);
      if (payload.fechaDesde) params = params.set('fechaDesde', payload.fechaDesde);
      if (payload.fechaHasta) params = params.set('fechaHasta', payload.fechaHasta);
      params = params.set('page', String(payload.page ?? 0));
      params = params.set('size', String(payload.size ?? 10));
      return this.http.get<any>(`${baseUrl}/buscar`, { params });
   }

   getAll(): Observable<Aguatramite[]> {
      return this.http.get<Aguatramite[]>(baseUrl);
   }

   getByCliente(nombre: String) {
      return this.http.get<Aguatramite>(`${baseUrl}?nombre=${nombre}`);
   }

   getDesdeHasta(desde: number, hasta: number) {
      return this.http.get<Aguatramite>(`${baseUrl}?desde=${desde}&hasta=${hasta}`);
   }

   getById(idaguatramite: number): Observable<Aguatramite> {
      return this.http.get<Aguatramite>(`${baseUrl}/${idaguatramite}`);
   }

   saveAguaTramite(aguatramite: Aguatramite): Observable<Object> {
      return this.http.post(`${baseUrl}`, aguatramite);
   }

   delete(idaguatramite: number): Observable<Object> {
      return this.http.delete(`${baseUrl}/${idaguatramite}`);
   }

   updateAguatramite(aguatramite: Aguatramite): Observable<Object> {
      return this.http.put(`${baseUrl}/${aguatramite.idaguatramite}`, aguatramite);
   }

}
