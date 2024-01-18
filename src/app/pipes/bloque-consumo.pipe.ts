import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'bloqueConsumo'
})

export class BloqueConsumoPipe implements PipeTransform {

  transform(desde: number, hasta: number): string {
    if(desde == 0 && hasta == 0 ) return 'Fijo'
    if(hasta == 9999999 ) return `> ${desde - 1} m3`
    return `${desde} - ${hasta} m3`;
  }

}
