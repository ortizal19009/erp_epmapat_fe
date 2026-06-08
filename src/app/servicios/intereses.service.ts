import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom, Observable } from 'rxjs';
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
    return this.fetchInteresCalculado(idfactura);
  }

  getInteresFacturaAsync(idfactura: number) {
    return this.fetchInteresCalculado(idfactura);
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
    return this.fetchInteresCalculado(idfactura);
  }

  private async fetchInteresCalculado(idfactura: number): Promise<number> {
    const response = await firstValueFrom(
      this.http.get<any>(`${baseUrl}/calcular?idfactura=${idfactura}`)
    );

    return this.normalizeInteresResponse(response);
  }

  private normalizeInteresResponse(response: any): number {
    if (response == null) {
      return 0;
    }

    if (typeof response === 'number') {
      return Number.isFinite(response) ? response : 0;
    }

    if (typeof response === 'string') {
      const parsed = Number(response);
      return Number.isFinite(parsed) ? parsed : 0;
    }

    const candidates = [
      response?.interes,
      response?.interesapagar,
      response?.valor,
      response?.total,
      response?.monto,
    ];

    for (const candidate of candidates) {
      const parsed = Number(candidate);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }

    return 0;
  }
}
