import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, firstValueFrom, concatMap, catchError, map, of, tap } from 'rxjs';
import Swal from 'sweetalert2';
import { Rutasxemision } from '../modelos/rutasxemision.model';
import { environment } from 'src/environments/environment';

const apiUrl = environment.API_URL;
const baseUrl = `${apiUrl}/rutasxemision`;

@Injectable({
  providedIn: 'root',
})
export class RutasxemisionService {
  constructor(private http: HttpClient) {}

  getByIdEmision(idemision: Number) {
    return this.http.get<Rutasxemision>(`${baseUrl}?idemision=${idemision}`);
  }

  getByQuery(dato: String) {
    return this.http.get<Rutasxemision>(`${baseUrl}?consulta=${dato}`);
  }

  getLista1(): Observable<Rutasxemision[]> {
    return this.http.get<Rutasxemision[]>(`${baseUrl}`);
  }

  getById(idrutaxemision: number) {
    return this.http.get<Rutasxemision>(`${baseUrl}/${idrutaxemision}`);
  }

  countEstado(idemision_emisiones: number) {
    return this.http.get<Rutasxemision>(
      `${baseUrl}/conteo?idemision_emisiones=${idemision_emisiones}`
    );
  }

  // getById1(idrutaxemision: number) {
  //   return this.http.get<Rutasxemision>(baseUrl + "/" + idrutaxemision);
  // }

  saveRutaxemision(ruxemi: Rutasxemision): Observable<any> {
    return this.http.post(baseUrl, ruxemi);
  }

  //Save una rutaxemision async
  async saveRutaxemisionAsync(ruxemi: Rutasxemision): Promise<any> {
    const observable = this.http.post(baseUrl, ruxemi);
    return await firstValueFrom(observable);
  }

  updateRutaxemision(
    idrutaemision: number,
    rutaxemision: any
  ): Observable<Object> {
    return this.http.put(
      baseUrl + '/' + idrutaemision,
      this.normalizarPayloadFechas(rutaxemision)
    ).pipe(this.notificarDespuesDeCerrar(idrutaemision, rutaxemision));
  }

  // rutasxemision.service.ts
update_Rutaxemision(
  idrutaemision: number,
  cambios: Partial<Rutasxemision>
): Observable<object> {
  return this.http.patch(
    `${baseUrl}/${idrutaemision}`,
    this.normalizarPayloadFechas(cambios)
  ).pipe(this.notificarDespuesDeCerrar(idrutaemision, cambios));
}


  getByEmisionRuta(idemision: number, idruta: number) {
    return this.http.get(
      `${baseUrl}/emiruta?idemision=${idemision}&idruta=${idruta}`
    );
  }

  notificarCierre(idrutaxemision: number): Observable<any> {
    return this.http.post(`${baseUrl}/${idrutaxemision}/notificar-cierre`, {});
  }

  private ultimoAvisoNotificaciones = 0;

  private avisoNotificaciones(texto: string) {
    if (Date.now() - this.ultimoAvisoNotificaciones < 10000) return;
    this.ultimoAvisoNotificaciones = Date.now();
    void Swal.fire({ icon: 'warning', title: 'Ruta cerrada: revisar notificaciones', text: texto });
  }

  private notificarDespuesDeCerrar(id: number, cambios: any) {
    return concatMap((guardado: Object) => {
      if (Number(cambios?.estado) !== 1) return of(guardado);
      return this.notificarCierre(id).pipe(
        tap(resumen => {
          if (resumen.sinCalcular > 0) this.avisoNotificaciones(
            `${resumen.sinCalcular} cuentas no tienen un calculo completo y no se notificaron.`);
        }),
        map(() => guardado),
        catchError(() => {
          this.avisoNotificaciones('El cierre se guardo, pero no se pudieron preparar los correos. Revise la cuenta de correo configurada y reintente las notificaciones.');
          return of(guardado);
        })
      );
    });
  }

  private normalizarPayloadFechas<T>(payload: T): T {
    if (!payload || typeof payload !== 'object') {
      return payload;
    }

    const normalizado: any = { ...(payload as any) };

    if (normalizado.fechacierre instanceof Date) {
      normalizado.fechacierre = this.toLocalDateString(normalizado.fechacierre);
    }

    return normalizado as T;
  }

  private toLocalDateString(fecha: Date): string {
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day = String(fecha.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
