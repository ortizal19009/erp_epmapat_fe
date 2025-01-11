import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, firstValueFrom, map } from 'rxjs';
import { Beneficiarios } from 'src/app/modelos/contabilidad/beneficiarios.model';
import { environment } from 'src/environments/environment';

const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/beneficiarios`;

@Injectable({
   providedIn: 'root'
})
export class BeneficiariosService {

   constructor(private http: HttpClient) { }

   //Beneficiarios por Nombre, Código y/o RUC/CI
   getBeneficiarios(nomben: String, codben: String, rucben: String, ciben: String) {
      return this.http.get<Beneficiarios[]>(`${baseUrl}?nomben=${nomben}&codben=${codben}&rucben=${rucben}&ciben=${ciben}`);
   }
   //Beneficiarios por Nombre, Código y/o RUC/CI Aync
   async getBeneficiariosAsync(nomben: String, codben: String, rucben: String, ciben: String): Promise<any[]> {
      const resp = await firstValueFrom(this.http.get<any[]>(`${baseUrl}?nomben=${nomben}&codben=${codben}&rucben=${rucben}&ciben=${ciben}`));
      return resp;
   }

   //Validar el nombre del beneficiario
   valNomben(nomben: string) {
      return this.http.get<boolean>(`${baseUrl}/valnomben?nomben=${nomben}`);
   }

   //Validar el código  del beneficiario
   valCodben(codben: string) {
      return this.http.get<boolean>( `${baseUrl}/valcodben?codben=${codben}` );
   }

   //Validar el RUC del Beneficiario
   valRucben(rucben: string) {
      return this.http.get<boolean>(`${baseUrl}/valrucben?rucben=${rucben}`);
   }

   //Validar la Cédula del Beneficiario
   valCiben(ciben: string) {
      return this.http.get<boolean>(`${baseUrl}/valciben?ciben=${ciben}`);
   }

   //Siguiente Código
   siguienteCodigo(idgrupo: number): Observable<string> {
      return this.http.get(`${baseUrl}/siguicodigo?idgrupo=${idgrupo}`, { responseType: 'text' });
   }

   findByGrupo(nomben: string, idgrupo: number) {
      // console.log( `${baseUrl}/nombreygrupo?nomben=${nomben}&idgrupo=${idgrupo}}` )
      return this.http.get<Beneficiarios[]>( `${baseUrl}/nombreygrupo?nomben=${nomben}&idgrupo=${idgrupo}}` );
   }

   //Beneficiario por nombre para datalist
   findByNomben(nomben: string) {
      return this.http.get<Beneficiarios[]>(`${baseUrl}/nomben?nomben=${nomben}`);
   }

   //Cuenta los Beneficiario por Idifinan
   countByIdifinan(idifinan: number) {
      return this.http.get<number>(`${baseUrl}/countByIdifinan?idifinan=${idifinan}`);
   }

   save(beneficiario: Beneficiarios): Observable<Object> {
      return this.http.post(baseUrl, beneficiario);
   }

   getById(idbene: number) {
      return this.http.get<Beneficiarios>(baseUrl + "/" + idbene);
   }

   updateBeneficiario(idbene: number, beneficiario: Beneficiarios): Observable<Object> {
      return this.http.put(baseUrl + "/" + idbene, beneficiario);
   }
   // updateCerti(idcerti: number, certipresu: Certipresu): Observable<Object> {
   //    return this.http.put(`${baseUrl}/${idcerti}`, certipresu);
   // }
   deleteBeneficiario(idbene: number) {
      return this.http.delete(`${baseUrl}/${idbene}`);
   }

}
