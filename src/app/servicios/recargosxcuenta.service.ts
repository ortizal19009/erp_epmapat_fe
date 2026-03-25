import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { ValidarBatchRequest } from '../interfaces/recargosxcuenta/validarBatchRequest';
import { Observable } from 'rxjs';
import { ValidarBatchResponse } from '../interfaces/recargosxcuenta/validarBatchResponse';
import { RecargosxcuentaPayload } from '../interfaces/recargosxcuenta/recargosxcuentaPayload';
import { RecargosxcuentaDeleteReq } from '../interfaces/recargosxcuenta/recargosxcuentaDeleteReq';
import { RecargoXCtaReq } from '../interfaces/recargosxcuenta/recargoXCtaReq';

const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/recargosxcuenta`;

@Injectable({
  providedIn: 'root'
})
export class RecargosxcuentaService {

  constructor(private http: HttpClient) { }

  getRecargosxcuentaByEmision(idemision: number) {
    return this.http.get(`${baseUrl}/byEmision?idemision=${idemision}`);
  }

  validarBatch(req: ValidarBatchRequest): Observable<ValidarBatchResponse> {
    return this.http.post<ValidarBatchResponse>(`${baseUrl}/validar`, req);
  }

  guardarBatch(payload: RecargosxcuentaPayload[]): Observable<any> {
    return this.http.post(`${baseUrl}/batch`, payload);
  }

  actualizar(id: number, req: RecargoXCtaReq): Observable<any> {
    return this.http.put(`${baseUrl}/${id}`, req);
  }

  eliminar(id: number, req: RecargosxcuentaDeleteReq): Observable<void> {
    return this.http.delete<void>(`${baseUrl}/${id}`, { body: req });
  }
}
