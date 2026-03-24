/**
 * Recorta nomdoc para que junto con numdoc no supere maxLength.
 * numdoc siempre se muestra completo.
 */
export function formatDocumento(
   nomdoc: string | null | undefined,
   numdoc: string | null | undefined,
   maxLength = 12
): string {
   const safeNomdoc = nomdoc ?? '';
   const safeNumdoc = numdoc ?? '';

   if (safeNomdoc.trim() === '(Ninguno)') { return safeNumdoc }

   const availableLength = maxLength - safeNumdoc.length;

   // Si no queda espacio, solo mostramos numdoc
   if (availableLength <= 0) {
      return safeNumdoc;
   }

   // Recortamos nomdoc según el espacio disponible
   const trimmedNomdoc = safeNomdoc.substring(0, availableLength);

   return `${trimmedNomdoc} ${safeNumdoc}`;
}

// Retorna el nombre del tiptran
export function tiptranNombre(tiptran: number): string {
   const tiptranMap: { [key: number]: string } = {
      0: '',
      1: 'Desde Compromiso',
      2: 'Anticipo',
      3: 'Cuenta por cobrar',
      4: 'Cuenta por cobrar año anterior',
      5: 'Depósitos y fondos de terceros',
      6: 'Cuenta por pagar',
      7: 'Cuenta por pagar año anterior',
      8: 'Liquidación de anticipo',
      9: 'Cobro',
      10: 'Cobro del año anterior',
      11: 'Liquidación Depósitos o fondos de terceros',
      12: 'Pago'
   };
   return tiptranMap[tiptran] ?? '';
}

// Nombre del Comprobante
export function nomComprobante(tipcom: number, compro: number): string {
   const prefixMap: { [key: number]: string } = {
      1: 'I-',
      2: 'E-',
      3: 'DC-',
      4: 'DI-',
      5: 'DE-'
   };
   const prefix = prefixMap[tipcom] ?? '-';
   return `${prefix}${compro}`;
}

// Asiento y Nombre del comprobante
export function asientoYComprobante(numero: number, tipcom: number, compro: number): string {
   const prefixMap: { [key: number]: string } = {
      1: 'I-',
      2: 'E-',
      3: 'DC-',
      4: 'DI-',
      5: 'DE-'
   };
   const prefix = prefixMap[tipcom] ?? '-';
   const espacioNoRuptura = '\u00A0';
   return `${numero}${espacioNoRuptura}${espacioNoRuptura} ${prefix}${compro}`;
}