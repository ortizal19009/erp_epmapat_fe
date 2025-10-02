import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Itemxfact } from '../modelos/itemxfact.model';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/itemxfact`;

@Injectable({
   providedIn: 'root'
})

export class ItemxfactService {

   constructor(private http: HttpClient) { }

   getByIdfacturacion(idfacturacion: number) {
      return this.http.get<Itemxfact>(`${baseUrl}?idfacturacion=${idfacturacion}`);
   }

   //Movimientos por Producto
   getByIdcatalogoitems(idcatalogoitems: number) {
      return this.http.get<Itemxfact>(`${baseUrl}?idcatalogoitems=${idcatalogoitems}`);
   }

   //Guardar nuevo
   save(itemxfact: Itemxfact) {  //: Observable<Object>
      return this.http.post(baseUrl, itemxfact);
   }

}
