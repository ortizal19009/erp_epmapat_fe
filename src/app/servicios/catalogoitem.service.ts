import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Catalogoitems } from '../modelos/catalogoitems.model';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/catalogoitems`;

@Injectable({
   providedIn: 'root'
})

export class CatalogoitemService {

   constructor(private http: HttpClient) { }

   getProductos(idmodulo1: number, idmodulo2: number, descripcion: String): Observable<Catalogoitems[]> {
      return this.http.get<Catalogoitems[]>(`${baseUrl}?idmodulo1=${idmodulo1}&idmodulo2=${idmodulo2}&descripcion=${descripcion}`);
   }

   getByIdrubro(idrubro: number) {
      return this.http.get<Catalogoitems>(`${baseUrl}/rubro/${idrubro}`)
   }

   getByIdusoitems(idusoitems: number) {
      return this.http.get<Catalogoitems>(`${baseUrl}/usoitem/${idusoitems}`)
   }

   getById(idcatalogoitems: number) {
      return this.http.get<any>(`${baseUrl}/${idcatalogoitems}`);
   }

   getByNombre(idusoitems: number, descripcion: String): Observable<Catalogoitems[]> {
      // console.log("Busca: "+`${baseUrl}/valnombre?idusoitems=${idusoitems}&descripcion=${descripcion}`)
      return this.http.get<Catalogoitems[]>(`${baseUrl}/valnombre?idusoitems=${idusoitems}&descripcion=${descripcion}`);
   }

   save(catalogoitems: Catalogoitems): Observable<Object> {
      return this.http.post(baseUrl, catalogoitems);
   }

   updateProducto(idcatalogoitems: number, producto: Catalogoitems): Observable<Object> {
      return this.http.put(baseUrl + "/" + idcatalogoitems, producto);
    }

}
