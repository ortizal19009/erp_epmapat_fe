import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Pliego24 } from '../modelos/pliego24.model';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/pliego24`;

@Injectable({
   providedIn: 'root'
})

export class Pliego24Service {

   constructor(private http: HttpClient) { }

   //Pliego Tarifario
   getTodos(): Observable<Pliego24[]> {
      return this.http.get<Pliego24[]>(`${baseUrl}`);
   }

   //Valor de un Consumo (m3)
   getConsumo(consumo: number): Observable<Pliego24[]> {
      return this.http.get<Pliego24[]>(`${baseUrl}/consumos?consumo=${consumo}`);
   }

   //Una Tarifa del Pliego
   getBloque(idcategoria: number, m3: number): Observable<Pliego24[]> {
      // console.log(`${baseUrl}/bloque?idcategoria=${idcategoria}&m3=${m3}`)
      return this.http.get<Pliego24[]>(`${baseUrl}/bloque?idcategoria=${idcategoria}&m3=${m3}`);
   }
   
}
