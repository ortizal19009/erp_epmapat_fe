import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { first, firstValueFrom, Observable } from 'rxjs';
import { Intereses } from '../modelos/intereses';
import { environment } from 'src/environments/environment';
import { Facturas } from '../modelos/facturas.model';
import { FacturaService } from './factura.service';
import { TmpinteresxfacService } from './tmpinteresxfac.service';

const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/intereses`;

@Injectable({
  providedIn: 'root',
})
export class InteresesService {
  constructor(
    private http: HttpClient,
    private tmpInteresxfacService: TmpinteresxfacService
  ) {}

  getListaIntereses(): Observable<Intereses[]> {
    return this.http.get<Intereses[]>(`${baseUrl}`);
  }

  //Validar por Anio y Mes
  getByAnioMes(anio: number, mes: number): Observable<any> {
    return this.http.get<Intereses>(`${baseUrl}?anio=${anio}&mes=${mes}`);
  }

  //Busca el Último
  getUltimo(): Observable<any> {
    return this.http.get<Intereses>(`${baseUrl}/ultimo`);
  }

  saveIntereses(intereses: Intereses): Observable<Object> {
    return this.http.post(`${baseUrl}`, intereses);
  }

  deleteInteres(idinteres: number) {
    return this.http.delete(`${baseUrl}/${idinteres}`);
  }

  getListaById(idinteres: number) {
    return this.http.get<Intereses>(`${baseUrl}/${idinteres}`);
  }

  // updateIntereses(intereses: Intereses): Observable<Object> {
  //    return this.http.put(`${baseUrl}/${intereses.idinteres}`, intereses);
  // }

  updateInteres(idinteres: number, interes: Intereses): Observable<Object> {
    return this.http.put(baseUrl + '/' + idinteres, interes);
  }
  async getInteresFactura(idfactura: number) {
    let interes = await this.tmpInteresxfacService.getByIdFactura(idfactura)

    return interes;
  }
  getInteresFacturaAsync(idfactura: number) {
    let interes = firstValueFrom(
      this.http.get<any>(`${baseUrl}/calcular?idfactura=${idfactura}`)
    );

    return interes;
  }

  async getAllIntereses() {
    let intereses = await this.getListaIntereses().toPromise();
    return intereses;
  }

  /* Calcular los intereses en la tabla tempinteresxfac global o una por una */

  async recalcularBatchInteres(): Promise<any> {
    return firstValueFrom(this.http.post(`${baseUrl}/batch/recalcular`, null));
  }
  previewInteresByFactura(idfactura: number) {
    console.log('consultando');
    return this.http.get(`${baseUrl}/facturas/${idfactura}/preview`);
  }
  async getInteresTemporal(idfactura: number) {
    return await this.tmpInteresxfacService.getByIdFactura(idfactura);
  }
}
