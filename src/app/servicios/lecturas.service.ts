import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Lecturas } from '../modelos/lecturas.model';
import { Observable, firstValueFrom } from 'rxjs';
import { environment } from 'src/environments/environment';

const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/lecturas`;

@Injectable({
  providedIn: 'root'
})

export class LecturasService {

  constructor(private http: HttpClient) { }

  getLecturas(idrutaxemision: Number){
    return this.http.get<Lecturas>(`${baseUrl}?idrutaxemision=${idrutaxemision}`);
  }

  getLecturasxIdabonado(idabonado: number){
    return this.http.get<Lecturas>(`${baseUrl}?idabonado=${idabonado}`);
  }

  getByBmonth(){
    return this.http.get<Lecturas[]>(`${baseUrl}/lecbm`);
  }

  getByIdAMora(idabonado: number) {
    return this.http.get<Lecturas[]>(`${baseUrl}/lbam/${idabonado}`);
  }

  getByNCliente(nombre: string) {
    return this.http.get<Lecturas[]>(`${baseUrl}/lbncm/${nombre}`);
  }
  
  getByICliente(cedula: string) {
    return this.http.get<Lecturas[]>(`${baseUrl}/lbicm/${cedula}`);
  }

  getByIdlectura(idlectura: number) {
    return this.http.get<Lecturas>(baseUrl + "/" + idlectura);
  }

  //Lectura por Planilla
  getByIdfactura(idfactura: number) {
    return this.http.get<Lecturas[]>(`${baseUrl}/planilla/${idfactura}`);
  }
  //Lectura por Planilla
  getOnefactura(idfactura: number) {
    return this.http.get<Lecturas[]>(`${baseUrl}/onePlanilla/${idfactura}`);
  }

  saveLectura(lectura: Lecturas): Observable<Object> {
    return this.http.post(baseUrl, lectura);
  }

  updateLectura(idlectura: number, lectura: Lecturas): Observable<Object> {
    return this.http.put(baseUrl + "/" + idlectura, lectura);
  }

}
