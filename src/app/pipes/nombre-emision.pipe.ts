import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
   name: 'nombreEmision'
})
export class NombreEmisionPipe implements PipeTransform {

   transform(value: String, ...args: unknown[]): string {
      console.log(value)
      let a = +value!;
      let año = '20' + a.toString().slice(0, 2);
      let mes = a.toString().slice(2);
      switch (mes) {
         case '01': return 'Enero del ' + año;
         case '02': return 'Febrero del ' + año;
         case '03': return 'Marzo del ' + año;
         case '04': return 'Abril del ' + año;
         case '05': return 'Mayo del ' + año;
         case '06': return 'Junio del ' + año;
         case '07': return 'Julio del ' + año;
         case '08': return 'Agosto del ' + año;
         case '09': return 'Septiembre del ' + año;
         case '10': return 'Octubre del ' + año;
         case '11': return 'Noviembre del ' + año;
         case '12': return 'Diciembre del ' + año;
      }
      return '';
   }

}
