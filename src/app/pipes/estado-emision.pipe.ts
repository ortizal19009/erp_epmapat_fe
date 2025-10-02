import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'estadoEmision'
})
export class EstadoEmisionPipe implements PipeTransform {

  transform(value: unknown, ...args: unknown[]): unknown {
    if(value == 0) return "Abierta"
    else if(value == 1) return "Cerrada"
    return null;
  }

}
