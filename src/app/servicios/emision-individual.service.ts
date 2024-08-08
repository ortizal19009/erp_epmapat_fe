import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { EmisionIndividual } from '../modelos/emisionindividual.model';
const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/emisionindividual`;
@Injectable({
  providedIn: 'root',
})
export class EmisionIndividualService {
  constructor(private http: HttpClient) {}
  saveEmisionIndividual(datoEmIn: EmisionIndividual) {
    return this.http.post(`${baseUrl}`, datoEmIn);
  }
  getByIdEmision(idemision: number) {
    return this.http.get<EmisionIndividual[]>(
      `${baseUrl}/idemision?idemision=${idemision}`
    );
  }
  getLecturasNuevas(idemision: number) {
    return this.http.get<any>(`${baseUrl}/nuevas?idemision=${idemision}`);
  }
  getLecturasAnteriores(idemision: number) {
    return this.http.get<any>(`${baseUrl}/anteriores?idemision=${idemision}`);
  }
  getRperoteEmisionIndividualByIdEmision(idemision: number) {
    return this.http.get(
      `${baseUrl}/reportes/emisiones?idemision=${idemision}`
    );
  }
}
