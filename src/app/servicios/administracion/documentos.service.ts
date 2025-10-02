import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Documentos } from '../../modelos/administracion/documentos.model';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/documentos`;

@Injectable({
   providedIn: 'root'
})

export class DocumentosService {

   constructor(private http: HttpClient) { }

   getListaDocumentos(): Observable<Documentos[]> {
      return this.http.get<Documentos[]>(baseUrl);
   }

   //   async getListaDocumentos(): Promise<Documentos> {
   //     const observable = this.http.get<Documentos>(baseUrl);
   //     return await firstValueFrom(observable);
   //  }

   //Validar por nombre de Documento
   getByNomdoc(nomdoc: String): Observable<any> {
      return this.http.get<Documentos>(`${baseUrl}?nomdoc=${nomdoc}`);
   }

   saveDocumento(documentos: Documentos): Observable<Object> {
      return this.http.post(baseUrl, documentos);
   }

   deleteDocumento(iddocumento: number): Observable<Object> {
      return this.http.delete(`${baseUrl}/${iddocumento}`);
   }

   getById(iddocumento: number) {
      return this.http.get<Documentos>(baseUrl + "/" + iddocumento);
   }

   updateDocumento(iddocumento: number, documento: Documentos): Observable<Object> {
      return this.http.put(baseUrl + "/" + iddocumento, documento);
   }

}
