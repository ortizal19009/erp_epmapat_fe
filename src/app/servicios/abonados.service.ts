import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, firstValueFrom } from 'rxjs';
import { Abonados } from '../modelos/abonados';
import { environment } from 'src/environments/environment';
import { AbonadosFilters } from '../interfaces/abonados_filters_interface';
import { PageResponse } from '../interfaces/page-response';

const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/abonados`;

@Injectable({ providedIn: 'root' })
export class AbonadosService {
  constructor(private http: HttpClient) { }

  async getById_v2(idabonado: number) {
    return this.http.get<Abonados>(`${baseUrl}/${idabonado}`);
  }

  getOneAbonado(idabonado: number) {
    return this.http.get<Abonados>(`${baseUrl}/oneabonado?idabonado=${idabonado}`);
  }

  tmpTodos(): Observable<Abonados[]> {
    return this.http.get<Abonados[]>(`${baseUrl}/tmp`);
  }

  getListaAbonados(): Observable<Abonados[]> {
    return this.http.get<Abonados[]>(`${baseUrl}`);
  }

  saveAbonado(abonado: Abonados): Observable<Object> {
    return this.http.post(`${baseUrl}`, abonado);
  }

  deleteAbonado(idabonado: number): Observable<Object> {
    return this.http.delete(`${baseUrl}/${idabonado}`);
  }

  getByIdabonado(idabonado: number): Observable<Abonados> {
    return this.http.get<Abonados>(`${baseUrl}?idabonado=${idabonado}`);
  }

  getById(idabonado: number): Observable<Abonados> {
    return this.http.get<Abonados>(`${baseUrl}/${idabonado}`);
  }

  getListaByNombreCliente(nombre: string) {
    return this.http.get<Abonados>(`${baseUrl}/ncliente/${nombre}`);
  }

  getListaByidentIficacionCliente(identificacion: string) {
    return this.http.get<Abonados>(`${baseUrl}/icliente/${identificacion}`);
  }

  getListaByidabonado(idabonado: number) {
    return this.http.get<Abonados>(`${baseUrl}/cuenta/${idabonado}`);
  }

  unAbonado(idabonado: number): Observable<Abonados> {
    return this.http.get<Abonados>(`${baseUrl}/unabonado?idabonado=${idabonado}`);
  }

  updateAbonado(abonado: any): Observable<any> {
    return this.http.put<any>(`${baseUrl}/${abonado.idabonado}`, abonado);
  }

  updateAbonadoAuditoria(abonado: any, usumodi: number, observacion: string, tipo: string = 'MODIFICACION'): Observable<any> {
    const params = { usumodi, tipo, observacion };
    return this.http.put<any>(`${baseUrl}/${abonado.idabonado}`, abonado, { params });
  }

  uploadFotosAbonado(
    idabonado: number,
    fotos: { fotocasa?: File | null; fotomedidor?: File | null },
    usumodi: number,
    observacion: string,
    tipo: string = 'MODIFICACION'
  ): Observable<Abonados> {
    const formData = new FormData();

    if (fotos.fotocasa) {
      formData.append('fotocasa', fotos.fotocasa);
    }

    if (fotos.fotomedidor) {
      formData.append('fotomedidor', fotos.fotomedidor);
    }

    formData.append('usumodi', usumodi.toString());
    formData.append('observacion', observacion);
    formData.append('tipo', tipo);

    return this.http.post<Abonados>(`${baseUrl}/${idabonado}/fotos`, formData);
  }

  getFotoCasaUrl(idabonado: number): string {
    return `${baseUrl}/${idabonado}/fotocasa`;
  }

  getFotoMedidorUrl(idabonado: number): string {
    return `${baseUrl}/${idabonado}/fotomedidor`;
  }

  getAbonadoByQuery(dato: String) {
    return this.http.get<Abonados>(`${baseUrl}?consulta=${dato}`);
  }

  saveSerxAbo(idabonado: number, idservicio: number): Observable<Object> {
    return this.http.put(`${baseUrl}/${idabonado}/s/${idservicio}`, null);
  }

  getByIdcliente(idcliente: number) {
    return this.http.get<Abonados>(`${baseUrl}?idcliente=${idcliente}`);
  }

  getByIdruta(idruta: number) {
    return this.http.get<Abonados[]>(`${baseUrl}?idruta=${idruta}`);
  }

  async getByIdrutaAsync(idruta: number): Promise<Abonados[]> {
    return await firstValueFrom(this.http.get<Abonados[]>(`${baseUrl}?idruta=${idruta}`));
  }

  tieneAbonados(idcliente: number): Observable<boolean> {
    return this.http.get<boolean>(`${baseUrl}/clienteTieneAbonados?idcliente=${idcliente}`);
  }

  getListaById(idabonado: number) {
    return this.http.get<Abonados>(`${baseUrl}/${idabonado}`);
  }

  getByidabonado(idabonado: number) {
    return this.http.get<Abonados[]>(`${baseUrl}/cuenta/${idabonado}`);
  }

  getByEstado(estado: number) {
    return this.http.get<Abonados>(`${baseUrl}/estado/${estado}`);
  }

  getByIdCliente(idcliente: number) {
    return this.http.get<Abonados[]>(`${baseUrl}/cliente?idcliente=${idcliente}`);
  }

  getCampos(): Observable<Abonados[]> {
    return this.http.get<Abonados[]>(`${baseUrl}/campos`);
  }

  async getDeudasCuentasByRuta(idruta: number) {
    return await firstValueFrom(this.http.get(`${baseUrl}/deudas?idruta=${idruta}`));
  }

  async DeudasCuentasByRuta(idruta: number) {
    return await firstValueFrom(this.http.get(`${baseUrl}/deudasByRuta?idruta=${idruta}`));
  }

  getResAbonado(cuenta: number) {
    return this.http.get(`${baseUrl}/resabonado?idabonado=${cuenta}`);
  }

  getResAbonadoNombre(nombre: string) {
    return this.http.get(`${baseUrl}/resabonado/nombre?nombre=${nombre}`);
  }

  getResAbonadoIdentificacion(identificacion: string) {
    return this.http.get(`${baseUrl}/resabonado/identificacion?identificacion=${identificacion}`);
  }

  getResAbonadoCliente(idcliente: number) {
    return this.http.get(`${baseUrl}/resabonado/idcliente?idcliente=${idcliente}`);
  }

  getResAbonadoResponsable(idresponsable: number) {
    return this.http.get(`${baseUrl}/resabonado/respago?idresp=${idresponsable}`);
  }

  getResAbonadoByEstado(estado: number) {
    return this.http.get(`${baseUrl}/estado/${estado}`);
  }

  getResAbonadoByRuta(idruta: number) {
    return this.http.get(`${baseUrl}/resabonado/ruta?idruta=${idruta}`);
  }

  getResAbonadoByCategoria(idcategoria: number) {
    return this.http.get(`${baseUrl}/resabonado/categoria?idcategoria=${idcategoria}`);
  }

  getCuentasByCategoria() {
    return firstValueFrom(this.http.get(`${baseUrl}/ncuentasByCategoria`));
  }

  getCuentasByEstado() {
    return firstValueFrom(this.http.get(`${baseUrl}/ncuentasByEstado`));
  }

  getResAbonadoCliente2(idcliente: number) {
    return this.http.get(`${baseUrl}/resabonado/idcliente?idcliente=${idcliente}`);
  }

  getAbonadosByCategoriaPageable(idcategoria: number, page: number, size: number): Observable<PageResponse<Abonados>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', 'idabonado,asc');
    return this.http.get<PageResponse<Abonados>>(`${baseUrl}/categoria/${idcategoria}/pageable`, { params });
  }

  getAbonadosByEstadoPageable(estado: number, page: number, size: number): Observable<PageResponse<Abonados>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', 'idabonado,asc');
    return this.http.get<PageResponse<Abonados>>(`${baseUrl}/estado/${estado}/pageable`, { params });
  }

  getAbonadosByRutaPageable(idruta: number, page: number, size: number): Observable<PageResponse<Abonados>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', 'idabonado,asc');
    return this.http.get<PageResponse<Abonados>>(`${baseUrl}/ruta/${idruta}/pageable`, { params });
  }

  getAbonadosPage(
    page: number,
    size: number,
    sort: string = 'idabonado,asc',
    filters: AbonadosFilters = {}
  ): Observable<PageResponse<Abonados>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', sort);

    if (filters.idruta != null)     params = params.set('idruta', filters.idruta.toString());
    if (filters.estado != null)     params = params.set('estado', filters.estado.toString());
    if (filters.cuenta != null)     params = params.set('cuenta', filters.cuenta.toString());
    if (filters.idcategoria != null) params = params.set('idcategoria', filters.idcategoria.toString());

    const responsable = (filters.responsable ?? '').trim();
    if (responsable) params = params.set('responsable', responsable);

    const cedula = (filters.cedula ?? '').trim();
    if (cedula) params = params.set('cedula', cedula);

    const ruta = (filters.ruta ?? '').trim();
    if (ruta) params = params.set('ruta', ruta);

    return this.http.get<PageResponse<Abonados>>(`${baseUrl}/buscar`, { params });
  }
}
