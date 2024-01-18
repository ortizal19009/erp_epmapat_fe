import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
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

   getListaCuentas(): Observable<Cuentas[]> {
      return this.http.get<Cuentas[]>(baseUrl);
   }

   //Validar por código de la Cuenta
   getByCodcue(codcue: String): Observable<any> {
      return this.http.get<Cuentas>(`${baseUrl}?codcue=${codcue}`);
   }

   //Validar por nombre de la Cuenta
   getByNomcue(nomcue: String): Observable<any> {
      return this.http.get<Cuentas>(`${baseUrl}?nomcue=${nomcue}`);
   }

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

   saveCuenta(cuentas: Cuentas): Observable<Object> {
      return this.http.post(baseUrl, cuentas);
   }

   deleteCuenta(idcuenta: number): Observable<Object> {
      return this.http.delete(`${baseUrl}/${idcuenta}`);
   }

   getById(idcuenta: number) {
      return this.http.get<Cuentas>(baseUrl + "/" + idcuenta);
   }

   updateCuenta(idcuenta: number, cuenta: Cuentas): Observable<Object> {
      return this.http.put(baseUrl + "/" + idcuenta, cuenta);
   }

}
