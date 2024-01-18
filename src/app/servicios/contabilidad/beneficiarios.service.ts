import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Beneficiarios } from 'src/app/modelos/contabilidad/beneficiarios.model';
import { environment } from 'src/environments/environment';

const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/beneficiarios`;

@Injectable({
   providedIn: 'root'
})
export class BeneficiariosService {

   constructor(private http: HttpClient) { }

   findByGrupo(nombre: string, idgrupo: number) {
      return this.http.get<Beneficiarios[]>(
         `${baseUrl}/benGroup/${nombre}/${idgrupo}`
      );
   }

   findByNombre(nombre: string) {
      return this.http.get<Beneficiarios[]>(`${baseUrl}/benName/${nombre}`);
   }


   //No hace falta
   // generateDatalistOptions(responsables: any[]): string {
   //    let datalistOptions = '';
   //    for (const responsable of responsables) {
   //       datalistOptions += `<option value="${responsable.nomben}" data-id="${responsable.idbene}"></option>`;
   //    }

   //    return datalistOptions;
   // }

}
