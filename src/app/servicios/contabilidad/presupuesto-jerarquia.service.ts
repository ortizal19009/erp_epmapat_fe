import { Injectable } from '@angular/core';
import { forkJoin } from 'rxjs';
import { shareReplay } from 'rxjs/operators';
import { ClasificadorService } from '../clasificador.service';
import { EstrfuncService } from './estrfunc.service';

@Injectable({ providedIn: 'root' })
export class PresupuestoJerarquiaService {
  readonly catalogos$ = forkJoin({ clasificador: this.clasificador.getByCodigo(''), funciones: this.funciones.getListaEstrfunc() }).pipe(shareReplay(1));
  constructor(private clasificador: ClasificadorService, private funciones: EstrfuncService) { }
}
