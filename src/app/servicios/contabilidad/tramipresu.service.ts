import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { TramipresuCreateDTO } from '@comercializacion/contabilidad/tramipresu/add-tramipresu/add-tramipresu.component';
import { TramipresuUpdateDTO } from '@comercializacion/contabilidad/tramipresu/modi-tramipresu/modi-tramipresu.component';
import { DeleteResponse } from '@comercializacion/contabilidad/tramipresu/tramipresu/tramipresu.component';
import { catchError, firstValueFrom, map, Observable, throwError } from 'rxjs';
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
      return this.http.get<boolean>(`${baseUrl}/valnumero/${numero}`);
   }

   // Busca un Trámite por número (200, 204 )
   buscaPorNumero(numero: number): Observable<Tramipresu | null> {
      return this.http.get<Tramipresu>(`${baseUrl}/buscanumero/${numero}`, { observe: 'response' })
         .pipe(
            map(resp => resp.status === 200 ? resp.body! : null)
         );
   }

   //Buscar por número (Recibe: 200=Ok 204=noContent)
   getByNumero(numero: number): Observable<Tramipresu | null> {
      return this.http.get<Tramipresu>(`${baseUrl}/buscanumero/${numero}`, { observe: 'response' }).pipe(
         map(resp => {
            if (resp.status === 204) { return null; }
            return resp.body as Tramipresu;
         })
      );
   }

   // Busca por idtrami
   findById(idtrami: number) {
      return this.http.get<Tramipresu>(`${baseUrl}/idtrami?idtrami=${idtrami}`);
   }

   // Save usando DTO
   saveTramipresu(tramipresuDTO: TramipresuCreateDTO): Observable<Tramipresu> {
      return this.http.post<Tramipresu>(`${baseUrl}`, tramipresuDTO);
   }

   // Actualiza solo modificados con patch
   updateTramipresu(idtrami: number, dto: TramipresuUpdateDTO): Observable<Tramipresu> {
      return this.http.patch<Tramipresu>(`${baseUrl}/${idtrami}`, dto);
   }

   // Elimina (con Responce en interface)
   deleteTramipresu(idtrami: number): Observable<DeleteResponse> {
      return this.http.delete<DeleteResponse>(`${baseUrl}/${idtrami}`).pipe(
         catchError((error: HttpErrorResponse) => {
            return throwError(() => error);
         })
      );
   }

}
