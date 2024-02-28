import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Usuarios } from 'src/app/modelos/administracion/usuarios.model';
import { environment } from 'src/environments/environment';

const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/usuarios`;

@Injectable({
  providedIn: 'root'
})

export class UsuarioService {

  constructor(private http: HttpClient) { }

  getUsuarios(): Observable<Usuarios[]> {
    return this.http.get<Usuarios[]>(baseUrl);
  }

  //
  // getUsuario(a: String, b: String): Observable<boolean> {
  //   console.log(`${baseUrl}/usuario?a=${a}&b=${b}`)
  //   return this.http.get<boolean>(`${baseUrl}/usuario?a=${a}&b=${b}`);
  // }

  //Usuario
  getUsuario(a: String, b: String) {
    return this.http.get<Usuarios>(`${baseUrl}/usuario?a=${a}&b=${b}`);
  }

  getByIdentificacion(identificausu: string) {
    return this.http.get<Usuarios>(`${baseUrl}/identificacion?identificausu=${identificausu}`);
  }

  getByIdusuario(idusuario: number) {
    return this.http.get<Usuarios>(baseUrl + "/" + idusuario);
  }

  updateUsuario(idusuario: number, usuario: Usuarios): Observable<Object> {
    return this.http.put(baseUrl + "/" + idusuario, usuario);
  }


}
