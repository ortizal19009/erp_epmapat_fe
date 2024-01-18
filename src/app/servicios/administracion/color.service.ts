import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Colores } from 'src/app/modelos/administracion/colores.model';
import { environment } from 'src/environments/environment';

const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/colores`;

@Injectable({
   providedIn: 'root'
})

export class ColorService {

   constructor(private http: HttpClient) { }

   getTonos(): Observable<Colores[]> {
      return this.http.get<Colores[]>(`${baseUrl}/tonos`);
   }

   getByTono(codigo: string): Observable<Colores[]> {
      return this.http.get<Colores[]>(`${baseUrl}?codigo=${codigo}`);
   }

}
