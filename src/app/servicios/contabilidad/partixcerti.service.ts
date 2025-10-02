import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Partixcerti } from 'src/app/modelos/contabilidad/partixcerti.model';
import { environment } from 'src/environments/environment';

const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/partixcerti`;

@Injectable({
  providedIn: 'root'
})

export class PartixcertiService {

  constructor(private http: HttpClient) {}

  getByIdCerti(idcerti: number) {
    return this.http.get<Partixcerti[]>(`${baseUrl}/idcerti/${idcerti}`);
  }

  getById(idparxcer: number) {
    return this.http.get<Partixcerti>(baseUrl + "/" + idparxcer);
  }

  savePartixcerti(partixcerti: Partixcerti): Observable<Object> {
    return this.http.post(`${baseUrl}`, partixcerti);
  }

  updateParxCer(partixcerti: Partixcerti){
  return this.http.put(`${baseUrl}/${partixcerti.idparxcer}`, partixcerti);
  }

}
