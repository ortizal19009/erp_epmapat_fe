import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PartixcertiCreateDTO, PartixcertiUpdateDTO } from 'src/app/componentes/contabilidad/partixcerti/partixcerti/partixcerti.component';
import { PartixreinteCreateDTO } from 'src/app/componentes/contabilidad/reintegradas/add-partixreinte/add-partixreinte.component';
import { Partixcerti } from 'src/app/modelos/contabilidad/partixcerti.model';
import { environment } from 'src/environments/environment';

const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/partixcerti`;

@Injectable({
  providedIn: 'root'
})

export class PartixcertiService {

   constructor(private http: HttpClient) { }

   getByIdCerti(idcerti: number) {
      return this.http.get<Partixcerti[]>(`${baseUrl}/idcerti/${idcerti}`);
   }

   getById(idparxcer: number) {
      return this.http.get<Partixcerti>(baseUrl + "/" + idparxcer);
   }

   // Cuentas las partidas de una certipresu
   countByIdcerti(idcerti: number) {
      return this.http.get<number>(`${baseUrl}/count/${idcerti}`);
   }

   // Save usando DTO
   savePartixcerti(nueva: PartixcertiCreateDTO): Observable<Partixcerti> {
      return this.http.post<Partixcerti>(`${baseUrl}`, nueva);
   }

   // Guarda Reintegro
   savePartixreinte(nueva: PartixreinteCreateDTO): Observable<Partixcerti> {
      return this.http.post<Partixcerti>(`${baseUrl}`, nueva);
   }

   // Actualiza solo campos modificados
   updatePartixcerti(idparxcer: number, dto: PartixcertiUpdateDTO): Observable<Partixcerti> {
      return this.http.put<Partixcerti>(`${baseUrl}/${idparxcer}`, dto);
   }

   // Elimina (controlando 404)
   deletePartixcerti(idparxcer: number): Observable<any> {
      return this.http.delete(`${baseUrl}/${idparxcer}`, { responseType: 'text' });
   }

}

