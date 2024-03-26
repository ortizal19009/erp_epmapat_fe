import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { delay, Observable, of } from 'rxjs';
import { Categoria } from '../modelos/categoria.model';
import { environment } from 'src/environments/environment';

const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/categorias`;

@Injectable({
  providedIn: 'root',
})
export class CategoriaService {
  constructor(private http: HttpClient) {}

  getListCategoria(): Observable<Categoria[]> {
    return this.http.get<Categoria[]>(`${baseUrl}`);
  }

  //Categorias habilitadas ordenadas por código
  listaCategorias(): Observable<String[]> {
    return this.http.get<String[]>(`${baseUrl}/categorias`);
  }

  valNombre(descripcion: String): Observable<Categoria[]> {
    return this.http.get<Categoria[]>(`${baseUrl}?descripcion=${descripcion}`);
  }

  getUsedCategoria(idcategoria: number) {
    return this.http.get<Categoria[]>(`${baseUrl}?idused=${idcategoria}`);
  }

  saveCategoria(categoria: Categoria): Observable<Object> {
    return this.http.post(`${baseUrl}`, categoria);
  }

  deleteCategoria(idcategoria: number): Observable<Object> {
    return this.http.delete(`${baseUrl}/${idcategoria}`);
  }

  getById(idcategoria: number) {
    return this.http.get<Categoria>(`${baseUrl}/${idcategoria}`);
  }

  updateCategoria(categoria: Categoria): Observable<Object> {
    return this.http.put(`${baseUrl}/${categoria.idcategoria}`, categoria);
  }
}
