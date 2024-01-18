import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { TpReclamo } from '../modelos/tp-reclamo';
import { environment } from 'src/environments/environment';

const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/tpreclamo`;

@Injectable({
  providedIn: 'root'
})
export class TpReclamoService {

  constructor(private http:HttpClient) { }

  getListaTpReclamos():Observable<TpReclamo[]>{
    return this.http.get<TpReclamo[]>(`${baseUrl}`);
  }

}
