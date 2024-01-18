import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { TramiteNuevo } from '../modelos/tramite-nuevo';
import { PdfService } from './pdf.service';
import { environment } from 'src/environments/environment';

const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/tramitenuevo`;

@Injectable({
  providedIn: 'root',
})

export class TramiteNuevoService {

  date: Date = new Date();
  
  constructor(private http: HttpClient, private s_pdf: PdfService) {}
  
  getListaTramiteNuevo(): Observable<TramiteNuevo[]> {
    return this.http.get<TramiteNuevo[]>(`${baseUrl}`);
  }
  
  saveTramiteNuevo(tramitenuevo: TramiteNuevo): Observable<Object> {
    return this.http.post(`${baseUrl}`, tramitenuevo);
  }
  
  deleteTramiteNuevo(idtramitenuevo: number): Observable<Object> {
    return this.http.delete(`${baseUrl}/${idtramitenuevo}`);
  }
  
  getListaById(idtramitenuevo: number) {
    return this.http.get<TramiteNuevo>(`${baseUrl}/${idtramitenuevo}`);
  }
  
  updateTramiteNuevo(tramitenuevo: TramiteNuevo): Observable<Object> {
    return this.http.put(`${baseUrl}/${tramitenuevo.idtramitenuevo}`, tramitenuevo );
  }
  
  getByIdAguaTramite(idaguatramite: number) {
    return this.http.get<TramiteNuevo>(`${baseUrl}/aguatramite/${idaguatramite}`);
  }

}
