import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Lecturas } from '../modelos/lecturas.model';
import { Observable, firstValueFrom } from 'rxjs';
import { environment } from 'src/environments/environment';

const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/lecturas`;

@Injectable({
  providedIn: 'root',
})
export class LecturasService {
  constructor(private http: HttpClient) {}

  //Lectura por Planilla
  getOnefactura(idfactura: number) {
    return this.http.get<Lecturas[]>(`${baseUrl}/onePlanilla/${idfactura}`);
  }

  getLecturas(idrutaxemision: Number) {
    return this.http.get<Lecturas>(
      `${baseUrl}?idrutaxemision=${idrutaxemision}`
    );
  }

  getLecturasxIdabonado(idabonado: number) {
    return this.http.get<Lecturas>(`${baseUrl}?idabonado=${idabonado}`);
  }

  getByBmonth() {
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
    return this.http.get<Lecturas>(baseUrl + '/' + idlectura);
  }

  //Lectura por Planilla
  getByIdfactura(idfactura: number) {
    return this.http.get<Lecturas[]>(`${baseUrl}/planilla/${idfactura}`);
  }
  async getByIdfacturaAsync(idfactura: number) {
    return await firstValueFrom(
      this.http.get<Lecturas[]>(`${baseUrl}/planilla/${idfactura}`)
    );
  }

  //Ultima lectura de un Abonado async
  async getUltimaLecturaAsync(idabonado: number): Promise<number> {
    const observable = this.http.get<number>(
      `${baseUrl}/ultimalectura?idabonado=${idabonado}`
    );
    return await firstValueFrom(observable);
  }
  async getUltimaLecturaByEmisionAsync(
    idabonado: number,
    idemision: number
  ): Promise<number> {
    const observable = this.http.get<number>(
      `${baseUrl}/ultimalecturaByemision?idabonado=${idabonado}&idemision=${idemision}`
    );
    return await firstValueFrom(observable);
  }

  //Save
  saveLectura(lectura: Lecturas): Observable<Object> {
    return this.http.post(baseUrl, lectura);
  }

  //Save async
  async saveLecturaAsync(lectura: Lecturas): Promise<any> {
    const observable = this.http.post(baseUrl, lectura);
    return await firstValueFrom(observable);
  }

  //Actualiza una lectura
  updateLectura(idlectura: number, lectura: Lecturas): Observable<Object> {
    return this.http.put(baseUrl + '/' + idlectura, lectura);
  }

  //Actualiza una lectura async
  async updateLecturaAsync(
    idlectura: number,
    lectura: Lecturas
  ): Promise<Object> {
    const observable = this.http.put(baseUrl + '/' + idlectura, lectura);
    return await firstValueFrom(observable);
  }
  //obtener suma totales x factura
  totalEmisionXFactura(idemision: number) {
    return this.http.get(`${baseUrl}/emision/totalsuma?idemision=${idemision}`);
  }
  //obtener suma totales x factura
  rubrosEmitidos(idemision: number) {
    return this.http.get(`${baseUrl}/emision/rubros?idemision=${idemision}`);
  }
  getByIdEmision(idemision: number) {
    return this.http.get<Lecturas[]>(`${baseUrl}/emision/${idemision}`);
  }
  getByIdEmisionIdabonado(idemision: number, idabonado: number) {
    return this.http.get<Lecturas[]>(
      `${baseUrl}/emision/${idemision}/${idabonado}`
    );
  } /* REPORTES  */
  getR_EmisionFinal(idemision: number) {
    return this.http.get<any>(
      `${baseUrl}/reportes/emisionfinal?idemision=${idemision}`
    );
  }
  getR_EmisionActual(idemision: number) {
    return this.http.get<any>(
      `${baseUrl}/reportes/emisionactual?idemision=${idemision}`
    );
  }
  /* Obtener facturas por ruta deudas */
  findDeudoresByRuta(idruta: number) {
    return this.http.get(`${baseUrl}/reportes/deudasxruta?idruta=${idruta}`);
  }
  /* obtener la fecha de una emision por el id de la factura, solo para recaudacion y para facturas de consumo */
  findDateByIdfactura(idfactura: number) {
    return this.http.get(`${baseUrl}/fecEmision?idfactura=${idfactura}`);
  }
  findByIdEmisiones(idemision: number) {
    return this.http.get(`${baseUrl}/emision?idemision=${idemision}`);
  }

  /* Reporte de emisiones */
  findInicial(idemision: number) {
    return this.http.get(
      `${baseUrl}/reportes/rubros/inicial?idemision=${idemision}`
    );
  }
  findCM3Inicial(idemision: number) {
    return this.http.get(
      `${baseUrl}/reportes/rubros/inicial/cm3?idemision=${idemision}`
    );
  }
  findEliminados(idemision: number) {
    return this.http.get(
      `${baseUrl}/reportes/rubros/eliminados?idemision=${idemision}`
    );
  }
  findNuevos(idemision: number) {
    return this.http.get(
      `${baseUrl}/reportes/rubros/nuevos?idemision=${idemision}`
    );
  }
  findActual(idemision: number) {
    return this.http.get(
      `${baseUrl}/reportes/rubros/actual?idemision=${idemision}`
    );
  }
  findReporteValEmitidosxEmision(idemision: number) {
    return this.http.get(
      `${baseUrl}/reportes/valoresEmitidos?idemision=${idemision}`
    );
  }
  findConsumoxCategoria(idemision: number) {
    return this.http.get(
      `${baseUrl}/reportes/consumoxcategoria?idemision=${idemision}`
    );
  }
  async findZeroByEmisiones(idemision: number) {
    return this.http.get<any>(
      `${baseUrl}/reportes/rubrozero?idemision=${idemision}`
    );
  }
}
