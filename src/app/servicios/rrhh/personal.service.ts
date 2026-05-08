import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/api/personal`;

export interface PersonalSearchParams {
  page?: number;
  size?: number;
  sort?: string;
  direction?: 'asc' | 'desc';
  q?: string;
  nombres?: string;
  apellidos?: string;
  identificacion?: string;
  email?: string;
  celular?: string;
  cargo?: string;
  departamento?: string;
  direccion?: string;
  estadoLaboral?: string;
  tipoContrato?: string;
  usuarioSistema?: string;
  fechaIngresoDesde?: string;
  fechaIngresoHasta?: string;
  area?: string;
  sucursal?: string;
}

@Injectable({
  providedIn: 'root',
})
export class PersonalService {
  constructor(private http: HttpClient) {}

  getAllPersonal() {
    return this.http.get(`${baseUrl}`);
  }

  searchPersonal(params: PersonalSearchParams) {
    let httpParams = new HttpParams();
    Object.entries(params || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        httpParams = httpParams.set(key, String(value));
      }
    });

    return this.http.get(`${baseUrl}`, { params: httpParams });
  }

  savePaersonal(personal: any) {
    return this.http.post(`${baseUrl}`, personal);
  }

  getPersonalById(idpersonal: number) {
    return this.http.get(`${baseUrl}/${idpersonal}`);
  }

  updatePersonal(idpersonal: number, personal: any) {
    return this.http.put(`${baseUrl}/${idpersonal}`, personal);
  }

  deletePersonal(idpersonal: number) {
    return this.http.delete(`${baseUrl}/${idpersonal}`);
  }

  toggleEstado(idpersonal: number, activo: boolean) {
    return this.http.patch(`${baseUrl}/${idpersonal}/estado`, { activo });
  }

  crearUsuarioSistema(idpersonal: number, payload: any = {}) {
    return this.http.post(`${baseUrl}/${idpersonal}/usuario`, payload);
  }

  resetearPassword(idpersonal: number) {
    return this.http.post(`${baseUrl}/${idpersonal}/usuario/reset-password`, {});
  }

  descargarExpediente(idpersonal: number) {
    return this.http.get(`${baseUrl}/${idpersonal}/expediente`, {
      responseType: 'blob',
    });
  }
}
