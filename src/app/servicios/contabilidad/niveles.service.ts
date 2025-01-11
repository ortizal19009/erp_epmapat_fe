import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Niveles } from 'src/app/modelos/contabilidad/niveles.model';
import { environment } from 'src/environments/environment';

const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/niveles`;

@Injectable({
   providedIn: 'root'
})

export class NivelesService {

   constructor(private http: HttpClient) { }

   getListaNiveles(): Observable<Niveles[]> {
      return this.http.get<Niveles[]>(baseUrl);
   }

   //Obtiene un nivel por nivcue
   getByNivcue(nivcue: number): Observable<Niveles> {
      return this.http.get<Niveles>(`${baseUrl}/nivel?nivcue=${nivcue}`);
   }

   //Siguiente Nivel
   getSiguienteNivcue(nivcue: number): Observable<Niveles> {
      return this.http.get<Niveles>(`${baseUrl}/siguiente?nivcue=${nivcue}`);
   }

   saveNiveles(niveles: Niveles): Observable<Object> {
      return this.http.post(baseUrl, niveles);
   }

   deleteNiveles(idnivel: number): Observable<Object> {
      return this.http.delete(`${baseUrl}/${idnivel}`);
   }

   getById(idnivel: number) {
      return this.http.get<Niveles>(baseUrl + "/" + idnivel);
   }

   updateNiveles(niveles: Niveles): Observable<Object> {
      return this.http.put(`${baseUrl}/${niveles.idnivel}`, niveles);
   }

   update(id: number, niveles: Niveles): Observable<Object> {
      return this.http.put(baseUrl + "/" + id, niveles);
   }

   getByDescripcion(descripcion: String) {
      return this.http.get<Niveles[]>(`${baseUrl}?descripcion=${descripcion}`);
   }

   getByDato(dato: String) {
      return this.http.get<Niveles>(`${baseUrl}?consulta=${dato}`);
   }

}
