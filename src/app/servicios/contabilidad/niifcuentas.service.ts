import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, firstValueFrom } from 'rxjs';
import { Niifcuentas } from 'src/app/modelos/contabilidad/niifcuentas.model';
import { environment } from 'src/environments/environment';

const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/niifcuentas`;

@Injectable({
   providedIn: 'root'
})

export class NiifcuentasService {

   constructor(private http: HttpClient) { }

   // getAllCuentasNiif(): Observable<Niifcuentas[]> {
   //    return this.http.get<Niifcuentas[]>(`${baseUrl}`);
   // }

   //Cuentas NIIF por código y nombre
   getByCodigoyNombre(codcue: string, nomcue: string) {
      return this.http.get<Niifcuentas[]>(`${baseUrl}?codcue=${codcue}&nomcue=${nomcue}`);
   }
   //Cuentas NIIF por código y nombre Async
   async getByCodigoyNombreAsync(codcue: string, nomcue: string): Promise<any[]> {
      const resp = await firstValueFrom(this.http.get<any[]>(`${baseUrl}?codcue=${codcue}&nomcue=${nomcue}`));
      return resp;
   }

   //Cuentas NIIF por código
   getByCodcue(codcue: string) {
      return this.http.get<Niifcuentas[]>(`${baseUrl}/codcue/${codcue}`);
   }

   // getByNomCue(nomcue: string) {
   //    return this.http.get<Niifcuentas[]>(`${baseUrl}/nomCue/${nomcue}`);
   // }

   saveNiifCuenta(niifcuenta: Niifcuentas) {
      return this.http.post(`${baseUrl}`, niifcuenta);
   }

   updateNiifCuenta(niifcuenta: Niifcuentas) {
      return this.http.post(`${baseUrl}/upd/${niifcuenta.idniifcue}`, niifcuenta
      );
   }

}
