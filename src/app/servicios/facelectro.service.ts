import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Facelectro } from '../modelos/facelectro.model';
import { environment } from 'src/environments/environment';

const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/facelectro`;

@Injectable({
  providedIn: 'root'
})

export class FacelectroService {

  constructor( private http:HttpClient) { }

  getByNrofac(nrofac: String){
    return this.http.get<Facelectro>(`${baseUrl}?nrofac=${nrofac}`)
  }
  // facelectro.idfacelectro no es clave foranea de ningún Tabla, ni se necesita eliminar. OJO: Y para detalle?
   getByIdfacelectro(idfacelectro: number): Observable<Facelectro>{
     return this.http.get<Facelectro>(`${baseUrl}/${idfacelectro}`);
   }
  //Facelectro por idcliente
  getByIdcliente(idcliente: number){
    return this.http.get<Facelectro>(`${baseUrl}?idcliente=${idcliente}`)
  }

}
