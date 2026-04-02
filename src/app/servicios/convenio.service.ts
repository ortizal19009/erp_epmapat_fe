import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Convenios } from '../modelos/convenios.model';
import { environment } from 'src/environments/environment';
import { PageResponse } from '../interfaces/page-response';

const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/convenios`;

@Injectable({
  providedIn: 'root',
})
export class ConvenioService {
  constructor(private http: HttpClient) { }

  getAll(): Observable<Convenios[]> {
    return this.http.get<Convenios[]>(baseUrl);
  }

  conveniosDesdeHasta(desde: number, hasta: number) {
    return this.http.get<Convenios>(
      `${baseUrl}/DesdeHasta?desde=${desde}&hasta=${hasta}`
    );
  }

  //Último Nroconvenio
  ultimoNroconvenio(): Observable<Convenios> {
    return this.http.get<Convenios>(`${baseUrl}/ultimo`);
  }

  //Siguiente Nroconvenio
  siguienteNroconvenio(): Observable<number> {
    return this.http.get<number>(`${baseUrl}/siguiente`);
  }

  //Valida Nroconvenio
  valNroconvenio(nroconvenio: number): Observable<boolean> {
    return this.http.get<boolean>(
      `${baseUrl}/valNroconvenio?nroconvenio=${nroconvenio}`
    );
  }

  getConveniosQuery(dnro: number, hnro: number) {
    return this.http.get<Convenios>(`${baseUrl}?dnro=${dnro}&hnro=${hnro}`);
  }

  getNroconvenio(nroconvenio: number) {
    return this.http.get<Convenios>(`${baseUrl}?nroconvenio=${nroconvenio}`);
  }

  getById(idconvenio: number): Observable<Convenios> {
    return this.http.get<Convenios>(`${baseUrl}/${idconvenio}`);
  }

  saveConvenio(convenio: Convenios): Observable<Object> {
    return this.http.post(baseUrl, convenio);
  }

  update(idconvenio: number, convenio: Convenios): Observable<Object> {
    return this.http.put(`${baseUrl}/${idconvenio}`, convenio);
  }

  updateWithAudit(
    idconvenio: number,
    convenio: Convenios,
    usumodi: number = 0,
    tipo: string = 'MODIFICACION',
    observacion: string = 'Actualización de convenio'
  ): Observable<Object> {
    return this.http.put(
      `${baseUrl}/${idconvenio}?usumodi=${usumodi}&tipo=${encodeURIComponent(tipo)}&observacion=${encodeURIComponent(observacion)}`,
      convenio
    );
  }

  updateEstado(
    idconvenio: number,
    estado: number,
    usumodi: number = 0,
    observacion: string = 'Cambio de estado de convenio',
    tipo: string = 'CAMBIO_DE_ESTADO'
  ): Observable<Object> {
    return this.http.put(
      `${baseUrl}/${idconvenio}/estado?estado=${estado}&usumodi=${usumodi}&observacion=${encodeURIComponent(observacion)}&tipo=${encodeURIComponent(tipo)}`,
      null
    );
  }

  deleteConvenio(idconvenio: number): Observable<Object> {
    return this.http.delete(`${baseUrl}/${idconvenio}`);
  }
  getByReferencia(referencia: string) {
    return this.http.get<Convenios>(
      `${baseUrl}/referencia?referencia=${referencia}`
    );
  }
  getByEstadoConvenios() {
    return this.http.get<any>(`${baseUrl}/estados`);
  }
  getByPendientesPagos(d: number, h: number, page: number, size: number) {
    return this.http.get<any>(
      `${baseUrl}/pendientesPago?d=${d}&h=${h}&page=${page}&size=${size}`
    );
  }
  getPendienteByConvenio(idconvenio: number) {
    return this.http.get<any>(`${baseUrl}/pendiente?idconvenio=${idconvenio}`);
  }
  findDatosConvenio(idconvenio: number) {
    return this.http.get(`${baseUrl}/datosOne?idconvenio=${idconvenio}`);
  }

  buscarConvenios(
    filtros: {
      nroDesde?: number | null;
      nroHasta?: number | null;
      nombre?: string | null;
      estado?: number | null;
      minPendientes?: number | null;
      maxPendientes?: number | null;
      cuenta?: number | null;
      page?: number;
      size?: number;
    }
  ): Observable<PageResponse<any>> {
    let params = new HttpParams()
      .set('page', String(filtros.page ?? 0))
      .set('size', String(filtros.size ?? 20));

    if (filtros.nroDesde != null) params = params.set('nroDesde', String(filtros.nroDesde));
    if (filtros.nroHasta != null) params = params.set('nroHasta', String(filtros.nroHasta));

    const nombre = (filtros.nombre ?? '').trim();
    if (nombre) params = params.set('nombre', nombre);

    if (filtros.estado != null) params = params.set('estado', String(filtros.estado));
    if (filtros.minPendientes != null) params = params.set('minPendientes', String(filtros.minPendientes));
    if (filtros.maxPendientes != null) params = params.set('maxPendientes', String(filtros.maxPendientes));
    if (filtros.cuenta != null) params = params.set('cuenta', String(filtros.cuenta));

    return this.http.get<PageResponse<any>>(`${baseUrl}/buscar`, { params });
  }

  getConveniosSinPendientes(estado?: number | null): Observable<any[]> {
    let params = new HttpParams();
    if (estado != null) params = params.set('estado', String(estado));
    return this.http.get<any[]>(`${baseUrl}/sin-pendientes`, { params });
  }

  getConveniosConPendientes(estado?: number | null): Observable<any[]> {
    let params = new HttpParams();
    if (estado != null) params = params.set('estado', String(estado));
    return this.http.get<any[]>(`${baseUrl}/con-pendientes`, { params });
  }

  marcarConveniosPagados(
    usumodi: number = 0,
    observacion: string = 'Actualización masiva de convenios pagados',
    tipo: string = 'CAMBIO_DE_ESTADO'
  ): Observable<Convenios[]> {
    const params = new HttpParams()
      .set('usumodi', String(usumodi))
      .set('observacion', observacion)
      .set('tipo', tipo);
    return this.http.put<Convenios[]>(`${baseUrl}/marcar-pagados`, null, { params });
  }
}
