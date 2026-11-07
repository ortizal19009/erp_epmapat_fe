import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export type ArchivoSinafip = 'apertura' | 'detalle-apertura' | 'balance' | 'reciprocas' | 'presupuesto' | 'cedula';
export interface BloqueSinafip { nombre: string; columnas: string[]; filas: string[][]; }
export interface ResultadoSinafip {
  archivo: ArchivoSinafip;
  anio: number;
  periodo: number;
  corte: string;
  bloques: BloqueSinafip[];
  avisos: string[];
}

export interface AsignacionSinafip {
  origen: 'benextran' | 'pagoscobros';
  idregistro: number;
  inttra: number;
  asiento: number;
  codcue: string;
  nomben: string;
  codcuereci: string | null;
  codparreci: string | null;
  asierefe: number | null;
  guardado?: boolean;
}

@Injectable({ providedIn: 'root' })
export class SinafipService {
  constructor(private http: HttpClient) {}

  generar(archivo: ArchivoSinafip, anio: number, periodo: number): Observable<ResultadoSinafip> {
    const params = new HttpParams().set('archivo', archivo).set('anio', anio).set('periodo', periodo);
    return this.http.get<ResultadoSinafip>(`${environment.API_URL}/sinafip/vista-previa`, { params });
  }

  asignaciones(anio: number, periodo: number): Observable<AsignacionSinafip[]> {
    return this.http.get<AsignacionSinafip[]>(`${environment.API_URL}/sinafip/reciprocas/asignaciones`, {
      params: new HttpParams().set('anio', anio).set('periodo', periodo)
    });
  }

  cuentas(): Observable<{ codcue: string; nomcue: string }[]> {
    return this.http.get<{ codcue: string; nomcue: string }[]>(`${environment.API_URL}/sinafip/cuentas`);
  }

  asignar(fila: AsignacionSinafip): Observable<void> {
    return this.http.put<void>(`${environment.API_URL}/sinafip/reciprocas/asignacion`, {
      origen: fila.origen, idregistro: fila.idregistro, codcuereci: fila.codcuereci,
      codparreci: fila.codparreci, asierefe: fila.asierefe
    });
  }
}
