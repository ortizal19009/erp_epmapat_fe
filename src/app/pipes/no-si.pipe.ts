import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'noSi',
})
export class NoSiPipe implements PipeTransform {
  transform(value: any, ...args: unknown[]): unknown {
    if (value == 0) return 'No';
    if (value == 1) return 'Si';
    if (value == false) return 'No';
    if (value == true) return 'Si';
    return null;
  }
}
