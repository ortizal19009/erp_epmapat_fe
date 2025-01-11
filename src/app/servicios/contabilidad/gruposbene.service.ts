import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Gruposbene } from 'src/app/modelos/contabilidad/gruposbene.model';
import { environment } from 'src/environments/environment';

const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/gruposbene`;

@Injectable({
  providedIn: 'root'
})

export class GruposbeneService {

  constructor(private http: HttpClient) { }

  getListaGruposbene(): Observable<Gruposbene[]> {
    return this.http.get<Gruposbene[]>(baseUrl);
  }

  //Validar por nombre de Grupobene
  getByNomgru(nomgru: String): Observable<any> {
    return this.http.get<Gruposbene>(`${baseUrl}?nomgru=${nomgru}`);
  }

  saveGruposbene(gruposbene: Gruposbene): Observable<Object> {
    return this.http.post(baseUrl, gruposbene);
  }

  deleteGrupobene(idgrupo: number): Observable<Object> {
    return this.http.delete(`${baseUrl}/${idgrupo}`);
  }

  getById(idgrupo: number) {
    return this.http.get<Gruposbene>(baseUrl + "/" + idgrupo);
  }

  updateGrupobene(idgrupo: number, grupobene: Gruposbene): Observable<Object> {
    return this.http.put(baseUrl + "/" + idgrupo, grupobene);
  }

}
