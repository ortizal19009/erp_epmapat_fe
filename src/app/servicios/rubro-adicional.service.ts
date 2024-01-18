import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { RubroAdicional } from '../modelos/rubro-adicional';
import { environment } from 'src/environments/environment';

const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/rubroadicional`;

@Injectable({
  providedIn: 'root'
})

export class RubroAdicionalService {
  
  constructor(private http:HttpClient) { }

  getAllRubrosAdicional():Observable<RubroAdicional[]>{
    return this.http.get<RubroAdicional[]>(`${baseUrl}`);
  }

  getRubAdiByIdTpTram(idtptramite: number){
    return this.http.get<RubroAdicional[]>(`${baseUrl}/tptramite/${idtptramite}`);
  }

}
