import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Certipresu } from 'src/app/modelos/contabilidad/certipresu.model';
import { environment } from 'src/environments/environment';
import { CertipresuCreateDTO } from 'src/app/componentes/contabilidad/certipresu/add-certipresu/add-certipresu.component';
import { CertipresuUpdateDTO } from 'src/app/componentes/contabilidad/certipresu/modi-certipresu/modi-certipresu.component';

const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/certipresu`;

@Injectable({
   providedIn: 'root',
})


export class CertipresuService {

   constructor(private http: HttpClient) { }

   getDesdeHasta(tipo: number, desdeNum: number | null, hastaNum: number | null, desdeFecha: Date | string | null, hastaFecha: Date | string | null): Observable<Certipresu[]> {
      let params = new HttpParams().set('tipo', tipo);
      const valores = { desdeNum, hastaNum, desdeFecha, hastaFecha };
      Object.entries(valores).forEach(([nombre, valor]) => {
         if (valor !== null && valor !== undefined && String(valor).trim() !== '') {
            params = params.set(nombre, valor instanceof Date ? valor.toISOString().slice(0, 10) : String(valor));
         }
      });
      return this.http.get<Certipresu[]>(baseUrl, { params });
   }

   // Ultima Certificacion o Reintegrada
   ultima(tipo: number): Observable<Certipresu> {
      return this.http.get<Certipresu>(`${baseUrl}/ultima?tipo=${tipo}`);
   }

   //Validar número
   valNumero(numero: number, tipo: number): Observable<boolean> {
      return this.http.get<boolean>(`${baseUrl}/valnumero/numero/${numero}/tipo/${tipo}`);
   }

   //Buscar por número (Recibe: 200=Ok 204=noContent)
   getByNumero(numero: number, tipo: number): Observable<Certipresu | null> {
      return this.http.get<Certipresu>(`${baseUrl}/numero?numero=${numero}&tipo=${tipo}`, { observe: 'response' }).pipe(
         map(resp => {
            if (resp.status === 204) { return null; }
            return resp.body as Certipresu;
         })
      );
   }

   // Busca la última certipresu hasta una fecha (para navegador)
   obtenerUltimoNumero(fecha: Date): Observable<number> {
      return this.http.get<number>(`${baseUrl}/ultima/fecha?fecha=${fecha}`);
   }

   // Save usando DTO
   saveCertipresu(nueva: CertipresuCreateDTO): Observable<Certipresu> {
      return this.http.post<Certipresu>(`${baseUrl}`, nueva);
   }

   getByIdCerti(idcerti: number) {
      return this.http.get<Certipresu>(`${baseUrl}/${idcerti}`);
   }

   getById(idcerti: number) {
      return this.http.get<Certipresu>(baseUrl + "/" + idcerti);
   }

   // Actualiza solo modificados
   updateCertipresu(idcerti: number, dto: CertipresuUpdateDTO): Observable<Certipresu> {
      return this.http.put<Certipresu>(`${baseUrl}/${idcerti}`, dto);
   }

   // Elimina (controlando 404)
   deleteCertipresu(idcerti: number): Observable<any> {
      return this.http.delete(`${baseUrl}/${idcerti}`, { responseType: 'text' });
   }

}
