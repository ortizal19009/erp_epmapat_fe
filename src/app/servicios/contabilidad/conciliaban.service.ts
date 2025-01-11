import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Conciliaban } from 'src/app/modelos/contabilidad/conciliaban.model';
import { environment } from 'src/environments/environment';

const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/conciliaban`;

@Injectable({
   providedIn: 'root',
})

export class ConciliabanService {

   constructor(private http: HttpClient) { }

   getAllConciliaBancos() {
      return this.http.get(`${baseUrl}`);
   }

   //Conciliación de una cuenta y un mes
   getByIdcuentaMes(idcuenta: number, mes: number) {
      return this.http.get(`${baseUrl}/?idcuenta=${idcuenta}&mes=${mes}`);
   }
   //Conciliación de una cuenta y un mes Async
   async getByIdcuentaMesAsync(idcuenta: number, mes: number): Promise<Conciliaban[]> {
      const observable = this.http.get<Conciliaban[]>(`${baseUrl}/?idcuenta=${idcuenta}&mes=${mes}`);
      return await firstValueFrom(observable);
   }

   updateConciliaBan(conciliaban: Conciliaban) {
      return this.http.put(`${baseUrl}/${conciliaban.idconcilia}`, conciliaban);
   }

   saveConciliaBan(conciliaban: Conciliaban) {
      return this.http.post(`${baseUrl}/saveconcilia`, conciliaban);
   }

}
