import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, firstValueFrom } from 'rxjs';
import { Cuentas } from 'src/app/modelos/contabilidad/cuentas.model';
import { environment } from 'src/environments/environment';

const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/cuentas`;

@Injectable({
   providedIn: 'root',
})

export class CuentasService {

   constructor(private http: HttpClient) { }

   //Busca la lista de cuentas por Código y/o Nombre
   getByCodigoyNombre(codcue: String, nomcue: String) {
      return this.http.get<Cuentas[]>(`${baseUrl}/lista?codcue=${codcue}&nomcue=${nomcue}`);
   }
   //Busca la lista de cuentas por Código y/o Nombre Async
   async getByCodigoyNombreAsync(codcue: String, nomcue: String): Promise<any[]> {
      const resp = await firstValueFrom(this.http.get<any[]>(`${baseUrl}/lista?codcue=${codcue}&nomcue=${nomcue}`));
      return resp;
   }

   getListaCuentas(): Observable<Cuentas[]> {
      return this.http.get<Cuentas[]>(baseUrl);
   }

   //Cuenta por codcue
   getByCodcue(codcue: String): Observable<any> {
      return this.http.get<Cuentas>(`${baseUrl}?codcue=${codcue}`);
   }

   //Cuenta por nomcue
   getByNomcue(nomcue: String): Observable<any> {
      return this.http.get<Cuentas>(`${baseUrl}?nomcue=${nomcue}`);
   }

   //Valida codcue
   valCodcue(codcue: string) {
      return this.http.get<boolean>(`${baseUrl}/valcodcue?codcue=${codcue}`);
   }

   //Valida nomcue
   valNomcue(nomcue: string) {
      return this.http.get<boolean>(`${baseUrl}/valnomcue?nomcue=${nomcue}`);
   }

   //Verifica Desagregación Async
   async valDesagrega(codcue: String, nivcue: number): Promise<any> {
      const response = await firstValueFrom(this.http.get<any>(`${baseUrl}/desagrega?codcue=${codcue}&nivcue=${nivcue}`));
      return response;
   }

   //Bancos
   getBancos() {
      return this.http.get(`${baseUrl}/bancos`);
   }

   getByAsoHaber(asohaber: String) {
      return this.http.get<Cuentas>(`${baseUrl}?asohaber=${asohaber}`);
   }

   //Cuentas por Tiptran
   getByTiptran(tiptran: number, codcue: String) {
      return this.http.get<Cuentas[]>(`${baseUrl}/porTiptran?tiptran=${tiptran}&codcue=${codcue}`);
   }

   //Nombre de cuenta (Too ok con any[] )
   getNombre(codcue: String): Observable<Object[]> {
      return this.http.get<Object[]>(`${baseUrl}/nombre/${codcue}`);
   }

   //Cuenta por codcue
   getCuentaByCodcue(codcue: String) {
      return this.http.get<Cuentas>(`${baseUrl}/detalle?codcue=${codcue}`);
   }

   //Cuentas de costos
   getCuecostos() {
      return this.http.get<Cuentas[]>(`${baseUrl}/cuecostos`);
   }

   getById(idcuenta: number) {
      return this.http.get<Cuentas>(baseUrl + "/" + idcuenta);
   }

   getBySigef(sigef: boolean) {
      return this.http.get<Cuentas[]>(`${baseUrl}/sigef/${sigef}`);
   }

   //Cuentas por tiptran y codcue para datalist
   findByTiptran(tiptran: number, codcue: String) {
      return this.http.get<Cuentas[]>(`${baseUrl}/porTiptran?tiptran=${tiptran}&codcue=${codcue}`);
   }

   saveCuenta(cuentas: Cuentas): Observable<Object> {
      return this.http.post(baseUrl, cuentas);
   }

   deleteCuenta(idcuenta: number): Observable<Object> {
      return this.http.delete(`${baseUrl}/${idcuenta}`);
   }

   updateCuenta(idcuenta: number, cuenta: Cuentas): Observable<Object> {
      return this.http.put(baseUrl + "/" + idcuenta, cuenta);
   }

}
