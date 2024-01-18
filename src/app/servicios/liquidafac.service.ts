import { Injectable } from '@angular/core';
import { Liquidafac } from '../modelos/liquidafac.model';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/liquidafac`;

@Injectable({ providedIn: 'root'})

export class LiquidafacService {

  constructor(private http: HttpClient) { }

  getByIdfacturacion1(idfacturacion: number){
    return this.http.get<Liquidafac>(`${baseUrl}/${idfacturacion}`);
  }

  getByIdfacturacion(idfacturacion: number){
    return this.http.get<Liquidafac[]>(`${baseUrl}?idfacturacion=${idfacturacion}`);
  }

  //Original (Funciona pero no se puede obtener el Id)
  saveLiquidafac(liquidafac: Liquidafac):Observable<Object>{
    return this.http.post(baseUrl, liquidafac);
  }

}
