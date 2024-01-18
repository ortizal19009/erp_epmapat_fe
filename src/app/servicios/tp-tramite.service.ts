import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { TpTramite } from '../modelos/tp-tramite';
import { environment } from 'src/environments/environment';

const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/tptramite`;

@Injectable({
   providedIn: 'root'
})

export class TpTramiteService {

   constructor(private http: HttpClient) { }

   getListaTpTramite(): Observable<TpTramite[]> {
      return this.http.get<TpTramite[]>(`${baseUrl}`);
   }

   getTptramiteByid(idtptramite: number) {
      return this.http.get<TpTramite>(`${baseUrl}/${idtptramite}`)
   }

}
