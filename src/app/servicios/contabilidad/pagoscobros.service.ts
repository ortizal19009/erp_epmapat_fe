import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom, Observable } from 'rxjs';
import { Pagoscobros } from 'src/app/modelos/contabilidad/pagoscobros.model';
import { environment } from 'src/environments/environment';

const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/pagoscobros`;

@Injectable({
  providedIn: 'root'
})

export class PagoscobrosService {

  constructor(private http: HttpClient) { }

  //Liquidaciones de un Movimiento (benextran)
  getByIdbenxtra(idbenxtra: number): Observable<Pagoscobros[]> {
    return this.http.get<Pagoscobros[]>(`${baseUrl}?idbenxtra=${idbenxtra}`);
  }
  //Liquidaciones de un Movimiento (benextran) async
  async getByIdbenxtraAsync(idbenxtra: number): Promise<any[]> {
    const resp = await firstValueFrom(this.http.get<any[]>(`${baseUrl}?idbenxtra=${idbenxtra}`));
    return resp;
  }

}
