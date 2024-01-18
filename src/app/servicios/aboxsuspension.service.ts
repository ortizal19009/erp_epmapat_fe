import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Aboxsuspension } from '../modelos/aboxsuspension';
import { environment } from 'src/environments/environment';

const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/aboxsuspension`;

@Injectable({
  providedIn: 'root'
})

export class AboxsuspensionService {

  constructor(private http: HttpClient) { }

  getListaAboxSuspension(): Observable<Aboxsuspension[]> {
    return this.http.get<Aboxsuspension[]>(`${baseUrl}`);
  }

  saveAboxSuspension(aboxsuspension: Aboxsuspension){
    return this.http.post(`${baseUrl}`,aboxsuspension);
  }

  getByIdsuspension(idsuspension: number){
    return this.http.get<Aboxsuspension[]>(`${baseUrl}/suspension/${idsuspension}`);
  }

}
