import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Niifhomologa } from 'src/app/modelos/contabilidad/niifhomologa.model';
import { environment } from 'src/environments/environment';

const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/niifhomologa`;

@Injectable({
   providedIn: 'root'
})

export class NiifhomologaService {

   constructor(private http: HttpClient) { }

   getByIdNiifCue(idniifcue: number) {
      return this.http.get<Niifhomologa[]>(`${baseUrl}/niifcuenta?idniifcue=${idniifcue}`);
   }

   saveNiifHomologa(niifhomologa: Niifhomologa) {
      return this.http.post(`${baseUrl}`, niifhomologa);
   }

   getByIdCuenta(idcue: number) {
      return this.http.get(`${baseUrl}/cuenta?idcue=${idcue}`);
   }

   deleteById(idhomologa: number) {
      return this.http.delete(`${baseUrl}/${idhomologa}`);
   }

}
