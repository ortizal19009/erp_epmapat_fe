import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, firstValueFrom } from 'rxjs';
import { Fec_reteimpu } from 'src/app/modelos/contabilidad/fec_reteimpu.model';
import { environment } from 'src/environments/environment';

const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/fec_reteimpu`;

@Injectable({
  providedIn: 'root'
})

export class FecReteimpuService {

  constructor(private http: HttpClient) { }

  getLista(): Observable<Fec_reteimpu[]> {
    return this.http.get<Fec_reteimpu[]>(`${baseUrl}`);
  }

  //Save
  save(reg: Fec_reteimpu): Observable<Object> {
    return this.http.post(`${baseUrl}`, reg);
  }
  //Save async
  async saveAsync(reg: Fec_reteimpu): Promise<Object> {
    const observable = this.http.post(baseUrl, reg);
    return await firstValueFrom(observable);
  }

}
