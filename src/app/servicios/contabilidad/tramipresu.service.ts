import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom, Observable } from 'rxjs';
import { Tramipresu } from 'src/app/modelos/contabilidad/tramipresu.model';
import { environment } from 'src/environments/environment';

const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/tramipresu`;

@Injectable({
   providedIn: 'root'
})

export class TramipresuService {

   constructor(private http: HttpClient) { }

   getDesdeHasta(desdeNum: number, hastaNum: number, desdeFecha: Date, hastaFecha: Date): Observable<Tramipresu[]> {
      return this.http.get<Tramipresu[]>(`${baseUrl}?desdeNum=${desdeNum}&hastaNum=${hastaNum}&desdeFecha=${desdeFecha}&hastaFecha=${hastaFecha}`);
   }

   ultimoTramipresu() {
      return this.http.get<Tramipresu>(`${baseUrl}/max`);
   }

   //Validar número
   valNumero(numero: number) {
      return this.http.get<boolean>(`${baseUrl}/numero?numero=${numero}`);
   }

   saveTramipresu(tramipresu: Tramipresu) {
      return this.http.post(`${baseUrl}`, tramipresu);
   }

   findById(idtrami: number) {
      return this.http.get<Tramipresu>(`${baseUrl}/idtrami?idtrami=${idtrami}`);
   }

}
