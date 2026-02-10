import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, of, throwError } from 'rxjs';
import { environment } from 'src/environments/environment';

const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/usrxrutas`;

@Injectable({
  providedIn: 'root',
})
export class UsrxrutaServiceService {
  constructor(private http: HttpClient) { }
  /** 🔹 Obtener todas las rutas */
  findAll(): Observable<any[]> {
    return this.http.get<any[]>(baseUrl);
  }

  /** 🔹 Obtener ruta por ID */
  findById(id: number): Observable<any> {
    return this.http.get<any>(`${baseUrl}/${id}`);
  }

  /** 🔹 Crear nueva ruta */
  save(data: any): Observable<any> {
    return this.http.post<any>(baseUrl, data);
  }

  /** 🔹 Actualizar ruta */
  update(id: number, data: any): Observable<any> {
    return this.http.put<any>(`${baseUrl}/${id}`, data);
  }

  /** 🔹 Buscar por usuario y emisión (maneja 404 como vacío) */
  findByUsuarioAndEmision(
    idusuario: number,
    idemision: number
  ): Observable<any> {
    return this.http
      .get<any>(`${baseUrl}/usuario/${idusuario}/emision/${idemision}`)
      .pipe(
        catchError((err) => {
          // ✅ 404 = no hay rutas asignadas (caso normal)
          if (err?.status === 404) {
            return of(null);
          }

          // ❌ otros errores sí se propagan
          return throwError(() => err);
        })
      );
  }


  findByEmision(idemision: number) {
    return this.http.get(`${baseUrl}/emision/${idemision}`);
  }
  getRutasOcupadas(idemision: number): Observable<any> {
    return this.http.get(`${baseUrl}/emision/${idemision}/rutas-ocupadas`);
  }

}
