import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, firstValueFrom, map } from 'rxjs';
import { Transaci } from 'src/app/modelos/contabilidad/transaci.model';
import { environment } from 'src/environments/environment';

const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/transaci`;

@Injectable({
   providedIn: 'root',
})

export class TransaciService {

   constructor(private http: HttpClient) { }

   //Movimientos de un Banco
   getMovibank(idcuenta: number, mes: number) {
      return this.http.get(`${baseUrl}/movibank?idcuenta=${idcuenta}&mes=${mes}`);
   }
   //Movimientos de un Bancos Async
   async getMovibankAsync(idcuenta: number, mes: number): Promise<any[]> {
      const resp = await firstValueFrom(this.http.get<any[]>(`${baseUrl}/movibank?idcuenta=${idcuenta}&mes=${mes}`));
      return resp;
   }

   //Cuentas (Transacciones) de un Asiento
   getTransaci(idasiento: number) {
      return this.http.get<Transaci[]>(`${baseUrl}/asiento?idasiento=${idasiento}`);
   }
   //Transacciones de un Asiento Async
   async getTransaciAsync(idasiento: number): Promise<any[]> {
      const resp = await firstValueFrom(this.http.get<any[]>(`${baseUrl}/asiento?idasiento=${idasiento}`));
      return resp;
   }

   //Verifica si una Cuenta tiene Transacciones
   tieneTransaci(codcue: string): Observable<boolean> {
      return this.http.get<boolean>(`${baseUrl}/tieneTransaci?codcue=${codcue}`);
   }

   //Verifica si una Cuenta tiene Transacciones Async
   async tieneTransaciAsync(codcue: string): Promise<any> {
      const response = await firstValueFrom(this.http.get<any>(`${baseUrl}/tieneTransaci?codcue=${codcue}`));
      return response;
   }

   //Verifica si un Asiento tiene Transacciones
   porIdasiento(idasiento: number): Observable<boolean> {
      return this.http.get<boolean>(`${baseUrl}/porIdasiento?idasiento=${idasiento}`);
   }

   //Cuentas (Transacciones) de una Cuenta
   getByCodcue(codcue: String, desde: Date, hasta: Date) {
      return this.http.get<Transaci[]>(`${baseUrl}/mayor?codcue=${codcue}&desde=${desde}&hasta=${hasta}`);
   }
   //Cuentas (Transacciones) de una Cuenta Async
   async getByCodcueAsync(codcue: String, desde: Date, hasta: Date): Promise<any[]> {
      const response = await firstValueFrom(this.http.get<any[]>(`${baseUrl}/mayor?codcue=${codcue}&desde=${desde}&hasta=${hasta}`));
      return response;
   }

   //Saldo anterior de una Cuenta Async
   async saldoAsync(codcue: String, hasta: Date): Promise<any> {
      const response = await firstValueFrom(this.http.get<any>(`${baseUrl}/saldo?codcue=${codcue}&hasta=${hasta}`));
      return response;
   }

   sumValor(codcue: string, debcre: number, desde: Date, hasta: Date): Observable<number> {
      return this.http.get<number>(`${baseUrl}/sumValor?codcue=${codcue}&debcre=${debcre}&desde=${desde}&hasta=${hasta}`);
   }

   updateTransaci(transaci: Transaci) {
      return this.http.put(`${baseUrl}/updtransaci/${transaci.inttra}`, transaci);
   }

   //Actualiza indicando el Id
   updateTransaci1(idtransa: number, transaci: Transaci): Observable<Object> {
      return this.http.put(`${baseUrl}/${idtransa}`, transaci);
   }

   getFecha(desdeFecha: Date, hastaFecha: Date): Observable<Transaci[]> {
      return this.http.get<Transaci[]>(`${baseUrl}?desdeFecha=${desdeFecha}&hastaFecha=${hastaFecha}`);
   }

   //OJO: Se usa?
   saveTransaci(transaci: any) {
      return this.http.post(`${baseUrl}`, transaci);
   }

   saveTransa(transaci: Transaci): Observable<Object> {
      return this.http.post(`${baseUrl}`, transaci);
   }

   //Save con retorno del idtransa generado (no se usa porque debe devolver el registro completo para colocar en benxtran)
   saveTransaIdOld(transaci: Transaci): Observable<any> {
      return this.http.post(`${baseUrl}`, transaci).pipe(
         map((response: any) => {
            const id = response.idtransa;
            return id;
         })
      );
   }

   // getByInttra(inttra: number) {
   //    return this.http.get<Transaci[]>(`${baseUrl}/${inttra}`);
   // }

   getById(inttra: number) {
      return this.http.get<Transaci>(baseUrl + "/" + inttra);
   }

   deleteTransaci(idtransa: number) {
      return this.http.delete(`${baseUrl}/${idtransa}`);
   }

   //Balance de comprobación
   getBalance(desdeFecha: Date, hastaFecha: Date) {
      return this.http.get<number>(`${baseUrl}/balance?desdeFecha=${desdeFecha}&hastaFecha=${hastaFecha}`);
   }

   //Estado de situación
   getEstados(intgrupo: number, desdeFecha: Date, hastaFecha: Date) {
      return this.http.get<number>(`${baseUrl}/estados?intgrupo=${intgrupo}&desdeFecha=${desdeFecha}&hastaFecha=${hastaFecha}`);
   }

   //Flujo del efectivo
   getTotalFlujo(codcue: String, desdeFecha: Date, hastaFecha: Date, debcre: number) {
      return this.http.get<number>(`${baseUrl}/flujo?codcue=${codcue}&desdeFecha=${desdeFecha}&hastaFecha=${hastaFecha}&debcre=${debcre}`);
   }

   getByTipAsi(tipasi: number) {
      return this.http.get<Transaci[]>(`${baseUrl}/tipasi?tipasi=${tipasi}`);
   }

   getAperIni(codcue: string) {
      return this.http.get<Transaci[]>(`${baseUrl}/aperini?codcue=${codcue}`);
   }

   getByAsientoFec(periodo: any, codcue: String) {
      let date: Date = new Date();
      let year = date.getFullYear();
      const fecha = new Date(`${year}-${+periodo! + 1}-01`);
      const fechaAnterior = fecha.setDate(fecha.getDate() - 1);
      let fec = new Date(fechaAnterior);
      let day = fec.toDateString().split(' ').slice(2, 3);
      let d = `${year}-${periodo}-01`;
      let h = `${fec.getFullYear()}-${periodo}-${day}`;
      return this.http.get<Transaci[]>(
         `${baseUrl}/asientos?d=${d}&h=${h}&codcue=${codcue}`
      );
   }

   //Transacciones por numero de asiento y fechas Async
   async tranAsientosAsync(opcion: number, desdeNum: number, hastaNum: number, desdeFecha: Date, hastaFecha: Date): Promise<any[]> {
      const response = await firstValueFrom(this.http.get<any[]>(`${baseUrl}/asientos?opcion=${opcion}&desdeNum=${desdeNum}&hastaNum=${hastaNum}&desdeFecha=${desdeFecha}&hastaFecha=${hastaFecha}`));
      return response;
   }
}
