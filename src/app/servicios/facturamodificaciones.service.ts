import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { Facturamodificaciones } from '../modelos/facturamodificaciones.model';
const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/facturamodificaciones`;
@Injectable({
  providedIn: 'root'
})
export class FacturamodificacionesService {

  constructor(private http: HttpClient) { }
  saveFacturacionModificaciones(facmodificaciones:any ){
    return this.http.post(`${baseUrl}`,facmodificaciones)
  }
}
