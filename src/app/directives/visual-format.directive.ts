import { Directive, ElementRef, forwardRef, HostListener, Input } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Directive({
   selector: '[appVisualFormat]',
   // standalone: true,
   providers: [{
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => VisualFormatDirective),
      multi: true
   }]
})

export class VisualFormatDirective implements ControlValueAccessor {

   @Input() minDecimals: number = 2;
   @Input() maxDecimals: number = 2;

   private onChange = (_: number | null) => { };
   private onTouched = () => { };

   constructor(private el: ElementRef<HTMLInputElement>) { }

   // 👉 Convierte número en string formateado
   private formatNumber(value: number): string {
      const parts = value.toFixed(this.maxDecimals).split('.');
      const integerPart = parts[0];
      const decimalPart = parts[1];

      // Separar miles con espacio
      const withSpaces = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
      return `${withSpaces}.${decimalPart}`;
   }

   // 👉 Convierte string formateado en número
   private parseFormatted(value: string): number | null {
      const raw = value.replace(/\s/g, '').replace(',', '.');
      const num = parseFloat(raw);
      return isNaN(num) ? null : num;
   }

   @HostListener('input', ['$event'])
   onInput(event: Event): void {
      const input = event.target as HTMLInputElement;
      const parsed = this.parseFormatted(input.value);
      this.onChange(parsed);
   }

   @HostListener('blur')
   onBlur(): void {
      const parsed = this.parseFormatted(this.el.nativeElement.value);
      if (parsed !== null) {
         this.el.nativeElement.value = this.formatNumber(parsed);
      }
      this.onTouched();
   }

   setDisabledState(isDisabled: boolean): void {
      this.el.nativeElement.disabled = isDisabled;
   }

   // @HostListener('keydown', ['$event']) ESTE Funciona (pero no controla 2 decimales)
   // onKeyDown(event: KeyboardEvent) {
   //    const allowedKeys = [
   //       'Backspace', 'Tab', 'ArrowLeft', 'ArrowRight',
   //       'Delete', 'Home', 'End',
   //       'Minus', '-', '.', ',', // si permites negativos y decimales
   //       ...Array(10).fill(0).map((_, i) => i.toString()) // '0' a '9'
   //    ];

   //    if (!allowedKeys.includes(event.key) && !event.ctrlKey && !event.metaKey) {
   //       event.preventDefault();
   //    }
   // }

   @HostListener('keydown', ['$event'])
   onKeyDown(event: KeyboardEvent): void {
      const input = this.el.nativeElement;
      const value = input.value ?? '';
      const key = event.key;
      const selectionStart = input.selectionStart ?? 0;
      const selectionEnd = input.selectionEnd ?? 0;

      const isNumber = /^[0-9]$/.test(key);
      const isControlKey = ['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'Delete', 'Home', 'End'].includes(key);
      const isDecimalPoint = key === '.' || key === ',';
      const isNegativeSign = key === '-' && selectionStart === 0;

      // ✅ Permitir teclas válidas
      if (!isNumber && !isControlKey && !isDecimalPoint && !isNegativeSign && !event.ctrlKey && !event.metaKey) {
         event.preventDefault();
         return;
      }

      // ✅ Permitir punto decimal solo si no existe aún
      if (isDecimalPoint && value.includes('.')) {
         event.preventDefault();
         return;
      }

      // 🧪 Simulación del valor final si se permite la tecla
      const simulated = value.slice(0, selectionStart) + key + value.slice(selectionEnd);
      const normalized = simulated.replace(',', '.');
      const decimalIndex = normalized.indexOf('.');

      if (decimalIndex >= 0) {
         const decimalDigits = normalized.slice(decimalIndex + 1).replace(/\D/g, '');

         // ⚠️ Bloquear si ya hay más de dos decimales después del punto
         if (isNumber && decimalDigits.length > 2 && selectionStart > decimalIndex) {
            event.preventDefault();
         }
      }
   }

   writeValue(value: number | null): void {
      if (typeof value === 'number') {
         this.el.nativeElement.value = this.formatNumber(value);
      } else {
         this.el.nativeElement.value = '';
      }
   }

   registerOnChange(fn: any): void {
      this.onChange = fn;
   }

   registerOnTouched(fn: any): void {
      this.onTouched = fn;
   }


}
