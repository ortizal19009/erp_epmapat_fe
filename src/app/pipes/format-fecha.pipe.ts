import { DatePipe } from '@angular/common';
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'formatFecha',
})
export class FormatFechaPipe implements PipeTransform {
  constructor() {}

  transform(value: any): string {
    if (!value) {
      return '';
    }

    let m = value.split('-');
    const monthNames = [
      'Enero',
      'Febrero',
      'Marzo',
      'Abril',
      'Mayo',
      'Junio',
      'Julio',
      'Agosto',
      'Septiembre',
      'Octubre',
      'Noviembre',
      'Diciembre',
    ];
    const month = monthNames[+m[1]-1];
    const year = m[0];

    return `${month} ${year}`;
  }
}
